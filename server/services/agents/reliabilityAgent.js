const Meeting = require("../../models/Meeting");
const RecordingManifest = require("../../models/RecordingManifest");

class ReliabilityAgent {
  constructor() {
    this.name = "Agent 2: Meeting & Recording Reliability";
    this.priority = "P0";
  }

  /**
   * Run diagnostic audit over live meetings and recording manifests
   */
  async runAudit() {
    const issues = [];
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Audit completed meetings for verified recordings
    const completedMeetings = await Meeting.find({
      status: { $in: ["completed", "approved", "rejected", "INTERVIEW_COMPLETED", "RECORDING_VERIFIED"] },
      createdAt: { $gte: twentyFourHoursAgo },
    });

    for (const meeting of completedMeetings) {
      if (!meeting.recordingUrl) {
        // Check if manifest exists and is verified
        const manifest = await RecordingManifest.findOne({ meetingId: meeting.meetingId });
        if (!manifest || manifest.status !== "VERIFIED") {
          issues.push({
            severity: "WARNING",
            category: "RECORDING",
            title: "Missing Interview Recording Verification",
            description: `Meeting ${meeting.meetingId} (Job: ${meeting.jobId}) concluded, but no verified recording asset or manifest was recorded.`,
            affectedEntityId: meeting.meetingId,
            suggestedFix: "Inspect client MediaRecorder stream termination and Cloudinary/R2 upload endpoint response.",
          });
        }
      }
    }

    // 2. Audit recording manifests for missing tracks or zero bytes
    const manifests = await RecordingManifest.find({
      createdAt: { $gte: twentyFourHoursAgo },
      status: { $in: ["CORRUPTED", "MISSING_TRACKS", "INITIALIZED"] },
    });

    for (const manifest of manifests) {
      issues.push({
        severity: "WARNING",
        category: "RECORDING",
        title: `Recording Manifest Issue: ${manifest.status}`,
        description: `Manifest ${manifest.manifestId} for meeting ${manifest.meetingId} reported missing tracks: ${manifest.missingTracks?.join(", ") || "None"}`,
        affectedEntityId: manifest.manifestId,
        suggestedFix: "Check participant screen share consent and audio context permission logs.",
      });
    }

    // 3. Audit scheduled meetings past their end time that never started (No-Show)
    const overdueScheduled = await Meeting.find({
      status: { $in: ["scheduled", "SLOT_CONFIRMED"] },
      scheduledTime: { $lte: new Date(now.getTime() - 90 * 60 * 1000) }, // 90 min past start
    });

    for (const meeting of overdueScheduled) {
      issues.push({
        severity: "INFO",
        category: "MEETING",
        title: "Session No-Show / Overdue Scheduled Meeting",
        description: `Meeting ${meeting.meetingId} scheduled for ${meeting.scheduledTime} was never initiated or concluded.`,
        affectedEntityId: meeting.meetingId,
        suggestedFix: "Transition status to NO_SHOW and notify recruiter / interviewer.",
      });
    }

    return {
      agent: this.name,
      status: issues.some((i) => i.severity === "CRITICAL") ? "CRITICAL" : issues.length > 0 ? "DEGRADED" : "HEALTHY",
      issues,
      metrics: {
        totalCompletedAudited: completedMeetings.length,
        missingRecordingCount: issues.filter((i) => i.category === "RECORDING").length,
        noShowOverdueCount: overdueScheduled.length,
      },
    };
  }
}

module.exports = new ReliabilityAgent();
