const Meeting = require("../models/Meeting");
const User = require("../models/User");
const InterviewTicket = require("../models/InterviewTicket");
const { v4: uuidv4 } = require("uuid");
const sendMeetingMail = require("../utils/sendMeetingMail");

exports.scheduleMeeting = async (req, res) => {
  try {
    const { ticketId, scheduledTime, keyPassword } = req.body;
    const interviewerId = req.user.id;

    if (!ticketId) {
      return res.status(400).json({ message: "Ticket ID is required" });
    }
    if (!scheduledTime) {
      return res.status(400).json({ message: "Scheduled time is required" });
    }
    if (!keyPassword || keyPassword.trim().length === 0) {
      return res.status(400).json({ message: "Key password is required" });
    }

    // Find the ticket and populate candidate info
    const ticket = await InterviewTicket.findById(ticketId).populate("candidateId");
    if (!ticket) {
      return res.status(404).json({ message: "Interview ticket not found" });
    }

    // Check if the ticket is already scheduled (prevent rescheduling)
    if (ticket.status === "scheduled") {
      return res.status(400).json({ message: "This interview has already been scheduled and locked. It cannot be rescheduled." });
    }

    const candidateId = ticket.candidateId._id;
    const meetingId = uuidv4();
    const secureToken = uuidv4();
    const meetingUrl = `http://localhost:5173/meeting/${meetingId}`;

    // Create the meeting with all details locked
    const meeting = await Meeting.create({
      candidateId,
      interviewerId,
      meetingId,
      token: secureToken,
      meetingUrl,
      scheduledTime: new Date(scheduledTime),
      keyPassword,
      jobId: ticket.jobId,
      jobDescription: ticket.jobDescription,
      resumeUrl: ticket.resumeUrl || ticket.candidateId.resumeUrl,
      status: "scheduled",
    });

    // Update ticket status to scheduled and lock it
    ticket.status = "scheduled";
    ticket.meetingId = meetingId;
    ticket.interviewerId = interviewerId;
    await ticket.save();

    const candidate = ticket.candidateId;
    const interviewer = await User.findById(interviewerId);

    // Send the meeting link and password to the candidate
    if (candidate && interviewer) {
      await sendMeetingMail(
        candidate.email, 
        "invite", 
        meetingUrl, 
        interviewer.name, 
        interviewer.email, 
        keyPassword, 
        scheduledTime
      );
    }

    res.status(201).json({
      message: "Meeting scheduled and locked. Details sent to candidate.",
      meeting,
    });
  } catch (error) {
    console.error("Meeting scheduling failed:", error);
    res.status(500).json({ message: "Meeting scheduling failed" });
  }
};

exports.notifyJoin = async (req, res) => {
  try {
    const { id } = req.params; // meetingId
    console.log("[notifyJoin] Request received for meetingId:", id);
    console.log("[notifyJoin] Current User ID from token:", req.user.id);

    const meeting = await Meeting.findOne({ meetingId: id }).populate("candidateId interviewerId");
    
    if (!meeting) {
      console.log("[notifyJoin] Meeting not found in database for ID:", id);
      return res.status(404).json({ message: "Meeting not found" });
    }

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      console.log("[notifyJoin] Current user not found in database for ID:", req.user.id);
      return res.status(404).json({ message: "User not found" });
    }

    // Only send the mail if the candidate is the one joining
    if (currentUser.role === "candidate") {
      if (meeting.interviewerId && meeting.interviewerId.email) {
        console.log("[notifyJoin] Attempting to send email to interviewer:", meeting.interviewerId.email);
        await sendMeetingMail(
          meeting.interviewerId.email,
          "joined",
          meeting.meetingUrl,
          currentUser.name
        );
        console.log("[notifyJoin] Email sent successfully");
      } else {
        console.log("[notifyJoin] Interviewer info or email missing on the meeting document");
      }
    }

    res.status(200).json({ message: "Join notification processed" });
  } catch (error) {
    console.error("[notifyJoin] Error notifying join:", error);
    res.status(500).json({ message: "Failed to process join notification" });
  }
};

exports.getMeetingDetails = async (req, res) => {
  try {
    const { id } = req.params; // meetingId
    const meeting = await Meeting.findOne({ meetingId: id })
      .populate("candidateId", "name email resumeUrl skills intro experienceLevel projects")
      .populate("interviewerId", "name email");

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.status(200).json({
      meetingId: meeting.meetingId,
      candidate: meeting.candidateId,
      interviewer: meeting.interviewerId,
      scheduledTime: meeting.scheduledTime,
      jobId: meeting.jobId,
      jobDescription: meeting.jobDescription,
      resumeUrl: meeting.resumeUrl,
      status: meeting.status,
    });
  } catch (error) {
    console.error("Get meeting details error:", error);
    res.status(500).json({ message: "Failed to fetch meeting details" });
  }
};

