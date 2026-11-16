const { v4: uuidv4 } = require("uuid");
const Meeting = require("../../models/Meeting");
const ForensicFinding = require("../../models/ForensicFinding");
const eventBus = require("../eventBus");

class ForensicAgent {
  constructor() {
    this.name = "Agent 3: AI Forensic Intelligence";
    this.priority = "P0";
  }

  /**
   * Process raw telemetry events into structured ForensicFinding records
   */
  async processTelemetryIntoFindings(meetingId, telemetryEvents = [], sessionStartTime = null) {
    const findings = [];
    const baseTime = sessionStartTime ? new Date(sessionStartTime).getTime() : Date.now();

    for (const evt of telemetryEvents) {
      const eventTime = evt.timestamp ? new Date(evt.timestamp).getTime() : Date.now();
      const offsetMs = Math.max(0, eventTime - baseTime);

      let category = "TAB_VISIBILITY";
      let severity = "LOW";
      let description = evt.description || "Browser tab visibility changed.";
      let confidence = 0.9;

      if (evt.type === "paste") {
        category = "CLIPBOARD_ACTIVITY";
        severity = (evt.content?.length || 0) > 300 ? "HIGH" : "MEDIUM";
        description = `Clipboard paste detected (${evt.content?.length || "significant"} characters).`;
        confidence = 0.95;
      } else if (evt.type === "tab_change" || evt.type === "visibilitychange") {
        category = "TAB_VISIBILITY";
        severity = "MEDIUM";
        description = "Candidate switched browser tab or minimized window.";
        confidence = 0.92;
      } else if (evt.type === "screen_share_stopped") {
        category = "SCREEN_SHARE_INTERRUPTION";
        severity = "HIGH";
        description = "Mandatory candidate screen sharing was terminated prematurely.";
        confidence = 0.98;
      }

      const findingId = `find_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
      const findingDoc = await ForensicFinding.create({
        findingId,
        meetingId,
        category,
        severity,
        offsetMs,
        wallClock: new Date(eventTime),
        evidence: {
          description,
          codeSnippet: evt.content ? evt.content.slice(0, 500) : "",
          characterCount: evt.content?.length || 0,
        },
        confidence,
        humanReviewStatus: "PENDING",
      });

      findings.push(findingDoc);
    }

    eventBus.emitEvent(
      "FORENSICS.FINDINGS_GENERATED",
      "MEETING",
      meetingId,
      { count: findings.length, meetingId }
    );

    return findings;
  }

  /**
   * Run diagnostic audit over AI forensic processing pipeline
   */
  async runAudit() {
    const issues = [];
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Audit completed meetings missing forensic reports or stuck in processing
    const stuckProcessing = await Meeting.find({
      status: { $in: ["completed", "approved", "rejected", "INTERVIEW_COMPLETED"] },
      createdAt: { $gte: twentyFourHoursAgo },
      $or: [
        { "forensicReport.isProcessing": true },
        { forensicReport: { $exists: false } },
      ],
    });

    for (const meeting of stuckProcessing) {
      issues.push({
        severity: "WARNING",
        category: "FORENSICS",
        title: "Forensic Analysis Stuck or Incomplete",
        description: `Meeting ${meeting.meetingId} concluded, but AI forensic report is still marked as processing or ungenerated.`,
        affectedEntityId: meeting.meetingId,
        suggestedFix: "Trigger background heuristic fallback report and inspect LLM API quota.",
      });
    }

    // 2. High severity findings pending human review
    const criticalFindings = await ForensicFinding.find({
      severity: { $in: ["HIGH", "CRITICAL"] },
      humanReviewStatus: "PENDING",
      createdAt: { $gte: twentyFourHoursAgo },
    });

    for (const finding of criticalFindings) {
      issues.push({
        severity: "INFO",
        category: "FORENSICS",
        title: `Integrity Evidence Requires Review: ${finding.category}`,
        description: `High severity flag detected for meeting ${finding.meetingId} at offset ${Math.round(finding.offsetMs / 1000)}s: ${finding.evidence?.description}`,
        affectedEntityId: finding.findingId,
        suggestedFix: "Interviewer should inspect timestamped timeline before confirming selection.",
      });
    }

    return {
      agent: this.name,
      status: issues.some((i) => i.severity === "CRITICAL") ? "CRITICAL" : issues.length > 0 ? "DEGRADED" : "HEALTHY",
      issues,
      metrics: {
        stuckProcessingCount: stuckProcessing.length,
        pendingReviewFindingsCount: criticalFindings.length,
      },
    };
  }
}

module.exports = new ForensicAgent();
