const express = require("express");
const router = express.Router();
const {
  signup,
  verifyOTP,
  login,
  getPlatformStats,
  resendOTP,
  validateEmail,
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/resend-otp", resendOTP);
router.get("/stats", getPlatformStats);
router.post("/validate-email", validateEmail);

module.exports = router;
