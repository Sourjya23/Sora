const EmailJob = require("../../models/EmailJob");
const eventBus = require("../eventBus");

class CommunicationAgent {
  constructor() {
    this.name = "Agent 1: Communication Intelligence";
    this.priority = "P0";
  }

  /**
   * Run diagnostic audit over transactional email jobs
   */
  async runAudit() {
    const issues = [];
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

    // 1. Check for emails queued for more than 2 minutes without sending
    const stuckQueued = await EmailJob.find({
      status: "QUEUED",
      scheduledFor: { $lte: twoMinutesAgo },
    });

    for (const job of stuckQueued) {
      issues.push({
        severity: "WARNING",
        category: "COMMUNICATION",
        title: "Email Queued Delay Exceeded",
        description: `Email template ${job.template} to ${job.recipient} has been queued for over 2 minutes without dispatch.`,
        affectedEntityId: job.jobId,
        suggestedFix: "Inspect SMTP transporter connectivity or email queue runner process.",
      });
    }

    // 2. Check for failed or bounced emails
    const failedEmails = await EmailJob.find({
      status: { $in: ["FAILED", "BOUNCED"] },
      createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    });

    for (const job of failedEmails) {
      issues.push({
        severity: "CRITICAL",
        category: "COMMUNICATION",
        title: `Email Delivery Failed: ${job.template}`,
        description: `Failed delivering email to ${job.recipient} after ${job.attempts} attempt(s). Error: ${job.error || "Unknown provider error"}`,
        affectedEntityId: job.jobId,
        suggestedFix: "Verify recipient email address syntax and SMTP credentials in server/.env.",
      });
    }

    // 3. Check for missing 5-minute reminders
    const missedReminders = await EmailJob.find({
      template: "FIVE_MIN_REMINDER",
      status: "QUEUED",
      scheduledFor: { $lte: new Date(now.getTime() - 10 * 60 * 1000) },
    });

    for (const job of missedReminders) {
      issues.push({
        severity: "CRITICAL",
        category: "COMMUNICATION",
        title: "5-Minute Meeting Reminder Missed",
        description: `Meeting reminder for ${job.recipient} was scheduled for ${job.scheduledFor} but has not fired.`,
        affectedEntityId: job.jobId,
        suggestedFix: "Check delayed queue scheduler process and cron clock sync.",
      });
    }

    return {
      agent: this.name,
      status: issues.some((i) => i.severity === "CRITICAL") ? "CRITICAL" : issues.length > 0 ? "DEGRADED" : "HEALTHY",
      issues,
      metrics: {
        stuckQueuedCount: stuckQueued.length,
        failedCount: failedEmails.length,
        missedRemindersCount: missedReminders.length,
      },
    };
  }
}

module.exports = new CommunicationAgent();
