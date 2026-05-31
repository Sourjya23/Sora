const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { generateLesson, chatWithAI, getLessons, getLessonById, completeLesson } = require("../controllers/aiController");

router.post("/generate-lesson", authMiddleware, generateLesson);
router.post("/chat", authMiddleware, chatWithAI);
router.get("/lessons", authMiddleware, getLessons);
router.get("/lessons/:id", authMiddleware, getLessonById);
router.put("/lessons/:id/complete", authMiddleware, completeLesson);

module.exports = router;
