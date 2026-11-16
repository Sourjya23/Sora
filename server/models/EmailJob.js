const mongoose = require("mongoose");

const emailJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    interviewId: {
      type: String,
      index: true,
    },
    meetingId: {
      type: String,
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      index: true,
    },
    template: {
      type: String,
      enum: [
        "USER_WELCOME",
        "TICKET_CONFIRMATION",
        "INTERVIEW_PROPOSAL",
        "SLOT_CONFIRMED_CANDIDATE",
        "SLOT_CONFIRMED_INTERVIEWER",
        "FIVE_MIN_REMINDER",
        "INTERVIEW_ENDED",
        "CANDIDATE_SELECTED",
        "CANDIDATE_REJECTED",
        "SENTINEL_CRITICAL_ALERT",
        "SENTINEL_DAILY_INTELLIGENCE",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["QUEUED", "SENT", "DELIVERED", "FAILED", "BOUNCED", "CANCELLED"],
      default: "QUEUED",
      index: true,
    },
    provider: {
      type: String,
      default: "SMTP",
    },
    providerMessageId: String,
    subject: String,
    attempts: {
      type: Number,
      default: 0,
    },
    scheduledFor: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastAttemptAt: Date,
    deliveredAt: Date,
    error: String,
    idempotencyKey: {
      type: String,
      unique: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

emailJobSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model("EmailJob", emailJobSchema);
