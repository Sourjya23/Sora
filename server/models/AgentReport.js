const mongoose = require("mongoose");

const agentReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reportType: {
      type: String,
      enum: ["CRITICAL_ALERT", "DAILY_INTELLIGENCE", "HOURLY_SUMMARY", "AUDIT_RECONCILIATION"],
      required: true,
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    periodStart: Date,
    periodEnd: Date,
    systemStatus: {
      type: String,
      enum: ["HEALTHY", "DEGRADED", "ISSUES_DETECTED", "CRITICAL"],
      default: "HEALTHY",
    },
    metrics: {
      interviewsScheduled: { type: Number, default: 0 },
      interviewsCompleted: { type: Number, default: 0 },
      workflowFailures: { type: Number, default: 0 },
      recordingsMissing: { type: Number, default: 0 },
      recordingsVerified: { type: Number, default: 0 },
      emailsQueued: { type: Number, default: 0 },
      emailsDelivered: { type: Number, default: 0 },
      emailsBounced: { type: Number, default: 0 },
      forensicsProcessed: { type: Number, default: 0 },
      criticalAlertsCount: { type: Number, default: 0 },
    },
    issues: [
      {
        severity: {
          type: String,
          enum: ["CRITICAL", "WARNING", "INFO"],
          default: "INFO",
        },
        category: String, // "COMMUNICATION", "MEETING", "RECORDING", "FORENSICS", "HEALTH"
        title: String,
        description: String,
        affectedEntityId: String,
        suggestedFix: String,
        resolved: { type: Boolean, default: false },
        resolvedAt: Date,
      },
    ],
    agentAudits: {
      agent1_communication: { status: String, notes: String },
      agent2_reliability: { status: String, notes: String },
      agent3_forensics: { status: String, notes: String },
      agent4_health: { status: String, notes: String },
    },
    deliveryStatus: {
      sent: { type: Boolean, default: false },
      recipient: String,
      deliveredAt: Date,
      providerMessageId: String,
      error: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AgentReport", agentReportSchema);
