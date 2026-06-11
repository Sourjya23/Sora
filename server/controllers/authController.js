const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const sendMail = require("../utils/sendMail");
const { sendEmail } = require("../utils/emailService");
const { getWelcomeEmailHtml } = require("../utils/emailTemplates");

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !email.toLowerCase().endsWith("@gmail.com")) {
      return res.status(400).json({
        message: "Only @gmail.com email addresses are allowed to prevent spam.",
      });
    }

    // Server-side deep validation to prevent bypassing frontend
    const abstractApiKey = process.env.ABSTRACT_API_KEY || "1d50b1ff0aaf44e7b7fc8df8c713cd1d";
    const zeroBounceApiKey = process.env.ZEROBOUNCE_API_KEY || "731e1a97ff5a4e43935d753ba0268399";
    const axios = require("axios");

    const [abstractRes, zeroBounceRes] = await Promise.all([
      axios.get(`https://emailvalidation.abstractapi.com/v1/?api_key=${abstractApiKey}&email=${email}`).catch(() => null),
      axios.get(`https://api.zerobounce.net/v2/validate?api_key=${zeroBounceApiKey}&email=${email}`).catch(() => null)
    ]);

    let isEmailValid = false;
    if (zeroBounceRes?.data?.status === "valid" || abstractRes?.data?.deliverability === "DELIVERABLE") {
      isEmailValid = true;
    }

    if (!isEmailValid) {
      return res.status(400).json({
        message: "This mailbox does not exist or cannot receive mail. Please enter a real email.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    if (existingUser && !existingUser.isVerified) {
      await User.deleteOne({ email });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const otpExpiry = Date.now() + 5 * 60 * 1000;

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      otp,
      otpExpiry,
    });

    await sendMail(email, otp);

    res.status(201).json({
      message: "OTP sent successfully",
      email,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Signup failed",
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.otp || String(user.otp).trim() !== String(otp).trim()) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Send the customized welcome email asynchronously
    try {
      const emailHtml = getWelcomeEmailHtml(user.name);
      sendEmail({
        to: user.email,
        subject: "Welcome to Sora — The ultimate interview preparation platform for engineers",
        html: emailHtml
      }).catch(err => console.error("Non-blocking error sending welcome email:", err));
    } catch (emailErr) {
      console.error("Error setting up welcome email:", emailErr);
    }

    res.status(200).json({
      message: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "OTP verification failed",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Verify email first",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: rememberMe ? "30d" : "1d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Login failed",
    });
  }
};

exports.getPlatformStats = async (req, res) => {
  try {
    const verifiedUsersCount = await User.countDocuments({ isVerified: true });
    res.status(200).json({ verifiedUsersCount });
  } catch (error) {
    console.error("Failed to fetch platform stats:", error);
    res.status(500).json({ message: "Failed to fetch platform stats" });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const otpExpiry = Date.now() + 5 * 60 * 1000;

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendMail(email, otp);

    res.status(200).json({ message: "A new OTP has been sent to your email" });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

const axios = require("axios");

exports.validateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ valid: false, message: "Email is required" });
    }

    if (!email.toLowerCase().endsWith("@gmail.com")) {
      return res.status(200).json({ valid: false, message: "Must be a @gmail.com address" });
    }

    const abstractApiKey = "1d50b1ff0aaf44e7b7fc8df8c713cd1d";
    const zeroBounceApiKey = "731e1a97ff5a4e43935d753ba0268399";

    const abstractReq = axios.get(`https://emailvalidation.abstractapi.com/v1/?api_key=${abstractApiKey}&email=${email}`).catch(() => null);
    const zeroBounceReq = axios.get(`https://api.zerobounce.net/v2/validate?api_key=${zeroBounceApiKey}&email=${email}`).catch(() => null);

    const [abstractRes, zeroBounceRes] = await Promise.all([abstractReq, zeroBounceReq]);

    let isValid = false;

    // ZeroBounce returns { status: "valid" } or "invalid", "catch-all", etc.
    if (zeroBounceRes && zeroBounceRes.data) {
      if (zeroBounceRes.data.status === "valid") {
        isValid = true;
      }
    }

    // Abstract API returns { deliverability: "DELIVERABLE" } or "UNDELIVERABLE"
    if (abstractRes && abstractRes.data) {
      if (abstractRes.data.deliverability === "DELIVERABLE") {
        isValid = true;
      }
    }

    res.status(200).json({ valid: isValid });
  } catch (error) {
    console.error("Email validation error:", error);
    res.status(500).json({ valid: false, message: "Validation service error" });
  }
};
