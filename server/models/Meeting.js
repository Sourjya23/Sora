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
      isProcessing: { type: Boolean, default: false }
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Meeting", meetingSchema);
