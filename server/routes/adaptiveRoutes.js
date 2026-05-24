const express = require("express");
const adaptiveController = require("../controllers/adaptiveController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/generate-problem", adaptiveController.generateProblem);
router.post("/evaluate", adaptiveController.evaluateSubmission);
router.get("/recommendations", adaptiveController.getRecommendations);
router.get("/history", adaptiveController.getHistory);
router.get("/problem/:id", adaptiveController.getProblem);

module.exports = router;
