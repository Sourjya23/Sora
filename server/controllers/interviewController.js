const InterviewTicket = require("../models/InterviewTicket");
const User = require("../models/User");
const sendNotificationMail = require("../utils/sendNotificationMail");

exports.raiseTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, jobId, jobDescription, preferredSlotStart, preferredSlotEnd } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.profileCompleted) {
      return res.status(400).json({ message: "Complete profile first" });
    }

    if (!user.nationalIdVerified) {
      return res.status(400).json({ message: "National ID not verified" });
    }

    // 1. Strict Validation: Job ID (must be JOB-XXXXX format)
    if (!jobId || !/^JOB-\d{5}$/.test(jobId)) {
      return res.status(400).json({ message: "Job ID must be in format JOB-XXXXX (e.g., JOB-12345)" });
    }

    // 2. Strict Validation: Job Description (min 50 characters)
    if (!jobDescription || jobDescription.trim().length < 50) {
      return res.status(400).json({ message: "Job Description (JD) must be at least 50 characters long" });
    }

    // 3. Strict Validation: Slots (future and end > start)
    const start = new Date(preferredSlotStart);
    const end = new Date(preferredSlotEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date/time format for preferred slot" });
    }
    if (start < new Date()) {
      return res.status(400).json({ message: "Preferred slot start time must be in the future" });
    }
    if (end <= start) {
      return res.status(400).json({ message: "Preferred slot end time must be after the start time" });
    }

    // 4. Strict Validation: Resume (uploaded file or fallback to existing user resume)
    let resumeUrl = "";
    if (req.file) {
      resumeUrl = req.file.path; // Cloudinary URL
      // Save it back to user profile as well to keep their latest progress
      user.resumeUrl = resumeUrl;
      await user.save();
    } else if (user.resumeUrl) {
      resumeUrl = user.resumeUrl;
    } else {
      return res.status(400).json({ message: "Resume upload is required" });
    }

    // 5. Create Interview Ticket
    const ticket = await InterviewTicket.create({
      candidateId: userId,
      title: title || `Interview for Job ${jobId}`,
      description: description || `Technical interview assessment for Job ID: ${jobId}`,
      jobId,
      jobDescription,
      resumeUrl,
      preferredSlotStart: start,
      preferredSlotEnd: end,
      status: "pending",
    });

    // 6. Notify all interviewers via mail
    const interviewers = await User.find({ role: "interviewer" });
    for (const interviewer of interviewers) {
      if (interviewer.email) {
        await sendNotificationMail(
          interviewer.email,
          user.name,
          user.email,
          jobId,
          jobDescription,
          start,
          end,
          resumeUrl
        );
      }
    }

    res.status(201).json({
      message: "Interview ticket raised successfully, and interviewers have been notified.",
      ticket,
    });
  } catch (error) {
    console.error("Raise ticket error:", error);
    res.status(500).json({ message: "Failed to raise ticket" });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== "interviewer") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const tickets = await InterviewTicket.find({ status: "pending" })
      .populate("candidateId", "name email resumeUrl skills intro experienceLevel projects")
      .sort({ createdAt: -1 });
      
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
};

exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const tickets = await InterviewTicket.find({ candidateId: userId, status: "pending" });
    res.status(200).json(tickets);
  } catch (error) {
    console.error("Fetch my tickets error:", error);
    res.status(500).json({ message: "Failed to fetch my tickets" });
  }
};

const Meeting = require("../models/Meeting");

exports.dismissTicket = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== "interviewer") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const ticket = await InterviewTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.status = "dismissed";
    await ticket.save();

    if (ticket.meetingId) {
      const meeting = await Meeting.findOne({ meetingId: ticket.meetingId });
      if (meeting) {
        meeting.status = "dismissed";
        await meeting.save();
      }
    }

    res.status(200).json({ message: "Ticket dismissed successfully" });
  } catch (error) {
    console.error("Dismiss ticket error:", error);
    res.status(500).json({ message: "Failed to dismiss ticket" });
  }
};