exports.verifyPassword = async (req, res) => {
  try {
    const { id } = req.params; // meetingId
    const { password } = req.body;

    const meeting = await Meeting.findOne({ meetingId: id });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (meeting.keyPassword !== password) {
      return res.status(400).json({ message: "Incorrect password. Access denied." });
    }

    res.status(200).json({ message: "Password verified successfully", verified: true });
  } catch (error) {
    console.error("Verify password error:", error);
    res.status(500).json({ message: "Failed to verify meeting password" });
  }
};

exports.getMyMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const meetings = await Meeting.find({
      $or: [{ candidateId: userId }, { interviewerId: userId }]
    })
      .populate("candidateId", "name email resumeUrl skills")
      .populate("interviewerId", "name email")
      .sort({ scheduledTime: 1 });

    res.status(200).json(meetings);
  } catch (error) {
    console.error("Get my meetings error:", error);
    res.status(500).json({ message: "Failed to fetch meetings" });
  }
};

const { generateProblem, PROBLEMS } = require("../utils/problemBank");

exports.generateProblemForMeeting = async (req, res) => {
  try {
    const { id } = req.params; // meetingId
    const meeting = await Meeting.findOne({ meetingId: id });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const problem = generateProblem(meeting.jobDescription);
    res.status(200).json(problem);
  } catch (error) {
    console.error("Generate problem error:", error);
    res.status(500).json({ message: "Failed to generate problem" });
  }
};

exports.getAllProblems = async (req, res) => {
  try {
    const flatProblems = [
      ...PROBLEMS.easy.map(p => ({ ...p, difficulty: "Easy" })),
      ...PROBLEMS.medium.map(p => ({ ...p, difficulty: "Medium" })),
      ...PROBLEMS.hard.map(p => ({ ...p, difficulty: "Hard" }))
    ];
    res.status(200).json(flatProblems);
  } catch (error) {
    console.error("Get problem bank error:", error);
    res.status(500).json({ message: "Failed to fetch problem bank" });
  }
};

exports.uploadRecording = async (req, res) => {
  try {
    const { id } = req.params; // meetingId
    const meeting = await Meeting.findOne({ meetingId: id });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (req.file) {
      meeting.recordingUrl = req.file.path; // Cloudinary URL
      meeting.status = "completed";
      await meeting.save();
      res.status(200).json({ message: "Recording uploaded successfully", recordingUrl: meeting.recordingUrl });
    } else {
      res.status(400).json({ message: "No recording file provided" });
    }
  } catch (error) {
    console.error("Upload recording error:", error);
    res.status(500).json({ message: "Failed to upload recording" });
  }
};

exports.getCompletedMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const meetings = await Meeting.find({
      $or: [{ candidateId: userId }, { interviewerId: userId }],
      status: { $in: ["completed", "approved", "rejected"] }
    })
      .populate("candidateId", "name email")
      .populate("interviewerId", "name email")
      .sort({ scheduledTime: -1 });

    res.status(200).json(meetings);
  } catch (error) {
    console.error("Get completed meetings error:", error);
    res.status(500).json({ message: "Failed to fetch completed meetings" });
  }
};

const sendReviewMail = require("../utils/sendReviewMail");

exports.reviewCandidate = async (req, res) => {
  try {
    const { id } = req.params; // meetingId
    const { status } = req.body; // "approved" or "rejected"

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const meeting = await Meeting.findOne({ meetingId: id })
      .populate("candidateId")
      .populate("interviewerId");

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Also update ticket
    const ticket = await InterviewTicket.findOne({ meetingId: id });

    meeting.status = status;
    await meeting.save();

    if (ticket) {
      ticket.status = status;
      await ticket.save();
    }

    // Send email to candidate
    if (meeting.candidateId && meeting.candidateId.email) {
      await sendReviewMail(
        meeting.candidateId.email,
        meeting.candidateId.name,
        status,
        meeting.interviewerId ? meeting.interviewerId.name : "Your Interviewer"
      );
    }

    res.status(200).json({ message: `Candidate has been ${status}.` });
  } catch (error) {
    console.error("Review candidate error:", error);
    res.status(500).json({ message: "Failed to review candidate" });
  }
};
