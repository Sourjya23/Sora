const mongoose = require("mongoose");

const recordingManifestSchema = new mongoose.Schema(
  {
    manifestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    meetingId: {
      type: String,
      required: true,
      index: true,
    },
    interviewId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["INITIALIZED", "RECORDING", "UPLOADING", "VERIFIED", "CORRUPTED", "MISSING_TRACKS"],
      default: "INITIALIZED",
      index: true,
    },
    tracks: [
      {
        type: {
          type: String,
          enum: ["CANDIDATE_AV", "INTERVIEWER_AV", "CANDIDATE_SCREEN", "COMPOSITE_AV"],
          required: true,
        },
        storageUrl: String,
        storageKey: String,
        durationSeconds: Number,
        sizeBytes: Number,
        checksum: String, // sha256 or md5
        mimeType: String,
        verified: { type: Boolean, default: false },
      },
    ],
    totalDurationSeconds: {
      type: Number,
      default: 0,
    },
    startedAt: Date,
    endedAt: Date,
    verifiedAt: Date,
    missingTracks: [String],
    verificationNotes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RecordingManifest", recordingManifestSchema);
