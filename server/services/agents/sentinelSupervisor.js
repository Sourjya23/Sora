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

class SentinelSupervisor {
  constructor() {
    this.name = "Agent 5: Sentinel Supervisor";
    this.priority = "P0";
    this.recipientEmail = process.env.SENTINEL_ALERT_EMAIL || "sourjyamitra8188@gmail.com";
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
   * Deliver HTML Intelligence Email
   */
  async deliverReportEmail(reportDoc) {
    const isCritical = reportDoc.systemStatus === "CRITICAL";
    const dateStr = new Date(reportDoc.generatedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const subject = isCritical
      ? `🚨 [CRITICAL ALERT] Sora Sentinel: Issues Requiring Immediate Action`
      : `🛡️ Sora Sentinel — Daily System Intelligence (${dateStr})`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 24px; background: #03101b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
  <div style="max-width: 640px; margin: 0 auto; background: linear-gradient(145deg, #062438 0%, #041a2a 100%); border: 1px solid ${isCritical ? "rgba(244, 63, 94, 0.4)" : "rgba(56, 189, 248, 0.3)"}; border-radius: 20px; padding: 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
    
    <!-- Top Header -->
    <div style="border-bottom: 1px solid rgba(56, 189, 248, 0.2); padding-bottom: 16px; margin-bottom: 24px;">
      <div style="font-family: monospace; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: ${isCritical ? "#fb7185" : "#38bdf8"};">
        SORA SENTINEL &bull; CLOUD SUPERVISOR INTELLIGENCE
      </div>
      <h1 style="font-size: 24px; font-weight: 700; margin: 6px 0 0; color: #ffffff;">
        Daily Operational Health Report
      </h1>
      <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">
        Audit Window: Past 24 Hours &bull; Status: <strong style="color: ${isCritical ? "#f43f5e" : "#34d399"};">${reportDoc.systemStatus}</strong>
      </p>
    </div>

    <!-- 4-Col Key Metrics -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
      <tr>
        <td width="25%" align="center" style="background: rgba(3, 19, 32, 0.8); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 12px; padding: 14px;">
          <div style="font-size: 26px; font-weight: 700; color: #38bdf8; font-family: monospace;">${reportDoc.metrics.interviewsScheduled}</div>
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-top: 4px;">Scheduled</div>
        </td>
        <td width="4%"></td>
        <td width="25%" align="center" style="background: rgba(3, 19, 32, 0.8); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 12px; padding: 14px;">
          <div style="font-size: 26px; font-weight: 700; color: #34d399; font-family: monospace;">${reportDoc.metrics.interviewsCompleted}</div>
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-top: 4px;">Completed</div>
        </td>
        <td width="4%"></td>
        <td width="25%" align="center" style="background: rgba(3, 19, 32, 0.8); border: 1px solid ${reportDoc.metrics.workflowFailures > 0 ? "rgba(244, 63, 94, 0.3)" : "rgba(56, 189, 248, 0.15)"}; border-radius: 12px; padding: 14px;">
          <div style="font-size: 26px; font-weight: 700; color: ${reportDoc.metrics.workflowFailures > 0 ? "#fb7185" : "#38bdf8"}; font-family: monospace;">${reportDoc.metrics.workflowFailures}</div>
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-top: 4px;">Failures</div>
        </td>
        <td width="4%"></td>
        <td width="25%" align="center" style="background: rgba(3, 19, 32, 0.8); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 12px; padding: 14px;">
          <div style="font-size: 26px; font-weight: 700; color: #38bdf8; font-family: monospace;">${reportDoc.metrics.forensicsProcessed}</div>
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-top: 4px;">Forensics</div>
        </td>
      </tr>
    </table>

    <!-- Issues Requiring Attention -->
    <div style="margin-bottom: 28px;">
      <h3 style="font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; color: #38bdf8; margin: 0 0 14px;">
        Issues Requiring Attention (${reportDoc.issues.length})
      </h3>

      ${
        reportDoc.issues.length === 0
          ? `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 12px; padding: 16px; font-size: 13px; color: #6ee7b7;">
          ✓ All workflow invariants intact. Zero failures or unverified events detected across all five agents.
        </div>
      `
          : reportDoc.issues
              .map(
                (issue, idx) => `
        <div style="background: rgba(3, 19, 32, 0.8); border-left: 4px solid ${
          issue.severity === "CRITICAL" ? "#f43f5e" : issue.severity === "WARNING" ? "#f59e0b" : "#38bdf8"
        }; border-radius: 10px; padding: 14px 16px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <strong style="color: #ffffff; font-size: 13px;">${idx + 1}. ${issue.title}</strong>
            <span style="font-size: 10px; font-family: monospace; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.08); color: ${
              issue.severity === "CRITICAL" ? "#fb7185" : "#fcd34d"
            };">${issue.severity}</span>
          </div>
          <p style="margin: 4px 0 8px; color: #cbd5e1; font-size: 12px; line-height: 1.5;">${issue.description}</p>
          <div style="font-size: 11px; color: #94a3b8; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 6px;">
            <strong>Suggested Fix:</strong> ${issue.suggestedFix}
          </div>
        </div>
      `
              )
              .join("")
      }
    </div>

    <!-- Agent Breakdown Grid -->
    <div style="background: rgba(3, 19, 32, 0.6); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <h4 style="margin: 0 0 10px; font-size: 13px; color: #e2e8f0; text-transform: uppercase;">Specialised Agent Health Breakdown</h4>
      <table width="100%" style="font-size: 12px; color: #cbd5e1;">
        <tr>
          <td style="padding: 4px 0;">Agent 1: Communication</td>
          <td align="right" style="color: #38bdf8;">${reportDoc.agentAudits?.agent1_communication?.notes || "Active"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">Agent 2: Meeting Reliability</td>
          <td align="right" style="color: #38bdf8;">${reportDoc.agentAudits?.agent2_reliability?.notes || "Active"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">Agent 3: Forensic Intelligence</td>
          <td align="right" style="color: #38bdf8;">${reportDoc.agentAudits?.agent3_forensics?.notes || "Active"}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0;">Agent 4: Application Health & QA</td>
          <td align="right" style="color: #38bdf8;">${reportDoc.agentAudits?.agent4_health?.notes || "Active"}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid rgba(56, 189, 248, 0.15); padding-top: 16px; font-size: 11px; color: #64748b; line-height: 1.5;">
      Delivered by Agent 5 (Sentinel Cloud Supervisor) &bull; Sora Autonomous Platform.<br/>
      To trigger a real-time manual audit, visit the Sora Admin Sentinel Dashboard.
    </div>
  </div>
</body>
</html>
    `;

    try {
      await sendEmail({
        to: this.recipientEmail,
        subject,
        html,
      });
      reportDoc.deliveryStatus = {
        sent: true,
        recipient: this.recipientEmail,
        deliveredAt: new Date(),
      };
      await reportDoc.save();
      console.log(`[SentinelSupervisor] Intelligence report successfully delivered to ${this.recipientEmail}`);
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
   * Immediate dispatch for critical invariant breach
   */
  async triggerImmediateCriticalAlert(title, description, affectedEntityId, suggestedFix) {
    console.warn(`[SentinelSupervisor] DISPATCHING CRITICAL ALERT: ${title}`);

    const html = `
      <div style="font-family: sans-serif; background: #1a0505; color: #ffffff; padding: 24px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(244, 63, 94, 0.4);">
        <div style="font-family: monospace; font-size: 11px; text-transform: uppercase; color: #fb7185; letter-spacing: 1px;">SORA SENTINEL IMMEDIATE ALERT</div>
        <h2 style="color: #f43f5e; margin: 8px 0 14px;">${title}</h2>
        <p style="color: #fecdd3; font-size: 14px; line-height: 1.6;">${description}</p>
        <div style="background: #2a0b0b; padding: 14px; border-radius: 10px; border: 1px solid rgba(244, 63, 94, 0.3); font-size: 13px; margin: 16px 0;">
          <p style="margin: 0 0 6px; color: #fca5a5;"><strong>Affected Entity:</strong> ${affectedEntityId}</p>
          <p style="margin: 0; color: #fca5a5;"><strong>Suggested Fix:</strong> ${suggestedFix}</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: this.recipientEmail,
        subject: `🚨 [IMMEDIATE ALERT] Sora Sentinel: ${title}`,
        html,
      });
    } catch (err) {
      console.error("[SentinelSupervisor] Failed sending immediate critical alert:", err.message);
    }
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
