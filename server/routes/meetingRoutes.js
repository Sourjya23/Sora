const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { 
  scheduleMeeting, 
  notifyJoin, 
  getMeetingDetails, 
  verifyPassword, 
  getMyMeetings,
  generateProblemForMeeting,
  uploadRecording,
  getCompletedMeetings,
  getAllProblems,
  reviewCandidate,
  getDecisionDossier
} = require("../controllers/meetingController");

router.post("/schedule", authMiddleware, scheduleMeeting);
router.post("/join/:id", authMiddleware, notifyJoin);
router.get("/details/:id", authMiddleware, getMeetingDetails);
router.get("/decision-hub/:id", authMiddleware, getDecisionDossier);
router.post("/verify-password/:id", authMiddleware, verifyPassword);
router.get("/my-meetings", authMiddleware, getMyMeetings);
router.get("/completed", authMiddleware, getCompletedMeetings);
router.get("/problem-bank", authMiddleware, getAllProblems);
router.get("/problem/:id", authMiddleware, generateProblemForMeeting);
router.post("/upload-recording/:id", authMiddleware, upload.single("recording"), uploadRecording);
router.post("/review/:id", authMiddleware, reviewCandidate);

module.exports = router;
