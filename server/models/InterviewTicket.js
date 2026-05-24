const mongoose = require("mongoose");

const interviewTicketSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: String,
    description: String,
    jobId: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    resumeUrl: {
      type: String,
    },
    preferredSlotStart: {
      type: Date,
      required: true,
    },
    preferredSlotEnd: {
      type: Date,
      required: true,
    },
    meetingId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "scheduled", "approved", "rejected", "completed", "dismissed"],
      default: "pending",
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("InterviewTicket", interviewTicketSchema);
