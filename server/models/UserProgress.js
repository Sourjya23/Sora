const mongoose = require("mongoose");

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    topicMastery: {
      type: Map,
      of: new mongoose.Schema(
        {
          level: { type: Number, default: 1500 }, // ELO rating, defaults to 1500
          problemsSolved: { type: Number, default: 0 },
          lastAttempt: { type: Date },
        },
        { _id: false }
      ),
      default: {},
    },
    learningGraph: {
      type: [String],
      default: [], // Suggested next topics
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserProgress", userProgressSchema);
