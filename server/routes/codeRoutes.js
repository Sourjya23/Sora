const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { executeCode, executeTests } = require("../controllers/codeExecutionController");

router.post("/execute", authMiddleware, executeCode);
router.post("/execute-tests", authMiddleware, executeTests);

module.exports = router;
