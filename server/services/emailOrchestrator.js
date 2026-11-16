const { v4: uuidv4 } = require("uuid");
const EmailJob = require("../models/EmailJob");
const { sendEmail } = require("../utils/emailService");
const eventBus = require("./eventBus");

class EmailOrchestrator {
  constructor() {
    this.isProcessing = false;
  }

  /**
   * Queue a transactional email job with strict idempotency
   */
  async queueEmail({
    interviewId = null,
    meetingId = null,
    recipient,
    template,
    subject,
    html,
    scheduledFor = new Date(),
    idempotencyKey = null,
    metadata = {},
  }) {
    const key = idempotencyKey || `${template}_${recipient}_${interviewId || meetingId || Date.now()}`;

    // 1. Check idempotency
    const existing = await EmailJob.findOne({ idempotencyKey: key });
    if (existing) {
      console.log(`[EmailOrchestrator] Duplicate suppressed by idempotency key: ${key}`);
      return existing;
    }

    const jobId = `email_${uuidv4().replace(/-/g, "").slice(0, 16)}`;

    // 2. Insert EmailJob record
    const job = await EmailJob.create({
      jobId,
      interviewId,
      meetingId,
      recipient,
      template,
      subject,
      scheduledFor: new Date(scheduledFor),
      idempotencyKey: key,
      metadata: { ...metadata, html },
      status: "QUEUED",
      attempts: 0,
    });

    // 3. Emit Outbox Event
    eventBus.emitEvent(
      "EMAIL.QUEUED",
      "EMAIL",
      jobId,
      { template, recipient, scheduledFor },
      null,
      job.idempotencyKey
    );

    // If scheduled for now, trigger immediate process
    if (new Date(scheduledFor) <= new Date()) {
      this.dispatchJob(job).catch((e) => console.error(`[EmailOrchestrator] Immediate dispatch failed:`, e.message));
    }

    return job;
  }

  /**
   * Cancel pending scheduled reminders (e.g., if interview was rescheduled or cancelled)
   */
  async cancelScheduledReminder(interviewId) {
    const updated = await EmailJob.updateMany(
      { interviewId, template: "FIVE_MIN_REMINDER", status: "QUEUED" },
      { $set: { status: "CANCELLED", error: "Interview was rescheduled or cancelled" } }
    );
    console.log(`[EmailOrchestrator] Cancelled ${updated.modifiedCount} pending reminder(s) for interview ${interviewId}`);
  }

  /**
   * Schedule the 5-minute advance reminder for candidate & interviewer
   */
  async scheduleFiveMinuteReminder({ interviewId, meetingId, scheduledTime, candidate, interviewer, meetingUrl, keyPassword }) {
    // 5 minutes before scheduled start time
    const start = new Date(scheduledTime);
    const reminderTime = new Date(start.getTime() - 5 * 60 * 1000);

    // Candidate reminder
    await this.queueEmail({
      interviewId,
      meetingId,
      recipient: candidate.email,
      template: "FIVE_MIN_REMINDER",
      subject: `Starts in 5 minutes: Your Technical Assessment on Sora`,
      scheduledFor: reminderTime > new Date() ? reminderTime : new Date(),
      idempotencyKey: `REMINDER_CANDIDATE_${meetingId || interviewId}`,
      metadata: {
        role: "candidate",
        name: candidate.name,
        meetingUrl,
        keyPassword,
        scheduledTime: start,
      },
    });

    // Interviewer reminder
    await this.queueEmail({
      interviewId,
      meetingId,
      recipient: interviewer.email,
      template: "FIVE_MIN_REMINDER",
      subject: `Starts in 5 minutes: Interview with ${candidate.name} on Sora`,
      scheduledFor: reminderTime > new Date() ? reminderTime : new Date(),
      idempotencyKey: `REMINDER_INTERVIEWER_${meetingId || interviewId}`,
      metadata: {
        role: "interviewer",
        name: interviewer.name,
        candidateName: candidate.name,
        meetingUrl,
        keyPassword,
        scheduledTime: start,
      },
    });
  }

