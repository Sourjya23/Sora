const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/dashboard", authMiddleware, async (req, res) => {
  res.json({
    message: "Protected Route Accessed",
    user: req.user,
  });
});

module.exports = router;
