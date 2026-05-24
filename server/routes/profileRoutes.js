const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { completeProfile, getPendingProfiles, reviewProfile, getMyProfile } = require("../controllers/profileController");

router.post("/complete-profile", authMiddleware, upload.single("resume"), completeProfile);
router.get("/pending-profiles", authMiddleware, getPendingProfiles);
router.put("/review-profile/:id", authMiddleware, reviewProfile);
router.get("/me", authMiddleware, getMyProfile);

module.exports = router;
