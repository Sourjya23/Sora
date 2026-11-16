require("./telemetry/tracing"); // Initialize OpenTelemetry first
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const { register, activeSocketGauge } = require("./telemetry/metrics");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const profileRoutes = require("./routes/profileRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const codeRoutes = require("./routes/codeRoutes");
const aiRoutes = require("./routes/aiRoutes");
const adaptiveRoutes = require("./routes/adaptiveRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const adminRoutes = require("./routes/adminRoutes");

const eventBus = require("./services/eventBus");
const emailOrchestrator = require("./services/emailOrchestrator");
const sentinelSupervisor = require("./services/agents/sentinelSupervisor");
const healthAgent = require("./services/agents/healthAgent");
const AgentReport = require("./models/AgentReport");

// Initialize cron jobs
const { startCronJobs } = require('./jobs');
startCronJobs();

// Start Cloud Agents & Event Outbox Workers
eventBus.startOutboxWorker(10000);
emailOrchestrator.startQueueWorker(15000);
sentinelSupervisor.startSupervision();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/meeting", meetingRoutes);
app.use("/api/code", codeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/adaptive", adaptiveRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/admin", adminRoutes);

// 🛡️ Sentinel Supervisor Monitoring & Health Endpoints
app.get("/api/v1/sentinel/health", async (req, res) => {
  try {
    const commAgent = require("./services/agents/communicationAgent");
    const relAgent = require("./services/agents/reliabilityAgent");
    const forAgent = require("./services/agents/forensicAgent");

    const [commAudit, relAudit, forAudit, hlthAudit] = await Promise.all([
      commAgent.runAudit(),
      relAgent.runAudit(),
      forAgent.runAudit(),
      healthAgent.runAudit(),
    ]);

    const allIssues = [
      ...commAudit.issues,
      ...relAudit.issues,
      ...forAudit.issues,
      ...hlthAudit.issues,
    ];

    const criticalCount = allIssues.filter((i) => i.severity === "CRITICAL").length;
    let overallStatus = "HEALTHY";
    if (criticalCount > 0) overallStatus = "CRITICAL";
    else if (allIssues.length > 0) overallStatus = "ISSUES_DETECTED";

    res.status(200).json({
      systemStatus: overallStatus,
      lastAudit: new Date(),
      agentAudits: {
        agent1_communication: commAudit,
        agent2_reliability: relAudit,
        agent3_forensics: forAudit,
        agent4_health: hlthAudit,
      },
      issues: allIssues,
      criticalCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/v1/sentinel/audit-now", async (req, res) => {
  try {
    const report = await sentinelSupervisor.runReconciliationAudit("MANUAL_AUDIT");
    res.status(200).json({ message: "Comprehensive audit finished", report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/v1/sentinel/reports", async (req, res) => {
  try {
    const reports = await AgentReport.find().sort({ generatedAt: -1 }).limit(20);
    res.status(200).json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📊 Prometheus & Grafana Cloud Metrics Scraping Endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT = process.env.PORT || 8000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  activeSocketGauge.inc();
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ meetingId, userName }) => {
    console.log(`[socket] User ${userName} joined room ${meetingId}`);
    socket.join(meetingId);
    socket.meetingId = meetingId;
    socket.to(meetingId).emit("peer-joined", { userName });
  });

  socket.on("candidate-joined", (data) => {
    console.log("[socket] Candidate joined broadcast:", data);
    // Broadcast globally so active interviewer dashboards get the notification banner
    socket.broadcast.emit("candidate-joined-notification", data);
    // Also notify the specific meeting room
    if (data.meetingId) {
      socket.to(data.meetingId).emit("candidate-joined-room", data);
    }
  });

  socket.on("send-message", (data) => {
    const room = data.meetingId || socket.meetingId;
    if (room) {
      socket.to(room).emit("receive-message", data);
    } else {
      socket.broadcast.emit("receive-message", data);
    }
  });

  socket.on("code-execution-started", (data) => {
    const room = data.meetingId || socket.meetingId;
    if (room) {
      socket.to(room).emit("code-execution-started", data);
    }
  });

  socket.on("code-execution-result", (data) => {
    const room = data.meetingId || socket.meetingId;
    if (room) {
      socket.to(room).emit("code-execution-result", data);
    }
  });

  socket.on("screen-share-status", (data) => {
    const room = data.meetingId || socket.meetingId;
    if (room) {
      socket.to(room).emit("screen-share-status", data);
    }
  });

  socket.on("code-update", (data) => {
    const room = data.meetingId || socket.meetingId;
    if (room) {
      socket.to(room).emit("code-changed", data);
    }
  });

  socket.on("language-change", (data) => {
    const room = data.meetingId || socket.meetingId;
    if (room) {
      socket.to(room).emit("language-changed", data);
    }
  });

  socket.on("telemetry-update", (data) => {
    const room = data.meetingId || socket.meetingId;
    if (room) {
      socket.to(room).emit("telemetry-update", data);
    }
  });

  socket.on("problem-statement-update", (data) => {
    const room = data.meetingId || socket.meetingId;
    if (room) {
      socket.to(room).emit("problem-statement-changed", data);
    }
  });

  socket.on("end-meeting", async (data) => {
    const room = data.meetingId || socket.meetingId;
    if (room) {
      io.to(room).emit("meeting-ended", data);
      try {
        const Meeting = require("./models/Meeting");
        await Meeting.updateOne({ meetingId: room }, { status: "completed" });
      } catch (err) {
        console.error("Failed to mark meeting as completed via socket:", err);
      }
    }
  });

  // WebRTC Signaling
  socket.on("webrtc-offer", (data) => {
    socket.to(data.meetingId).emit("webrtc-offer", data.offer);
  });

  socket.on("webrtc-answer", (data) => {
    socket.to(data.meetingId).emit("webrtc-answer", data.answer);
  });

  socket.on("webrtc-ice-candidate", (data) => {
    socket.to(data.meetingId).emit("webrtc-ice-candidate", data.candidate);
  });

  socket.on("disconnect", () => {
    activeSocketGauge.dec();
    console.log("User disconnected:", socket.id);
  });
});

// Express Global Error Handler wired to Health Agent
app.use((err, req, res, next) => {
  console.error("[Express Error Handler]", err);
  healthAgent.logError(err, { url: req.originalUrl, method: req.method, ip: req.ip });
  res.status(500).json({ message: "Internal server error", error: err.message });
});

process.on("unhandledRejection", (reason) => {
  console.error("[Unhandled Rejection]", reason);
  healthAgent.logError(new Error(String(reason)), { context: "unhandledRejection" });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
