const mongoose = require("mongoose");

const siteMetricsSchema = new mongoose.Schema(
  {
    totalVisits: {
      type: Number,
      default: 0,
    },
    registeredVisits: {
      type: Number,
      default: 0,
    },
    // We only need one document to hold global metrics
    isSingleton: {
      type: Boolean,
      default: true,
      unique: true,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SiteMetrics", siteMetricsSchema);
