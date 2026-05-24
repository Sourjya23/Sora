const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    code: { type: String, required: true },
    language: { type: String, required: true },
    executionResult: {
      passed: { type: Number, required: true },
      total: { type: Number, required: true },
    },
    aiFeedback: {
      timeComplexity: String,
      spaceComplexity: String,
      weaknessesIdentified: [String],
      suggestions: String,
    },
    eloChange: { type: Number, default: 0 }, // e.g., +15 or -10 based on this submission
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Submission", submissionSchema);
