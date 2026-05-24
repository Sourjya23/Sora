const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { raiseTicket, getTickets, getMyTickets, dismissTicket } = require("../controllers/interviewController");

router.post("/raise-ticket", authMiddleware, upload.single("resume"), raiseTicket);
router.get("/tickets", authMiddleware, getTickets);
router.get("/my-tickets", authMiddleware, getMyTickets);
router.post("/dismiss/:id", authMiddleware, dismissTicket);

module.exports = router;
