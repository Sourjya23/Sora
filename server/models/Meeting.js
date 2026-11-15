const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    meetingId: String,
    token: String,
    meetingUrl: String,
    recordingUrl: String,
    transcriptUrl: String,
    scheduledTime: Date,
    keyPassword: {
      type: String,
      required: true,
    },
    jobId: String,
    jobDescription: String,
    resumeUrl: String,
    status: {
      type: String,
      enum: ["scheduled", "live", "completed", "dismissed", "approved", "rejected"],
      default: "scheduled",
    },
    forensicReport: {
      timeComplexity: String,
      spaceComplexity: String,
      codeCorrectness: String,
      screenSharedEntirely: Boolean,
      tabChanges: [String],
      copyPasted: [String],
      recommendation: String,
      detailedSummary: String,
      isProcessing: { type: Boolean, default: false },
    },
    interviewerFeedback: {
      rating: { type: Number, default: 0 },
      verdict: { type: String, default: "" },
      notes: { type: String, default: "" },
      strengths: [String],
      growthAreas: [String],
      submittedAt: Date,
    },
    aiVerdict: {
      verdict: { type: String, default: "" },
      confidenceScore: { type: Number, default: 0 },
      technicalScore: { type: Number, default: 0 },
      integrityScore: { type: Number, default: 0 },
      problemSolvingScore: { type: Number, default: 0 },
      summary: { type: String, default: "" },
      strengths: [String],
      growthAreas: [String],
      analyzedAt: Date,
    },
    finalDecision: {
      decision: {
        type: String,
        enum: ["pending", "selected", "rejected"],
        default: "pending",
      },
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      decidedAt: Date,
      notes: { type: String, default: "" },
      customEmailSent: { type: Boolean, default: false },
      customEmailSentAt: Date,
    },
    hrWorkflow: {
      stage: {
        type: String,
        enum: ["invited", "in_interview", "analyzing", "decision_ready", "decided"],
        default: "invited",
      },
      inviteSentCandidate: { type: Boolean, default: false },
      inviteSentInterviewer: { type: Boolean, default: false },
      videoStored: { type: Boolean, default: false },
      history: [
        {
          event: String,
          timestamp: { type: Date, default: Date.now },
          details: String,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Meeting", meetingSchema);
