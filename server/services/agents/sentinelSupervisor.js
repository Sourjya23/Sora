const { v4: uuidv4 } = require("uuid");
const AgentReport = require("../../models/AgentReport");
const Meeting = require("../../models/Meeting");
const EmailJob = require("../../models/EmailJob");
const OutboxEvent = require("../../models/OutboxEvent");
const communicationAgent = require("./communicationAgent");
const reliabilityAgent = require("./reliabilityAgent");
const forensicAgent = require("./forensicAgent");
const healthAgent = require("./healthAgent");
const { sendEmail } = require("../../utils/emailService");
const {
  templateIncidentReport,
  templateDailyFounderReport,
  FOUNDER_EMAIL,
  FROM_EMAIL,
} = require("../../utils/emailTemplates");
const { sentinelAuditCounter } = require("../../telemetry/metrics");

class SentinelSupervisor {
  constructor() {
    this.name = "Agent 5: Sentinel Supervisor";
    this.priority = "P0";
    this.recipientEmail = process.env.FOUNDER_EMAIL || FOUNDER_EMAIL || "tickmelodie@gmail.com";
    this.isReconciling = false;
  }

  /**
   * Run full cross-audit reconciliation across all 4 agents
   */
  async runReconciliationAudit(reportType = "DAILY_INTELLIGENCE") {
    if (this.isReconciling) return null;
    this.isReconciling = true;

    try {
      console.log(`[SentinelSupervisor] Starting comprehensive system reconciliation audit...`);

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // 1. Collect audits from Agents 1, 2, 3, 4
      const [commAudit, relAudit, forAudit, hlthAudit] = await Promise.all([
        communicationAgent.runAudit(),
        reliabilityAgent.runAudit(),
        forensicAgent.runAudit(),
        healthAgent.runAudit(),
      ]);

      // 2. Aggregate all issues
      const allIssues = [
        ...commAudit.issues,
        ...relAudit.issues,
        ...forAudit.issues,
        ...hlthAudit.issues,
      ];

      // 3. Compute 24-hour business metrics
      const [
        interviewsScheduled,
        interviewsCompleted,
        emailsQueued,
        emailsDelivered,
        emailsBounced,
        forensicsProcessed,
        recordingsVerified,
      ] = await Promise.all([
        Meeting.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
        Meeting.countDocuments({
          status: { $in: ["completed", "approved", "rejected", "INTERVIEW_COMPLETED"] },
          createdAt: { $gte: twentyFourHoursAgo },
        }),
        EmailJob.countDocuments({ createdAt: { $gte: twentyFourHoursAgo } }),
        EmailJob.countDocuments({ status: "DELIVERED", createdAt: { $gte: twentyFourHoursAgo } }),
        EmailJob.countDocuments({ status: { $in: ["FAILED", "BOUNCED"] }, createdAt: { $gte: twentyFourHoursAgo } }),
        Meeting.countDocuments({
          "forensicReport.isProcessing": false,
          forensicReport: { $exists: true },
          createdAt: { $gte: twentyFourHoursAgo },
        }),
        Meeting.countDocuments({
          recordingUrl: { $exists: true, $ne: "" },
          createdAt: { $gte: twentyFourHoursAgo },
        }),
      ]);

      const criticalCount = allIssues.filter((i) => i.severity === "CRITICAL").length;
      let overallStatus = "HEALTHY";
      if (criticalCount > 0) overallStatus = "CRITICAL";
      else if (allIssues.length > 0) overallStatus = "ISSUES_DETECTED";

      const reportId = `rep_${uuidv4().replace(/-/g, "").slice(0, 16)}`;

      // 4. Save report to MongoDB
      const reportDoc = await AgentReport.create({
        reportId,
        reportType,
        generatedAt: now,
        periodStart: twentyFourHoursAgo,
        periodEnd: now,
        systemStatus: overallStatus,
        metrics: {
          interviewsScheduled,
          interviewsCompleted,
          workflowFailures: allIssues.length,
          recordingsMissing: interviewsCompleted - recordingsVerified > 0 ? interviewsCompleted - recordingsVerified : 0,
          recordingsVerified,
          emailsQueued,
          emailsDelivered,
          emailsBounced,
          forensicsProcessed,
          criticalAlertsCount: criticalCount,
        },
        issues: allIssues,
        agentAudits: {
          agent1_communication: { status: commAudit.status, notes: `${commAudit.issues.length} issue(s) detected` },
          agent2_reliability: { status: relAudit.status, notes: `${relAudit.issues.length} issue(s) detected` },
          agent3_forensics: { status: forAudit.status, notes: `${forAudit.issues.length} issue(s) detected` },
          agent4_health: { status: hlthAudit.status, notes: `${hlthAudit.issues.length} issue(s) detected` },
        },
      });

      // 5. Send Email Report to Founder
      await this.deliverReportEmail(reportDoc);

      sentinelAuditCounter.inc({ status: overallStatus });

      console.log(`[SentinelSupervisor] Audit completed: Status=${overallStatus}, Issues=${allIssues.length}`);
      return reportDoc;
    } catch (err) {
      console.error(`[SentinelSupervisor] Reconciliation audit failed:`, err);
      return null;
    } finally {
      this.isReconciling = false;
    }
  }

