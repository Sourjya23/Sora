const express = require("express");
const router = express.Router();
const {
  signup,
  verifyOTP,
  login,
  getPlatformStats,
  resendOTP,
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/resend-otp", resendOTP);
router.get("/stats", getPlatformStats);

module.exports = router;
