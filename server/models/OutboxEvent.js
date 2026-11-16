const mongoose = require("mongoose");

const outboxEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    eventVersion: {
      type: Number,
      default: 1,
    },
    occurredAt: {
      type: Date,
      default: Date.now,
    },
    aggregateType: {
      type: String,
      required: true, // "INTERVIEW", "MEETING", "EMAIL", "USER"
    },
    aggregateId: {
      type: String,
      required: true,
      index: true,
    },
    actor: {
      id: String,
      role: String,
      name: String,
    },
    correlationId: {
      type: String,
      index: true,
    },
    causationId: String,
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: Date,
    attempts: {
      type: Number,
      default: 0,
    },
    lastError: String,
  },
  {
    timestamps: true,
  }
);

outboxEventSchema.index({ published: 1, createdAt: 1 });

module.exports = mongoose.model("OutboxEvent", outboxEventSchema);
