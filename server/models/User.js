const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      unique: true,
    },
    password: String,
    role: {
      type: String,
      enum: ["candidate", "interviewer"],
      default: "candidate",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: String,
    otpExpiry: Date,
    nationalId: String,
    nationalIdVerified: {
      type: Boolean,
      default: false,
    },
    resumeUrl: String,
    skills: [String],
    intro: String,
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
    },
    projects: [
      {
        title: String,
        link: String,
        description: String,
      },
    ],
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    profileStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminNotes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
