const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { requireAuth, checkRole } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { completeProfile, getPendingProfiles, reviewProfile, getMyProfile, markTourCompleted } = require("../controllers/profileController");

router.post("/complete-profile", authMiddleware, upload.single("resume"), completeProfile);
router.get("/pending-profiles", requireAuth, checkRole(["admin"]), getPendingProfiles);
router.put("/review-profile/:id", requireAuth, checkRole(["admin"]), reviewProfile);
router.get("/me", authMiddleware, getMyProfile);
router.patch("/tour", authMiddleware, markTourCompleted);

module.exports = router;
