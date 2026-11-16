const mongoose = require("mongoose");

const forensicFindingSchema = new mongoose.Schema(
  {
    findingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    interviewId: {
      type: String,
      index: true,
    },
    category: {
      type: String,
      enum: [
        "CLIPBOARD_ACTIVITY",
        "TAB_VISIBILITY",
        "CODE_SUBSTITUTION",
        "AUDIO_DISPARITY",
        "COMPLEXITY_ANOMALY",
        "SCREEN_SHARE_INTERRUPTION",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["INFORMATIONAL", "LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "INFORMATIONAL",
      index: true,
    },
    offsetMs: {
      type: Number,
      required: true, // Millisecond offset from interview start
      index: true,
    },
    wallClock: {
      type: Date,
      default: Date.now,
    },
    evidence: {
      description: String,
      codeSnippet: String,
      characterCount: Number,
      tabName: String,
      screenTrackOffsetMs: Number,
      transcriptSnippet: String,
    },
    correlatedEvidence: [String],
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.85,
    },
    humanReviewStatus: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DISMISSED"],
      default: "PENDING",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    reviewerNotes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ForensicFinding", forensicFindingSchema);
