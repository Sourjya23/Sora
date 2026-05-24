const User = require("../models/User");
const validator = require("validator");
const sendStatusMail = require("../utils/sendStatusMail");

exports.completeProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nationalId, skills, intro, experienceLevel, projects } = req.body;
    const resume = req.file;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.profileCompleted && user.profileStatus !== "approved" && user.profileStatus !== undefined) {
      return res.status(400).json({ message: "Profile already submitted and is currently pending or rejected." });
    }

    if (!resume && !user.resumeUrl) {
      return res.status(400).json({ message: "Resume required" });
    }

    let parsedProjects = [];
    if (projects) {
      parsedProjects = typeof projects === "string" ? JSON.parse(projects) : projects;
    }

    for (const project of parsedProjects) {
      if (!validator.isURL(project.link)) {
        return res.status(400).json({ message: "Invalid project URL detected" });
      }
    }

    let parsedSkills = [];
    if (skills) {
      parsedSkills = typeof skills === "string" ? skills.split(",").map(s => s.trim()) : skills;
    }

    user.nationalId = nationalId;
    if (resume) {
      user.resumeUrl = resume.path;
    }
    user.skills = parsedSkills;
    user.intro = intro;
    user.experienceLevel = experienceLevel;
    user.projects = parsedProjects;
    
    user.profileCompleted = true;
    
    // Only reset to pending if they are not already approved
    if (user.profileStatus !== "approved") {
      user.profileStatus = "pending";
      user.nationalIdVerified = false;
    }

    await user.save();

    res.status(200).json({
      message: "Profile completed successfully. Pending verification.",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Profile completion failed" });
  }
};

exports.getPendingProfiles = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (admin.role !== "interviewer") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const profiles = await User.find({ 
        profileCompleted: true, 
        $or: [
          { profileStatus: "pending" },
          { profileStatus: { $exists: false } }
        ]
      })
      .select("-password -otp -otpExpiry")
      .sort({ updatedAt: -1 });

    res.status(200).json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch pending profiles" });
  }
};

exports.reviewProfile = async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    if (admin.role !== "interviewer") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const candidate = await User.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    candidate.profileStatus = status;
    candidate.adminNotes = adminNotes;
    
    if (status === "approved") {
      candidate.nationalIdVerified = true;
    } else {
      candidate.nationalIdVerified = false;
    }

    await candidate.save();
    
    // Send email to candidate using the interviewer's email
    await sendStatusMail(candidate.email, status, adminNotes, admin.email);

    res.status(200).json({ message: `Profile ${status} successfully`, candidate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to review profile" });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp -otpExpiry");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};
