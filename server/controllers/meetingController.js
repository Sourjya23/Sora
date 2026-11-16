const Meeting = require("../models/Meeting");
const User = require("../models/User");
const InterviewTicket = require("../models/InterviewTicket");
const RecordingManifest = require("../models/RecordingManifest");
const { v4: uuidv4 } = require("uuid");
const sendMeetingMail = require("../utils/sendMeetingMail");
const hrAgentService = require("../services/hrAgentService");
const emailOrchestrator = require("../services/emailOrchestrator");
const eventBus = require("../services/eventBus");
const forensicAgent = require("../services/agents/forensicAgent");

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
    const meetingUrl = `https://sorabuild.netlify.app/meeting/${meetingId}`;

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
      status: "SLOT_CONFIRMED",
    });

    // Update ticket status to scheduled and lock it
    ticket.status = "scheduled";
    ticket.meetingId = meetingId;
    ticket.interviewerId = interviewerId;
    await ticket.save();

    const candidate = ticket.candidateId;
    const interviewer = await User.findById(interviewerId);

    // Schedule 5-minute pre-interview reminder
    if (candidate && interviewer) {
      emailOrchestrator.scheduleFiveMinuteReminder({
        interviewId: meeting._id.toString(),
        meetingId,
        scheduledTime: new Date(scheduledTime),
        candidate: { name: candidate.name, email: candidate.email },
        interviewer: { name: interviewer.name, email: interviewer.email },
        meetingUrl,
        keyPassword,
      }).catch((remErr) => console.warn("[scheduleMeeting] Reminder schedule fallback:", remErr.message));

      // Dispatch customized candidate invite email via Central Email Orchestrator
      emailOrchestrator.queueEmail({
        interviewId: meeting._id.toString(),
        meetingId,
        recipient: candidate.email,
        template: "INVITE_CANDIDATE",
        subject: `Technical Assessment Confirmed: Role ${ticket.jobId || "Assessment"} on Sora`,
        html: emailOrchestrator.templates.INVITE_CANDIDATE({
          candidateName: candidate.name,
          interviewerName: interviewer.name,
          scheduledTime: new Date(scheduledTime).toLocaleString(),
          meetingUrl,
          keyPassword,
          jobId: ticket.jobId,
        }),
        idempotencyKey: `INVITE_CANDIDATE_${meetingId}`,
      }).catch((e) => console.warn("[scheduleMeeting] Candidate invite queue err:", e.message));

      // Dispatch customized interviewer invite email via Central Email Orchestrator
      emailOrchestrator.queueEmail({
        interviewId: meeting._id.toString(),
        meetingId,
        recipient: interviewer.email,
        template: "INVITE_INTERVIEWER",
        subject: `Session Scheduled: Technical Interview with ${candidate.name}`,
        html: emailOrchestrator.templates.INVITE_INTERVIEWER({
          interviewerName: interviewer.name,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          scheduledTime: new Date(scheduledTime).toLocaleString(),
          meetingUrl,
          keyPassword,
          jobId: ticket.jobId,
          resumeUrl: ticket.resumeUrl || candidate.resumeUrl,
        }),
        idempotencyKey: `INVITE_INTERVIEWER_${meetingId}`,
      }).catch((e) => console.warn("[scheduleMeeting] Interviewer invite queue err:", e.message));
    }

    // Emit Transactional Outbox Event
    eventBus.emitEvent("INTERVIEW.SLOT_CONFIRMED", "INTERVIEW", meeting._id.toString(), {
      meetingId,
      candidateId: candidateId.toString(),
      interviewerId: interviewerId.toString(),
      scheduledTime,
      jobId: ticket.jobId,
    }).catch((busErr) => console.warn("[scheduleMeeting] Outbox event err:", busErr.message));

    // Also notify legacy HR Agent
    try {
      await hrAgentService.dispatchCustomInvites(meetingId);
    } catch (inviteErr) {
      console.warn("[scheduleMeeting] Custom invites fallback:", inviteErr);
    }

    res.status(201).json({
      message: "Meeting scheduled and locked. Details sent to candidate and interviewer.",
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
      forensicReport: meeting.forensicReport,
      aiVerdict: meeting.aiVerdict,
      interviewerFeedback: meeting.interviewerFeedback,
      finalDecision: meeting.finalDecision,
      hrWorkflow: meeting.hrWorkflow,
      recordingUrl: meeting.recordingUrl,
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

exports.submitReadiness = async (req, res) => {
  try {
    const { id } = req.params; // meetingId
    const { cameraVerified, micVerified, screenShareVerified, networkLatencyMs, browserChecked } = req.body;

    const meeting = await Meeting.findOne({ meetingId: id });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    meeting.readiness = {
      cameraVerified: Boolean(cameraVerified),
      micVerified: Boolean(micVerified),
      screenShareVerified: Boolean(screenShareVerified),
      networkLatencyMs: Number(networkLatencyMs) || 45,
      browserChecked: Boolean(browserChecked),
      verifiedAt: new Date(),
    };

    if (["scheduled", "SLOT_CONFIRMED", "PRE_INTERVIEW_CHECK"].includes(meeting.status)) {
      meeting.status = "READY_FOR_INTERVIEW";
    }
    await meeting.save();

    eventBus.emitEvent("MEETING.READINESS_UPDATED", "MEETING", meeting._id.toString(), {
      meetingId: id,
      readiness: meeting.readiness,
      status: meeting.status,
    }).catch((e) => console.warn("[submitReadiness] Event emit failed:", e.message));

    res.status(200).json({
      message: "System readiness recorded successfully",
      readiness: meeting.readiness,
      status: meeting.status,
    });
  } catch (err) {
    console.error("Submit readiness error:", err);
    res.status(500).json({ message: "Failed to record readiness" });
  }
};

const { processInterviewVideo } = require("../utils/aiForensics");

exports.uploadRecording = async (req, res) => {
  try {
    const { id } = req.params; // meetingId
    const { finalCode, problemStatement, telemetryEvents } = req.body;
    
    const meeting = await Meeting.findOne({ meetingId: id });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    if (req.file) {
      meeting.recordingUrl = req.file.path; // Cloudinary URL
    }
    meeting.status = "RECORDING_VERIFIED";
    
    // Initialize forensic report processing state
    meeting.forensicReport = { isProcessing: true };

    // Create Multi-track Recording Manifest
    const manifestId = `rmf_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
    const recordingManifest = await RecordingManifest.create({
      manifestId,
      meetingId: id,
      interviewId: meeting._id.toString(),
      status: req.file ? "VERIFIED" : "INITIALIZED",
      tracks: [
        ...(req.file
          ? [
              {
                type: "COMPOSITE_AV",
                storageUrl: req.file.path,
                mimeType: req.file.mimetype || "video/webm",
                sizeBytes: req.file.size || 0,
                verified: true,
              },
            ]
          : []),
      ],
      totalDurationSeconds: 0,
      verifiedAt: new Date(),
    });
    meeting.recordingManifestId = recordingManifest._id;
    await meeting.save();

    // Emit RECORDING.VERIFIED Outbox event
    eventBus.emitEvent("RECORDING.VERIFIED", "RECORDING", manifestId, {
      meetingId: id,
      storageUrl: req.file?.path,
      hasVideo: Boolean(req.file),
    }).catch((e) => console.warn("[uploadRecording] Outbox event failed:", e.message));

    // Also update associated ticket to completed
    await InterviewTicket.updateOne(
      { meetingId: id },
      { $set: { status: "completed" } }
    );
    
    // Trigger background AI forensic & HR Agent verdict job
    let parsedTelemetry = [];
    try {
      if (telemetryEvents) parsedTelemetry = JSON.parse(telemetryEvents);
    } catch(e) {}

    // Process granular findings via Agent 3 (Forensic Intelligence)
    forensicAgent.processTelemetryIntoFindings(id, parsedTelemetry).catch((fErr) => {
      console.warn("[uploadRecording] Granular forensic finding process err:", fErr.message);
    });
    
    processInterviewVideo(
      id, 
      meeting.recordingUrl, 
      finalCode || "No code submitted", 
      problemStatement || "No problem statement", 
      parsedTelemetry
    );

    // AI Analysis & Verdict Generation via HR Agent
    hrAgentService.generateAIAnalysisAndVerdict({
      meetingId: id,
      recordingUrl: meeting.recordingUrl,
      finalCode: finalCode || "No code submitted",
      problemStatement: problemStatement || "No problem statement",
      telemetryEvents: parsedTelemetry,
    });

    res.status(200).json({ 
      message: "Session concluded, multi-track manifest created, AI forensic analysis and HR verdict in progress", 
      recordingUrl: meeting.recordingUrl,
      manifestId: recordingManifest.manifestId,
    });
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
      .populate("candidateId", "name email resumeUrl skills intro experienceLevel")
      .populate("interviewerId", "name email")
      .sort({ scheduledTime: -1 });

    res.status(200).json(meetings);
  } catch (error) {
    console.error("Get completed meetings error:", error);
    res.status(500).json({ message: "Failed to fetch completed meetings" });
  }
};

exports.reviewCandidate = async (req, res) => {
  try {
    const { id } = req.params; // meetingId
    const { status, rating, verdict, notes } = req.body; // "approved" or "rejected"

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const result = await hrAgentService.finalizeDecisionAndNotifyCandidate({
      meetingId: id,
      decision: status,
      interviewerRating: rating,
      interviewerVerdict: verdict,
      interviewerNotes: notes,
      decidedBy: req.user.id,
    });

    res.status(200).json({
      message: `Candidate has been ${status}. Custom email dispatched by HR Agent.`,
      ...result,
    });
  } catch (error) {
    console.error("Review candidate error:", error);
    res.status(500).json({ message: "Failed to review candidate" });
  }
};

exports.getDecisionDossier = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findOne({ meetingId: id })
      .populate("candidateId", "name email resumeUrl skills intro experienceLevel projects")
      .populate("interviewerId", "name email");

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    res.status(200).json(meeting);
  } catch (error) {
    console.error("Get decision dossier error:", error);
    res.status(500).json({ message: "Failed to fetch decision dossier" });
  }
};