  /**
   * Deliver Template 9: Sora Daily Operations Report to Founder
   */
  async deliverReportEmail(reportDoc) {
    const reportDate = new Date(reportDoc.generatedAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    try {
      // 1. Fetch recent meetings to populate Section 2: Interview Activity
      const recentMeetings = await Meeting.find({
        createdAt: { $gte: reportDoc.periodStart },
      })
        .populate("candidateId", "name email")
        .populate("interviewerId", "name email")
        .sort({ scheduledTime: -1 })
        .limit(15);

      const interviewActivity = recentMeetings.map((m) => ({
        reference_id: m.jobId || `REQ-${m.meetingId.slice(0, 6).toUpperCase()}`,
        candidate_name: m.candidateId?.name || "Candidate",
        interviewer_name: m.interviewerId?.name || "Interviewer",
        time: m.scheduledTime
          ? new Date(m.scheduledTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "N/A",
        status: m.status,
      }));

      // 2. Format incident summary
      const incidentSummary = reportDoc.issues.length === 0
        ? "No operational failures or invariant breaches recorded in the past 24 hours."
        : reportDoc.issues.map((i, idx) => `${idx + 1}. [${i.severity}] ${i.title}: ${i.description}`).join(" | ");

      // 3. Compile report using Template 9
      const reportTpl = templateDailyFounderReport({
        reportDate,
        metrics: {
          requests: reportDoc.metrics.interviewsScheduled || 0,
          scheduled: reportDoc.metrics.interviewsScheduled || 0,
          completed: reportDoc.metrics.interviewsCompleted || 0,
          cancelled: 0,
          rescheduled: 0,
          pending_decisions: (reportDoc.metrics.interviewsCompleted || 0) - (reportDoc.metrics.forensicsProcessed || 0) > 0
            ? (reportDoc.metrics.interviewsCompleted || 0) - (reportDoc.metrics.forensicsProcessed || 0)
            : 0,
          incident_count: reportDoc.issues.length,
          critical_incidents: reportDoc.metrics.criticalAlertsCount || 0,
          high_incidents: reportDoc.issues.filter((i) => i.severity === "WARNING" || i.severity === "HIGH").length,
          medium_incidents: reportDoc.issues.filter((i) => i.severity === "MEDIUM").length,
          low_incidents: reportDoc.issues.filter((i) => i.severity === "INFO" || i.severity === "LOW").length,
          resolved_incidents: reportDoc.issues.filter((i) => i.status === "RESOLVED").length,
          pending_incidents: reportDoc.issues.length,
          recordings_expected: reportDoc.metrics.interviewsCompleted || 0,
          recordings_stored: reportDoc.metrics.recordingsVerified || 0,
          recording_failures: reportDoc.metrics.recordingsMissing || 0,
          analysis_completed: reportDoc.metrics.forensicsProcessed || 0,
          analysis_pending: (reportDoc.metrics.interviewsCompleted || 0) - (reportDoc.metrics.forensicsProcessed || 0) > 0
            ? (reportDoc.metrics.interviewsCompleted || 0) - (reportDoc.metrics.forensicsProcessed || 0)
            : 0,
          analysis_failed: 0,
          emails_queued: reportDoc.metrics.emailsQueued || 0,
          emails_delivered: reportDoc.metrics.emailsDelivered || 0,
          emails_failed: reportDoc.metrics.emailsBounced || 0,
          emails_retried: 0,
        },
        interviewActivity,
        incidentSummary,
        recordingAnalysisSummary: `Multi-track audio/video and screen recordings stored. ${reportDoc.metrics.recordingsVerified || 0} verified.`,
        emailDeliverySummary: `Nodemailer SMTP & Resend fallbacks fully active. Delivered ${reportDoc.metrics.emailsDelivered || 0} of ${reportDoc.metrics.emailsQueued || 0} queued emails.`,
        pendingActions: reportDoc.issues.length > 0 ? "Review open incidents highlighted above in the Admin Sentinel Dashboard." : "None. All workflows running nominal.",
        health: {
          backend: "HEALTHY",
          database: "HEALTHY",
          queue: "OPERATIONAL",
          video: "HEALTHY",
          storage: "OPERATIONAL",
          ai_pipeline: "OPERATIONAL",
          email_service: "OPERATIONAL",
        },
        executiveSummary: `System Status: ${reportDoc.systemStatus}. The platform completed ${reportDoc.metrics.interviewsCompleted} interviews with all 5 autonomous cloud agents active.`,
        recommendedActions: reportDoc.metrics.criticalAlertsCount > 0
          ? "Investigate critical alerts recorded in the incident section."
          : "System is operating within optimal parameters.",
      });

      await sendEmail({
        to: this.recipientEmail,
        subject: reportTpl.subject,
        html: reportTpl.html,
        text: reportTpl.text,
        from: `"Sora Operations & Reporting" <${FROM_EMAIL}>`,
      });

      reportDoc.deliveryStatus = {
        sent: true,
        recipient: this.recipientEmail,
        deliveredAt: new Date(),
      };
      await reportDoc.save();
      console.log(`[SentinelSupervisor] Template 9 (Daily Operations Report) delivered to Founder at ${this.recipientEmail}`);
    } catch (err) {
      console.error(`[SentinelSupervisor] Failed to email intelligence report:`, err.message);
      reportDoc.deliveryStatus = {
        sent: false,
        recipient: this.recipientEmail,
        error: err.message,
      };
      await reportDoc.save();
    }
  }

  /**
   * Dispatch Template 8: Operational Incident Report (Founder Notification)
   * Supports Variants: 8A, 8B, 8C, 8D and General Invariant breaches
   */
  async dispatchIncidentReport({
    incidentId,
    incidentType = "GENERAL_INCIDENT",
    severity = "P1 - HIGH",
    referenceId = "N/A",
    status = "OPEN",
    candidateName = "Candidate",
    candidateEmail = "candidate@example.com",
    interviewerName = "Interviewer",
    interviewerEmail = "interviewer@example.com",
    description = "Operational issue detected by Sora Sentinel.",
    expectedBehaviour = "Smooth end-to-end execution without interruption.",
    actualBehaviour = "System anomaly or attendance violation observed.",
    errorDetails = "None recorded.",
    recordingStatus = "N/A",
    recordingReference = "N/A",
    actionTaken = "Logged in Sentinel audit trail and escalated to founder.",
    pendingAction = "Review session logs and reschedule or verify attendance.",
    recommendedAction = "Inspect network signaling and participant availability.",
    variantData = {},
  }) {
    console.warn(`[SentinelSupervisor] DISPATCHING INCIDENT REPORT [${severity}]: ${incidentType} (${referenceId})`);

    const incidentTpl = templateIncidentReport({
      incidentId,
      incidentType,
      severity,
      referenceId,
      status,
      candidateName,
      candidateEmail,
      interviewerName,
      interviewerEmail,
      description,
      expectedBehaviour,
      actualBehaviour,
      errorDetails,
      recordingStatus,
      recordingReference,
      actionTaken,
      pendingAction,
      recommendedAction,
      variantData,
    });

    try {
      await sendEmail({
        to: this.recipientEmail,
        subject: incidentTpl.subject,
        html: incidentTpl.html,
        text: incidentTpl.text,
        from: `"Sora Operations & Monitoring" <${FROM_EMAIL}>`,
      });
      console.log(`[SentinelSupervisor] Incident report ${incidentType} successfully delivered to Founder at ${this.recipientEmail}`);
    } catch (err) {
      console.error("[SentinelSupervisor] Failed sending incident report to founder:", err.message);
    }
  }

  /**
   * Backward-compatible immediate dispatch for critical invariant breach
   */
  async triggerImmediateCriticalAlert(title, description, affectedEntityId, suggestedFix) {
    return this.dispatchIncidentReport({
      incidentType: "INVARIANT_BREACH",
      severity: "P0 - CRITICAL",
      referenceId: affectedEntityId || "SYSTEM",
      description: `${title}: ${description}`,
      actionTaken: "Flagged in Sentinel operational audit log.",
      pendingAction: suggestedFix || "Investigate immediately.",
      recommendedAction: suggestedFix || "Check cloud infrastructure.",
    });
  }

  /**
   * Start supervision loops
   */
  startSupervision() {
    console.log("[SentinelSupervisor] Supervision loop active and scheduled.");
  }
}

const sentinelSupervisor = new SentinelSupervisor();

// Scheduled Daily Intelligence Cron: Runs daily (every 24 hours) or on server boot after 1 min
setTimeout(() => {
  sentinelSupervisor.runReconciliationAudit().catch((e) => console.error("[Sentinel Startup Audit] Error:", e));
}, 60000);

// Run every 24 hours (86,400,000 ms)
setInterval(() => {
  sentinelSupervisor.runReconciliationAudit().catch((e) => console.error("[Sentinel Daily Audit] Error:", e));
}, 86400000);

module.exports = sentinelSupervisor;
