const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

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

// Initialize cron jobs
const { startCronJobs } = require('./jobs');
startCronJobs();
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

app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ meetingId, userName }) => {
    console.log(`[socket] User ${userName} joined room ${meetingId}`);
    socket.join(meetingId);
    socket.meetingId = meetingId;
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
      io.to(room).emit("receive-message", data);
    } else {
      io.emit("receive-message", data);
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
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
