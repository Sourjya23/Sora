const mongoose = require("mongoose");
const OutboxEvent = require("../../models/OutboxEvent");
const EmailJob = require("../../models/EmailJob");

class HealthAgent {
  constructor() {
    this.name = "Agent 4: Application Health & QA";
    this.priority = "P1";
    this.recentErrors = [];
    this.maxErrorHistory = 50;
  }

  /**
   * Log an operational runtime exception
   */
  logError(source, error, context = {}) {
    this.recentErrors.unshift({
      timestamp: new Date(),
      source,
      message: error?.message || String(error),
      stack: error?.stack?.split("\n").slice(0, 3).join("\n"),
      context,
    });
    if (this.recentErrors.length > this.maxErrorHistory) {
      this.recentErrors.pop();
    }
  }

  /**
   * Run diagnostic audit over application infrastructure
   */
  async runAudit() {
    const issues = [];

    // 1. Database Connection Health
    const dbState = mongoose.connection.readyState;
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    if (dbState !== 1) {
      issues.push({
        severity: "CRITICAL",
        category: "HEALTH",
        title: "MongoDB Connection Degraded",
        description: `MongoDB connection state is ${dbState} (not connected).`,
        affectedEntityId: "mongodb_cluster",
        suggestedFix: "Check MongoDB Atlas URI credentials, network whitelist, and server logs.",
      });
    }

    // 2. Transactional Outbox Backlog Depth
    const pendingOutbox = await OutboxEvent.countDocuments({ published: false });
    if (pendingOutbox > 100) {
      issues.push({
        severity: "WARNING",
        category: "HEALTH",
        title: "Outbox Queue Backlog High",
        description: `There are ${pendingOutbox} unpublished outbox events awaiting drain.`,
        affectedEntityId: "outbox_processor",
        suggestedFix: "Check EventBus outbox worker interval and MongoDB write throughput.",
      });
    }

    // 3. Email Queue Stuck Depth
    const now = new Date();
    const overdueQueue = await EmailJob.countDocuments({
      status: "QUEUED",
      scheduledFor: { $lte: new Date(now.getTime() - 5 * 60 * 1000) },
    });
    if (overdueQueue > 10) {
      issues.push({
        severity: "WARNING",
        category: "HEALTH",
        title: "Email Dispatch Runner Backlogged",
        description: `${overdueQueue} email jobs are overdue for dispatch by 5+ minutes.`,
        affectedEntityId: "email_orchestrator",
        suggestedFix: "Inspect SMTP rate limits or network connectivity to Gmail/Resend.",
      });
    }

    // 4. Runtime Exception Burst Check
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const recentBurst = this.recentErrors.filter((e) => e.timestamp >= fiveMinutesAgo);
    if (recentBurst.length >= 5) {
      issues.push({
        severity: "CRITICAL",
        category: "HEALTH",
        title: "Application Error Burst Detected",
        description: `${recentBurst.length} runtime exceptions occurred in the past 5 minutes. Top error: ${recentBurst[0]?.message}`,
        affectedEntityId: recentBurst[0]?.source || "api_server",
        suggestedFix: "Review stack trace and recent code deployments.",
      });
    }

    return {
      agent: this.name,
      status: issues.some((i) => i.severity === "CRITICAL") ? "CRITICAL" : issues.length > 0 ? "DEGRADED" : "HEALTHY",
      issues,
      metrics: {
        dbConnectionState: dbState === 1 ? "Connected" : "Disconnected",
        pendingOutboxCount: pendingOutbox,
        overdueEmailQueueCount: overdueQueue,
        recentErrorsCount: recentBurst.length,
      },
    };
  }
}

module.exports = new HealthAgent();