  /**
   * Dispatch an individual EmailJob
   */
  async dispatchJob(job) {
    if (job.status === "DELIVERED" || job.status === "CANCELLED") return;

    try {
      const htmlContent = job.metadata?.html || this.generateTemplateHtml(job);

      const result = await sendEmail({
        to: job.recipient,
        subject: job.subject,
        html: htmlContent,
      });

      job.status = "DELIVERED";
      job.deliveredAt = new Date();
      job.lastAttemptAt = new Date();
      job.providerMessageId = result.messageId || `smtp_${Date.now()}`;
      job.attempts += 1;
      await job.save();

      eventBus.emitEvent(
        "EMAIL.DELIVERED",
        "EMAIL",
        job.jobId,
        {
          template: job.template,
          recipient: job.recipient,
          messageId: job.providerMessageId,
        },
        null,
        job.idempotencyKey
      );

      console.log(`[EmailOrchestrator] Successfully delivered ${job.template} to ${job.recipient}`);
    } catch (err) {
      console.error(`[EmailOrchestrator] Failed delivering ${job.template} to ${job.recipient}:`, err.message);
      job.attempts += 1;
      job.lastAttemptAt = new Date();
      job.error = err.message;
      if (job.attempts >= 3) {
        job.status = "FAILED";
        eventBus.emitEvent(
          "EMAIL.FAILED",
          "EMAIL",
          job.jobId,
          { template: job.template, recipient: job.recipient, error: err.message, attempts: job.attempts },
          null,
          job.idempotencyKey
        );
      }
      await job.save();
    }
  }

  /**
   * Generate default template HTML when not passed explicitly
   */
  generateTemplateHtml(job) {
    const meta = job.metadata || {};
    if (job.template === "FIVE_MIN_REMINDER") {
      return `
        <div style="font-family: sans-serif; background: #041826; color: #ffffff; padding: 28px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(56, 189, 248, 0.3);">
          <div style="font-family: Georgia, serif; font-size: 24px; color: #38bdf8; margin-bottom: 16px;">Sora &bull; 5-Minute Reminder</div>
          <h2 style="margin: 0 0 12px; font-size: 20px;">Your session begins in 5 minutes! ⏱️</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Hello ${meta.name || "Participant"}, please enter your pre-join lobby now to complete your camera, microphone, and screen share verification.
          </p>
          <div style="background: rgba(3, 19, 32, 0.8); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 12px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #94a3b8;">Meeting Room Passcode:</p>
            <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #38bdf8; letter-spacing: 2px;">${meta.keyPassword || "PASS-XXXX"}</span>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${meta.meetingUrl}" style="background: linear-gradient(135deg, #38bdf8, #2563eb); color: #02101b; padding: 12px 32px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
              Join Meeting Room &rarr;
            </a>
          </div>
        </div>
      `;
    }

    if (job.template === "SENTINEL_CRITICAL_ALERT") {
      return `
        <div style="font-family: sans-serif; background: #1a0505; color: #ffffff; padding: 28px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(244, 63, 94, 0.4);">
          <div style="font-family: monospace; font-size: 12px; text-transform: uppercase; color: #fb7185; letter-spacing: 1px;">SORA SENTINEL CRITICAL ALERT</div>
          <h2 style="color: #f43f5e; margin: 8px 0 16px;">${meta.title || "Workflow Invariant Violation Detected"}</h2>
          <p style="color: #fecdd3; font-size: 14px; line-height: 1.6;">${meta.description || ""}</p>
          <div style="background: #2a0b0b; padding: 16px; border-radius: 12px; border: 1px solid rgba(244, 63, 94, 0.3); font-size: 13px; margin: 16px 0;">
            <p style="margin: 0 0 6px; color: #fca5a5;"><strong>Affected Entity:</strong> ${meta.affectedEntityId || "N/A"}</p>
            <p style="margin: 0; color: #fca5a5;"><strong>Recommended Fix:</strong> ${meta.suggestedFix || "Investigate logs immediately."}</p>
          </div>
          <p style="color: #9f1239; font-size: 11px; margin-top: 24px;">Generated autonomously by Sora Sentinel Supervisor.</p>
        </div>
      `;
    }

    return `<p>${job.subject}</p>`;
  }

  /**
   * Background Queue Runner: Process pending QUEUED jobs
   */
  async processPendingJobs() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();
      const pendingJobs = await EmailJob.find({
        status: "QUEUED",
        scheduledFor: { $lte: now },
      })
        .sort({ scheduledFor: 1 })
        .limit(25);

      for (const job of pendingJobs) {
        await this.dispatchJob(job);
      }
    } catch (err) {
      console.error("[EmailOrchestrator] Queue processing error:", err.message);
    } finally {
      this.isProcessing = false;
    }
  }
}

const emailOrchestrator = new EmailOrchestrator();

// Run email queue processor every 15 seconds
setInterval(() => {
  emailOrchestrator.processPendingJobs().catch((e) => console.error("[Email Queue Worker] Error:", e));
}, 15000);

module.exports = emailOrchestrator;
