import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import API from "../api/axios";
import socket from "../socket/socket";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  FileText,
  Play,
  Lock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Send,
  ExternalLink,
  X,
  User,
  Briefcase,
  Eye,
  Code as CodeIcon,
  Video as VideoIcon,
  RefreshCw,
  Clock,
  Sparkles,
} from "lucide-react";

// Language configurations
const LANGUAGES = {
  javascript: {
    name: "JavaScript",
    defaultCode: "// Write your solution here...\nfunction solve() {\n  \n}",
  },
  python: {
    name: "Python",
    defaultCode: "def solve():\n    pass\n\nif __name__ == '__main__':\n    solve()",
  },
  java: {
    name: "Java",
    defaultCode: "public class Solution {\n    public static void main(String[] args) {\n        \n    }\n}",
  },
  c: {
    name: "C",
    defaultCode: "#include <stdio.h>\n\nint main() {\n    return 0;\n}",
  },
  cpp: {
    name: "C++",
    defaultCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}",
  },
};

function MeetingRoom() {
  const { id } = useParams(); // roomId
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Password Verification State
  const [password, setPassword] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Media Preview States
  const [hasGrantedPermissions, setHasGrantedPermissions] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);

  // WebRTC States
  const [peerConnection, setPeerConnection] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Active view states
  const [isJoined, setIsJoined] = useState(false);
  const [activeInterviewerMainView, setActiveInterviewerMainView] = useState("video"); // 'video' | 'code'
  const [isInterviewEnded, setIsInterviewEnded] = useState(false);
  const [codeFailNotification, setCodeFailNotification] = useState(null);

  // Chat States
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // Editor States
  const [language, setLanguage] = useState("python");
  const [editorCode, setEditorCode] = useState(LANGUAGES["python"].defaultCode);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [stdin, setStdin] = useState("");

  // Problem / Tabs States
  const [problemStatement, setProblemStatement] = useState("");
  const [testCases, setTestCases] = useState([]);
  const [problemBank, setProblemBank] = useState([]);
  const [selectedProblemIndex, setSelectedProblemIndex] = useState("");
  const [isEditingProblem, setIsEditingProblem] = useState(false);
  const [leftTab, setLeftTab] = useState("problem"); // 'problem' | 'output' | 'chat'
  const [activeTestCaseTab, setActiveTestCaseTab] = useState(0);

  // Recording State
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);

  // Telemetry State
  const [telemetryEvents, setTelemetryEvents] = useState([]);

  // Screen Share State
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [candidateIsSharingScreen, setCandidateIsSharingScreen] = useState(false);
  const screenStreamRef = useRef(null);

  // Resume Modal State
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pipVideoRef = useRef(null);

  // 1. Fetch meeting metadata & user
  const fetchMeetingMetadata = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        navigate(`/login?redirect=${encodeURIComponent(`/meeting/${id}`)}`);
        return;
      }

      const res = await API.get(`/meeting/details/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === "completed") {
        alert("This meeting has already concluded.");
        navigate("/candidate-dashboard");
        return;
      }
      setMeetingDetails(res.data);
    } catch (err) {
      console.error("Failed to load meeting details", err);
      setPasswordError("Failed to verify meeting ID");
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        navigate(`/login?redirect=${encodeURIComponent(`/meeting/${id}`)}`);
      }
    } else {
      navigate(`/login?redirect=${encodeURIComponent(`/meeting/${id}`)}`);
    }
    fetchMeetingMetadata();
  }, [id, navigate]);

  // 2. Candidate Telemetry
  useEffect(() => {
    if (user?.role !== "candidate") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newEvent = {
          type: "tab_change",
          timestamp: new Date().toISOString(),
          description: "Candidate switched tabs or minimized window.",
        };
        setTelemetryEvents((prev) => [...prev, newEvent]);
        socket.emit("telemetry-update", { meetingId: id, event: newEvent });
      }
    };

    const handlePaste = () => {
      const newEvent = {
        type: "paste",
        timestamp: new Date().toISOString(),
        description: "Candidate pasted content into the editor.",
      };
      setTelemetryEvents((prev) => [...prev, newEvent]);
      socket.emit("telemetry-update", { meetingId: id, event: newEvent });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("paste", handlePaste, true);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("paste", handlePaste, true);
    };
  }, [user, id]);

  // 3. Interviewer Problem Bank
  useEffect(() => {
    if (user?.role === "interviewer") {
      const fetchProblemBank = async () => {
        try {
          const token = localStorage.getItem("token") || sessionStorage.getItem("token");
          const res = await API.get("/meeting/problem-bank", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setProblemBank(res.data || []);
        } catch (err) {
          console.error("Failed to fetch problem bank", err);
        }
      };
      fetchProblemBank();
    }
  }, [user]);

  const handleProblemSelect = (e) => {
    const idx = e.target.value;
    setSelectedProblemIndex(idx);
    if (idx === "") return;

    const problem = problemBank[idx];
    let fullText = `${problem.title}\n\n${problem.description}\n`;
    if (problem.examples) {
      problem.examples.forEach((ex, i) => {
        fullText += `\nExample ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}\n`;
        if (ex.explanation) fullText += `Explanation: ${ex.explanation}\n`;
      });
    }
    if (problem.constraints) {
      fullText += `\nConstraints:\n${problem.constraints}\n`;
    }

    setProblemStatement(fullText);
    setTestCases(problem.testCases || []);

    socket.emit("problem-statement-update", {
      meetingId: id,
      text: fullText,
      testCases: problem.testCases || [],
    });
  };

  // 4. Socket Listeners
  useEffect(() => {
    if (!isJoined || !user) return;

    socket.emit("join-room", { meetingId: id, userName: user.name });

    const codeListener = (data) => {
      if (data.code !== editorCode) setEditorCode(data.code);
    };

    const langListener = (data) => {
      if (data.language !== language) setLanguage(data.language);
    };

    const problemListener = (data) => {
      if (data.text !== problemStatement) setProblemStatement(data.text);
      if (data.testCases) setTestCases(data.testCases);
    };

    // Chat deduplication: ignore own socket, user ID or username echo
    const messageListener = (data) => {
      const myId = user?._id || user?.id;
      if (
        data.senderId === socket.id ||
        (myId && data.userId && String(data.userId) === String(myId)) ||
        (user?.name && data.sender === user.name)
      ) {
        return;
      }
      setMessages((prev) => {
        if (data.id && prev.some((m) => m.id === data.id)) return prev;
        return [...prev, { ...data, isMe: false }];
      });
    };

    const telemetryListener = (data) => {
      setTelemetryEvents((prev) => [...prev, data.event]);
    };

    // Code execution sync
    const executionStartedListener = () => {
      setIsExecuting(true);
      setExecutionResult(null);
    };

    const executionResultListener = (data) => {
      setIsExecuting(false);
      setExecutionResult(data.result);
      // Auto-switch to output tab so interviewer sees candidate test results immediately
      setLeftTab("output");

      // Notify interviewer if candidate's code execution failed on test cases or runtime error
      if (data.hasFailed && user?.role === "interviewer") {
        setCodeFailNotification({
          show: true,
          summary: data.failSummary || "Candidate code execution run failed.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      }
    };

    // Screen share status sync
    const screenShareStatusListener = (data) => {
      setCandidateIsSharingScreen(Boolean(data.isSharing));
    };

    const endListener = () => {
      if (user?.role === "candidate") {
        setIsInterviewEnded(true);
      } else {
        alert("The interview session has been ended.");
        navigate("/interviewer-dashboard");
      }
    };

    socket.on("code-changed", codeListener);
    socket.on("language-changed", langListener);
    socket.on("problem-statement-changed", problemListener);
    socket.on("receive-message", messageListener);
    socket.on("telemetry-update", telemetryListener);
    socket.on("code-execution-started", executionStartedListener);
    socket.on("code-execution-result", executionResultListener);
    socket.on("screen-share-status", screenShareStatusListener);
    socket.on("meeting-ended", endListener);

    return () => {
      socket.off("code-changed", codeListener);
      socket.off("language-changed", langListener);
      socket.off("problem-statement-changed", problemListener);
      socket.off("receive-message", messageListener);
      socket.off("telemetry-update", telemetryListener);
      socket.off("code-execution-started", executionStartedListener);
      socket.off("code-execution-result", executionResultListener);
      socket.off("screen-share-status", screenShareStatusListener);
      socket.off("meeting-ended", endListener);
    };
  }, [isJoined, user, id, editorCode, language, problemStatement, navigate]);

  // 5. Video Element Binding
  useEffect(() => {
    if (stream && localVideoRef.current && !isJoined) {
      localVideoRef.current.srcObject = stream;
    }
    if (stream && pipVideoRef.current && isJoined) {
      pipVideoRef.current.srcObject = stream;
    }
  }, [stream, isJoined]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // 6. WebRTC Peer Connection
  useEffect(() => {
    if (!isJoined || !stream) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", { meetingId: id, candidate: event.candidate });
      }
    };

    setPeerConnection(pc);

    const sendOffer = async () => {
      try {
        if (pc.signalingState !== "stable") return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { meetingId: id, offer });
      } catch (err) {
        console.error("Error creating WebRTC offer:", err);
      }
    };

    if (user?.role === "interviewer") {
      setTimeout(sendOffer, 1500);
    }

    const peerJoinedListener = () => {
      console.log("Peer joined, synchronizing WebRTC offer...");
      if (user?.role === "interviewer") {
        setTimeout(sendOffer, 600);
      }
    };

    socket.on("peer-joined", peerJoinedListener);

    const offerListener = async (offer) => {
      try {
        if (pc.signalingState !== "stable") return;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { meetingId: id, answer });
      } catch (err) {
        console.error("Error answering offer:", err);
      }
    };

    const answerListener = async (answer) => {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("Error setting remote description:", err);
      }
    };

    const iceListener = async (candidate) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Error adding ice candidate", e);
      }
    };

    socket.on("webrtc-offer", offerListener);
    socket.on("webrtc-answer", answerListener);
    socket.on("webrtc-ice-candidate", iceListener);

    return () => {
      socket.off("peer-joined", peerJoinedListener);
      socket.off("webrtc-offer", offerListener);
      socket.off("webrtc-answer", answerListener);
      socket.off("webrtc-ice-candidate", iceListener);
      pc.close();
    };
  }, [isJoined, stream, id, user]);

  // 7. Screen Recording (Interviewer)
  const startScreenRecording = async () => {
    try {
      if (isRecording || mediaRecorderRef.current) return;
      if (!remoteVideoRef.current || !remoteVideoRef.current.srcObject) {
        console.log("Waiting for remote stream to start recording...");
        return;
      }

      const candidateStream = remoteVideoRef.current.srcObject;
      const tracks = [];

      // Video tracks
      const vidTracks = candidateStream.getVideoTracks();
      if (vidTracks.length > 0) {
        tracks.push(vidTracks[0]);
      }

      // Audio mixing
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const audioContext = new AudioContextClass();
          if (audioContext.state === "suspended") {
            await audioContext.resume();
          }
          const dest = audioContext.createMediaStreamDestination();
          let hasAudio = false;

          // Local interviewer audio
          if (stream && stream.getAudioTracks().length > 0) {
            try {
              const micSource = audioContext.createMediaStreamSource(stream);
              micSource.connect(dest);
              hasAudio = true;
            } catch (e) {
              console.warn("Could not pipe local audio:", e);
            }
          }

          // Candidate audio
          if (candidateStream.getAudioTracks().length > 0) {
            try {
              const remoteSource = audioContext.createMediaStreamSource(candidateStream);
              remoteSource.connect(dest);
              hasAudio = true;
            } catch (e) {
              console.warn("Could not pipe candidate audio:", e);
            }
          }

          if (hasAudio && dest.stream.getAudioTracks().length > 0) {
            tracks.push(dest.stream.getAudioTracks()[0]);
          }
        }
      } catch (aErr) {
        console.warn("Audio mixing fallback:", aErr);
        if (candidateStream.getAudioTracks().length > 0) {
          tracks.push(candidateStream.getAudioTracks()[0]);
        }
      }

      if (tracks.length === 0) {
        console.warn("No active tracks found for screen recording.");
        return;
      }

      const finalStream = new MediaStream(tracks);

      // MIME type resolution
      const candidates = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ];
      const selectedMime = candidates.find((t) => MediaRecorder.isTypeSupported(t)) || "";
      const options = selectedMime ? { mimeType: selectedMime } : {};

      const recorder = new MediaRecorder(finalStream, options);
      mediaRecorderRef.current = recorder;
      recordedChunks.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      recorder.onerror = (err) => {
        console.error("Screen recording recorder error:", err);
      };

      recorder.start(1000);
      setMediaRecorder(recorder);
      setIsRecording(true);
      console.log("Interview screen recording started successfully.");
    } catch (err) {
      console.error("Screen recording initialization error:", err);
    }
  };

  // Auto-record once remote stream arrives for interviewer
  useEffect(() => {
    if (user?.role === "interviewer" && isJoined && remoteStream && !isRecording) {
      startScreenRecording();
    }
  }, [user, isJoined, remoteStream, isRecording]);

  // 8. Stop Recording & Upload Forensic Report
  const stopRecordingAndUpload = async () => {
    setUploadingRecording(true);

    const submitForensics = async (fileBlob = null) => {
      const formData = new FormData();
      if (fileBlob) {
        const file = new File([fileBlob], `interview-${id}.webm`, { type: "video/webm" });
        formData.append("recording", file);
      }
      formData.append("finalCode", editorCode || "");
      formData.append("problemStatement", problemStatement || "");
      formData.append("telemetryEvents", JSON.stringify(telemetryEvents || []));

      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        await API.post(`/meeting/upload-recording/${id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        console.log("Forensics & recording payload submitted successfully.");
      } catch (err) {
        console.error("Failed to upload recording/forensics payload", err);
      } finally {
        setUploadingRecording(false);
        socket.emit("end-meeting", { meetingId: id });
        navigate("/interviewer-dashboard");
      }
    };

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        submitForensics(blob);
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else if (recordedChunks.current.length > 0) {
      const blob = new Blob(recordedChunks.current, { type: "video/webm" });
      submitForensics(blob);
    } else {
      // No video captured, still generate deterministic forensic report!
      submitForensics(null);
    }
  };

  // 9. Screen Share Toggle (Candidate)
  const toggleScreenShare = async () => {
    if (!isSharingScreen) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        screenStreamRef.current = displayStream;

        const videoTrack = displayStream.getVideoTracks()[0];
        if (peerConnection) {
          const sender = peerConnection.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }

        setIsSharingScreen(true);
        socket.emit("screen-share-status", { meetingId: id, isSharing: true });

        videoTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err) {
        console.error("Failed to share screen", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    if (peerConnection && stream) {
      const cameraTrack = stream.getVideoTracks()[0];
      const sender = peerConnection.getSenders().find((s) => s.track && s.track.kind === "video");
      if (sender && cameraTrack) {
        sender.replaceTrack(cameraTrack);
      }
    }
    setIsSharingScreen(false);
    socket.emit("screen-share-status", { meetingId: id, isSharing: false });
  };

  // 10. Passcode verification
  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setVerifyingPassword(true);
    setPasswordError("");

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await API.post(
        `/meeting/verify-password/${id}`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordVerified(true);
      requestPermissions();
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Invalid meeting key password.");
    } finally {
      setVerifyingPassword(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(localStream);
      setHasGrantedPermissions(true);
    } catch (err) {
      console.error("Permission denied", err);
      alert("Please grant camera and microphone access to proceed.");
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraActive(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicActive(audioTrack.enabled);
      }
    }
  };

  const joinMeeting = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await API.post(`/meeting/join/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });

      if (user?.role === "candidate") {
        socket.emit("candidate-joined", {
          meetingId: id,
          candidateName: user.name,
        });
      }

      setIsJoined(true);
    } catch (err) {
      console.error("Join registration fallback", err);
      setIsJoined(true);
    }
  };

  const handleEditorChange = (newVal) => {
    setEditorCode(newVal);
    socket.emit("code-update", { meetingId: id, code: newVal });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setEditorCode(LANGUAGES[newLang].defaultCode);
    socket.emit("language-change", { meetingId: id, language: newLang });
    socket.emit("code-update", { meetingId: id, code: LANGUAGES[newLang].defaultCode });
  };

  const handleProblemChange = (e) => {
    setProblemStatement(e.target.value);
    socket.emit("problem-statement-update", { meetingId: id, text: e.target.value });
  };

  // Chat message send with dedup id and user ID
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const msgId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const payload = {
      id: msgId,
      meetingId: id,
      userId: user?._id || user?.id,
      sender: user?.name || "Participant",
      senderId: socket.id,
      role: user?.role,
      text: chatMessage.trim(),
      time,
    };

    socket.emit("send-message", payload);
    setMessages((prev) => [...prev, { ...payload, isMe: true }]);
    setChatMessage("");
  };

  // Code Execution Sync with failure alert broadcast
  const runCode = async () => {
    if (user?.role === "candidate" && !isSharingScreen) {
      alert("You must share your screen before running code.");
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);
    socket.emit("code-execution-started", { meetingId: id });

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      let resultData = null;

      if (testCases && testCases.length > 0) {
        setActiveTestCaseTab(0);
        const res = await API.post(
          "/code/execute-tests",
          { language: language === "c" || language === "cpp" ? language : language, code: editorCode, testCases },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        resultData = { type: "tests", results: res.data.results };
      } else {
        const res = await API.post(
          "/code/execute",
          { language: language === "c" || language === "cpp" ? language : language, code: editorCode, stdin },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        resultData = { type: "single", ...res.data };
      }

      const hasFailed =
        resultData.type === "error" ||
        (resultData.type === "tests" && resultData.results?.some((r) => !r.passed));
      const failSummary = hasFailed
        ? resultData.type === "error"
          ? "Runtime or Compilation Error"
          : `${resultData.results?.filter((r) => !r.passed).length} of ${resultData.results?.length} test cases failed`
        : null;

      setExecutionResult(resultData);
      socket.emit("code-execution-result", {
        meetingId: id,
        result: resultData,
        hasFailed,
        failSummary,
      });
      setLeftTab("output");
    } catch (err) {
      console.error("Execution failed", err);
      const errorData = { type: "error", error: err.response?.data?.message || err.message };
      setExecutionResult(errorData);
      socket.emit("code-execution-result", {
        meetingId: id,
        result: errorData,
        hasFailed: true,
        failSummary: errorData.error,
      });
      setLeftTab("output");
    } finally {
      setIsExecuting(false);
    }
  };

  const endMeeting = () => {
    if (confirm("Are you sure you want to end this interview for everyone?")) {
      if (user?.role === "interviewer") {
        stopRecordingAndUpload();
      } else {
        socket.emit("end-meeting", { meetingId: id });
        navigate(user?.role === "candidate" ? "/candidate-dashboard" : "/interviewer-dashboard");
      }
    }
  };

  // Helper variables for clean UI badges
  const candidateName = meetingDetails?.candidate?.name || (user?.role === "candidate" ? user?.name : "Candidate");
  const interviewerName = meetingDetails?.interviewer?.name || (user?.role === "interviewer" ? user?.name : "Interviewer");
  const jobIdDisplay = meetingDetails?.jobId || `JOB-${id.slice(0, 6).toUpperCase()}`;
  const effectiveResumeUrl = meetingDetails?.resumeUrl || meetingDetails?.candidate?.resumeUrl;

  if (loadingDetails) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-[#062438] via-[#041a2a] to-[#02101b] flex flex-col items-center justify-center text-white font-sans">
        <div className="relative flex items-center justify-center mb-4">
          <img
            src="/Sora_Favicon.jpg"
            alt="Sora"
            className="w-12 h-12 rounded-xl shadow-[0_0_25px_rgba(56,189,248,0.45)] border border-cyan-400/30 object-cover animate-pulse"
          />
        </div>
        <p className="text-sm font-medium text-cyan-200/80 tracking-wide">Initializing Sora Secure Session...</p>
      </div>
    );
  }

  // STEP 0: Candidate Interview Termination Screen
  if (isInterviewEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#062438] via-[#041a2a] to-[#02101b] flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden font-sans">
        {/* Ambient Top Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]"
        />

        <div className="bg-[#082235]/85 border border-cyan-500/30 backdrop-blur-2xl p-8 sm:p-12 rounded-3xl max-w-lg w-full shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative z-10 flex flex-col items-center">
          <div className="relative mb-5">
            <img
              src="/Sora_Favicon.jpg"
              alt="Sora"
              className="w-16 h-16 rounded-2xl shadow-[0_0_25px_rgba(56,189,248,0.45)] border border-cyan-400/40 object-cover"
            />
          </div>

          <h2
            className="text-3xl sm:text-4xl font-normal text-white mb-3 tracking-tight"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Interview Ended
          </h2>

          <p className="text-base text-cyan-200 font-medium mb-2">
            Your interview has been ended. You can now leave the call.
          </p>

          <p className="text-sm text-zinc-400 max-w-sm mb-8 leading-relaxed">
            Your results will be announced after the evaluation is complete.
          </p>

          <button
            onClick={() => navigate(user?.role === "candidate" ? "/candidate-dashboard" : "/interviewer-dashboard")}
            className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#02101b] font-semibold py-3 px-6 rounded-2xl text-sm transition-all shadow-xl shadow-cyan-950/50 hover:shadow-cyan-400/30 cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // STEP 1: Enter Key Password
  if (!passwordVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#062438] via-[#041a2a] to-[#02101b] flex flex-col items-center justify-center text-white p-4 font-sans relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px]"
        />

        <div className="bg-[#082235]/70 border border-cyan-500/20 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative z-10">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-3">
              <img
                src="/Sora_Favicon.jpg"
                alt="Sora"
                className="w-14 h-14 rounded-2xl shadow-[0_0_20px_rgba(56,189,248,0.4)] border border-cyan-400/40 object-cover"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#082235] rounded-full" />
            </div>
            <h1
              className="text-3xl font-normal text-white text-center tracking-tight"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Sora Live Loop
            </h1>
            <p className="text-cyan-200/60 text-xs mt-1.5 text-center">
              Verified Technical Interview Room • {jobIdDisplay}
            </p>
          </div>

          <div className="mb-6 p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/15 flex items-center justify-between text-xs text-cyan-200">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>{user?.role === "candidate" ? `Mentor: ${interviewerName}` : `Candidate: ${candidateName}`}</span>
            </div>
            <span className="text-[10px] font-mono bg-cyan-500/15 px-2 py-0.5 rounded-md text-cyan-300">
              {jobIdDisplay}
            </span>
          </div>

          {passwordError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-cyan-200/80 mb-1.5 uppercase tracking-wider text-center">
                Room Passcode Key
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value.toUpperCase())}
                placeholder="PASS-XXXX"
                className="w-full bg-[#051726]/80 border border-cyan-500/30 rounded-2xl py-3 px-4 text-sm text-center text-white outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(56,189,248,0.25)] font-mono tracking-widest font-bold uppercase transition-all placeholder:text-zinc-600"
              />
            </div>
            <button
              type="submit"
              disabled={verifyingPassword}
              className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#02101b] font-semibold py-3 px-4 rounded-2xl text-xs transition-all shadow-lg shadow-cyan-900/40 hover:shadow-cyan-400/25 disabled:opacity-40 cursor-pointer"
            >
              {verifyingPassword ? "Verifying..." : "Enter Interview Session"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // STEP 2: Pre-join Lobby (Media Check)
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#062438] via-[#041a2a] to-[#02101b] flex items-center justify-center p-6 font-sans text-white relative overflow-hidden">
        {/* Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px]"
        />

        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-3 px-1">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-2">
                <VideoIcon className="w-4 h-4 text-cyan-400" /> Camera & Mic Check
              </span>
              <span className="text-[10px] text-cyan-400/70 font-mono">Live Preview</span>
            </div>

            <div className="w-full aspect-video bg-[#031320] rounded-3xl border border-cyan-500/20 overflow-hidden relative shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex items-center justify-center">
              {hasGrantedPermissions ? (
                <>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraActive ? "" : "hidden"}`}
                  />
                  {!cameraActive && (
                    <div className="text-cyan-200/50 text-xs text-center flex flex-col items-center gap-2">
                      <VideoOff className="w-6 h-6 text-cyan-400/40" />
                      <span>Camera preview paused</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-cyan-200/60 text-xs p-6 text-center flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <VideoIcon className="w-5 h-5" />
                  </div>
                  <span>Enable camera and microphone permissions to proceed into the loop.</span>
                </div>
              )}

              {hasGrantedPermissions && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-black/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-cyan-500/30 shadow-xl">
                  <button
                    onClick={toggleMic}
                    className={`p-2 rounded-xl text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                      micActive
                        ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-200"
                        : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    <span className="text-[11px]">{micActive ? "Mic On" : "Muted"}</span>
                  </button>

                  <button
                    onClick={toggleCamera}
                    className={`p-2 rounded-xl text-xs border transition-all flex items-center gap-1.5 cursor-pointer ${
                      cameraActive
                        ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-200"
                        : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    <span className="text-[11px]">{cameraActive ? "Cam On" : "Cam Off"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#082235]/70 border border-cyan-500/20 p-8 sm:p-10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl flex flex-col justify-between min-h-[320px]">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src="/Sora_Favicon.jpg"
                  alt="Sora"
                  className="w-10 h-10 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.4)] border border-cyan-400/30 object-cover"
                />
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                    Pre-Flight Check
                  </span>
                  <h2
                    className="text-2xl font-normal text-white"
                    style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                  >
                    Enter Live Loop
                  </h2>
                </div>
              </div>

              <div className="space-y-2 mt-4 text-xs text-cyan-100/70 leading-relaxed">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Job ID: <strong className="text-white font-mono">{jobIdDisplay}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Role: <strong className="text-white capitalize">{user?.role}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{user?.role === "candidate" ? `Interviewer: ${interviewerName}` : `Candidate: ${candidateName}`}</span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              {!hasGrantedPermissions ? (
                <button
                  onClick={requestPermissions}
                  className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#02101b] font-semibold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-lg shadow-cyan-900/40 cursor-pointer"
                >
                  Enable Camera & Mic
                </button>
              ) : (
                <button
                  onClick={joinMeeting}
                  className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#02101b] font-semibold py-3.5 px-4 rounded-2xl text-xs transition-all shadow-lg shadow-cyan-900/40 hover:shadow-cyan-400/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Enter Meeting Room</span>
                  <Sparkles className="w-4 h-4 text-[#02101b]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: Active Meeting View (Full-Featured Live Loop)
  const renderTabsBlock = () => (
    <div className="flex flex-col flex-1 overflow-hidden bg-[#051726]/80">
      {/* Tab Navigation */}
      <div className="flex bg-[#041523] border-b border-cyan-500/15 shrink-0">
        <button
          onClick={() => setLeftTab("problem")}
          className={`flex-1 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            leftTab === "problem"
              ? "text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10 font-semibold"
              : "text-zinc-400 hover:text-cyan-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Problem</span>
        </button>

        <button
          onClick={() => setLeftTab("output")}
          className={`flex-1 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer relative ${
            leftTab === "output"
              ? "text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10 font-semibold"
              : "text-zinc-400 hover:text-cyan-200"
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Output & Tests</span>
          {isExecuting && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute top-2 right-3" />
          )}
          {executionResult && (
            <span
              className={`w-2 h-2 rounded-full absolute top-2 right-3 ${
                executionResult.type === "tests"
                  ? executionResult.results?.every((r) => r.passed)
                    ? "bg-emerald-400"
                    : "bg-rose-400"
                  : executionResult.statusCode === 200
                  ? "bg-emerald-400"
                  : "bg-rose-400"
              }`}
            />
          )}
        </button>

        <button
          onClick={() => setLeftTab("chat")}
          className={`flex-1 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
            leftTab === "chat"
              ? "text-cyan-300 border-b-2 border-cyan-400 bg-cyan-500/10 font-semibold"
              : "text-zinc-400 hover:text-cyan-200"
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Chat</span>
          {messages.length > 0 && (
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 rounded-full font-mono">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* PROBLEM TAB */}
        {leftTab === "problem" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">
                Problem Statement
              </span>
              {user?.role === "interviewer" && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedProblemIndex}
                    onChange={handleProblemSelect}
                    className="bg-[#082235] border border-cyan-500/30 text-xs text-cyan-100 rounded-xl px-2.5 py-1 outline-none"
                  >
                    <option value="">Choose Problem Bank...</option>
                    {problemBank.map((p, i) => (
                      <option key={i} value={i}>
                        {p.title} ({p.difficulty || "Medium"})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIsEditingProblem(!isEditingProblem)}
                    className="text-xs text-cyan-300 hover:text-cyan-100 underline font-medium cursor-pointer"
                  >
                    {isEditingProblem ? "Save" : "Edit"}
                  </button>
                </div>
              )}
            </div>

            {isEditingProblem ? (
              <textarea
                className="w-full h-full bg-[#031320] border border-cyan-500/20 rounded-2xl p-4 text-xs text-white outline-none focus:border-cyan-400 font-mono resize-none leading-relaxed"
                value={problemStatement}
                onChange={handleProblemChange}
                placeholder="Type or paste the problem description, inputs, and constraints here..."
              />
            ) : (
              <div className="w-full h-full bg-[#031320]/60 border border-cyan-500/15 rounded-2xl p-4 text-xs text-cyan-100/90 whitespace-pre-wrap overflow-y-auto leading-relaxed font-sans">
                {problemStatement || (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs">
                    <FileText className="w-8 h-8 text-cyan-500/30 mb-2" />
                    <span>No problem statement assigned yet.</span>
                    {user?.role === "interviewer" && (
                      <span className="text-cyan-400/70 mt-1">Select a problem from the dropdown above.</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* OUTPUT & TESTS TAB (Synced Live for Interviewer & Candidate!) */}
        {leftTab === "output" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#031320]/70 rounded-2xl border border-cyan-500/15 p-3">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/15 shrink-0">
              <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                Live Execution Results
              </span>
              {isExecuting ? (
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" /> Running code...
                </span>
              ) : executionResult ? (
                executionResult.type === "tests" ? (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
                      executionResult.results?.every((r) => r.passed)
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {executionResult.results?.filter((r) => r.passed).length}/
                    {executionResult.results?.length} Tests Passed
                  </span>
                ) : (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                      executionResult.statusCode === 200
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    {executionResult.statusCode === 200 ? "Success" : "Error"}
                  </span>
                )
              ) : (
                <span className="text-[10px] text-zinc-500 font-mono">Idle</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-xs text-zinc-200">
              {isExecuting ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-cyan-300/80 gap-3">
                  <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                  <span className="text-xs">Executing candidate code against test harness...</span>
                </div>
              ) : executionResult ? (
                executionResult.type === "tests" ? (
                  <div className="space-y-3">
                    {/* Test Case Tabs */}
                    <div className="flex gap-1.5 border-b border-cyan-500/15 pb-2 overflow-x-auto">
                      {executionResult.results?.map((tr, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveTestCaseTab(idx)}
                          className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                            activeTestCaseTab === idx
                              ? "bg-cyan-500 text-[#02101b] font-semibold shadow-md shadow-cyan-900/40"
                              : "bg-[#061e31] text-zinc-400 hover:text-white"
                          }`}
                        >
                          {tr.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span>Case {tr.testCaseNumber || idx + 1}</span>
                        </button>
                      ))}
                    </div>

                    {/* Active Case Details */}
                    {executionResult.results?.[activeTestCaseTab] && (
                      <div className="space-y-2 bg-[#051726]/80 p-3 rounded-xl border border-cyan-500/10 text-xs">
                        <div>
                          <span className="text-cyan-400/80 text-[11px] block mb-1">Input:</span>
                          <pre className="bg-[#03111c] p-2 rounded-lg text-zinc-200 overflow-x-auto">
                            {executionResult.results[activeTestCaseTab].input || "(no input)"}
                          </pre>
                        </div>
                        <div>
                          <span className="text-emerald-400/80 text-[11px] block mb-1">Expected Output:</span>
                          <pre className="bg-[#03111c] p-2 rounded-lg text-emerald-300 overflow-x-auto">
                            {executionResult.results[activeTestCaseTab].expectedOutput}
                          </pre>
                        </div>
                        <div>
                          <span className="text-cyan-300 text-[11px] block mb-1">Actual Output:</span>
                          <pre
                            className={`p-2 rounded-lg overflow-x-auto ${
                              executionResult.results[activeTestCaseTab].passed
                                ? "bg-emerald-950/30 text-emerald-300 border border-emerald-500/20"
                                : "bg-rose-950/40 text-rose-300 border border-rose-500/30"
                            }`}
                          >
                            {executionResult.results[activeTestCaseTab].actualOutput || "(empty output)"}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : executionResult.type === "error" ? (
                  <div className="bg-rose-950/30 border border-rose-500/30 p-3 rounded-xl">
                    <span className="text-rose-400 font-semibold block mb-1 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400" /> Runtime / Compilation Error:
                    </span>
                    <pre className="text-rose-300 whitespace-pre-wrap text-xs">{executionResult.error}</pre>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[10px] text-cyan-400 uppercase tracking-wider block">Standard Output:</span>
                    <pre className="bg-[#03111c] p-3 rounded-xl whitespace-pre-wrap text-xs text-zinc-200 border border-cyan-500/10">
                      {executionResult.output || "(no output)"}
                    </pre>
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs">
                  <Play className="w-8 h-8 text-cyan-500/20 mb-2" />
                  <span>No code execution runs recorded yet.</span>
                  <span className="text-[11px] text-zinc-600 mt-1">
                    When the candidate runs code, outputs and test case results stream here automatically.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHAT TAB (Strictly De-duplicated) */}
        {leftTab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#031320]/70 rounded-2xl border border-cyan-500/15">
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {(() => {
                const uniqueMessages = [];
                const seenKeys = new Set();
                for (const msg of messages) {
                  const key = msg.id || `${msg.sender}_${msg.time}_${msg.text}`;
                  if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    uniqueMessages.push(msg);
                  }
                }

                if (uniqueMessages.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs">
                      <Send className="w-7 h-7 text-cyan-500/20 mb-2" />
                      <span>No messages yet. Send a note to the room.</span>
                    </div>
                  );
                }

                return uniqueMessages.map((msg, idx) => {
                  const myId = user?._id || user?.id;
                  const isMine =
                    msg.isMe ||
                    msg.senderId === socket.id ||
                    (myId && msg.userId && String(msg.userId) === String(myId)) ||
                    (user?.name && msg.sender === user.name);

                  return (
                    <div key={msg.id || idx} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] text-cyan-300/60 mb-0.5">
                        {isMine ? "You" : msg.sender} • {msg.time}
                      </span>
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-xs max-w-[85%] break-words shadow-md ${
                          isMine
                            ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-cyan-950/40"
                            : "bg-[#061e31] border border-cyan-500/20 text-cyan-100"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-2.5 border-t border-cyan-500/15 bg-[#041523] flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message to participant..."
                className="flex-1 bg-[#061f33] border border-cyan-500/20 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-400 placeholder:text-zinc-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatMessage.trim()}
                className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#02101b] px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-gradient-to-br from-[#062438] via-[#041a2a] to-[#02101b] flex flex-col relative overflow-hidden font-sans text-white select-none">
      {/* 1. TOP HEADER NAVIGATION */}
      <header className="h-16 border-b border-cyan-500/15 bg-[#051726]/85 backdrop-blur-xl flex items-center justify-between px-5 sm:px-6 z-20 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        {/* Left: Brand + Sora Logo + Job ID */}
        <div className="flex items-center space-x-3.5">
          <div className="flex items-center gap-2.5">
            <img
              src="/Sora_Favicon.jpg"
              alt="Sora"
              className="w-8 h-8 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.45)] border border-cyan-400/40 object-cover"
            />
            <span
              className="font-normal text-white text-xl tracking-tight hidden sm:inline"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Sora
            </span>
          </div>

          <div className="h-4 w-px bg-cyan-500/20 hidden sm:block" />

          {/* Job ID Badge */}
          <div className="flex items-center gap-1.5 bg-[#082235] border border-cyan-500/25 px-2.5 py-1 rounded-xl text-xs font-mono text-cyan-300">
            <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
            <span>{jobIdDisplay}</span>
          </div>

          {/* Recording Status */}
          {isRecording && (
            <span className="hidden md:flex items-center gap-1 text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-300 px-2 py-0.5 rounded-lg uppercase tracking-wider font-mono animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Rec
            </span>
          )}

          {uploadingRecording && (
            <span className="text-[10px] text-amber-300 font-mono animate-pulse">
              Generating AI Forensic Report...
            </span>
          )}
        </div>

        {/* Center: Names & Screen Share Badge */}
        <div className="hidden lg:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-[#071f31] border border-cyan-500/20 px-3 py-1 rounded-xl">
            <span className="text-cyan-300/70">Candidate:</span>
            <span className="text-white font-medium">{candidateName}</span>
          </div>

          <div className="flex items-center gap-2 bg-[#071f31] border border-cyan-500/20 px-3 py-1 rounded-xl">
            <span className="text-cyan-300/70">Interviewer:</span>
            <span className="text-white font-medium">{interviewerName}</span>
          </div>

          {/* Screen Share Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono border ${
              (user?.role === "candidate" ? isSharingScreen : candidateIsSharingScreen)
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/15 border-amber-500/30 text-amber-300"
            }`}
          >
            <ScreenShare className="w-3.5 h-3.5" />
            <span>
              {(user?.role === "candidate" ? isSharingScreen : candidateIsSharingScreen)
                ? "Screen Shared"
                : "Screen Not Shared"}
            </span>
          </div>
        </div>

        {/* Right: Actions (Resume, Screen share, End/Leave) */}
        <div className="flex items-center gap-2.5">
          {/* Interviewer View: View Resume Button */}
          {user?.role === "interviewer" && (
            <button
              onClick={() => setIsResumeOpen(true)}
              className="text-xs bg-[#082235] hover:bg-[#0c2e47] text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="View Candidate's Submitted Resume"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Resume</span>
            </button>
          )}

          {/* Interviewer View: Switch between Candidate Video/Screen & Synced Code */}
          {user?.role === "interviewer" && (
            <button
              onClick={() =>
                setActiveInterviewerMainView(activeInterviewerMainView === "video" ? "code" : "video")
              }
              className="text-xs bg-[#082235] hover:bg-[#0c2e47] text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {activeInterviewerMainView === "video" ? (
                <>
                  <CodeIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">View Code</span>
                </>
              ) : (
                <>
                  <VideoIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">View Screen</span>
                </>
              )}
            </button>
          )}

          {/* Candidate View: Screen Share Button */}
          {user?.role === "candidate" && (
            <button
              onClick={toggleScreenShare}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                isSharingScreen
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-md shadow-emerald-950/40"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-cyan-400/30 shadow-md shadow-cyan-900/40"
              }`}
            >
              {isSharingScreen ? <ScreenShareOff className="w-3.5 h-3.5" /> : <ScreenShare className="w-3.5 h-3.5" />}
              <span>{isSharingScreen ? "Stop Sharing" : "Share Screen"}</span>
            </button>
          )}

          {/* End / Leave Button */}
          {user?.role === "interviewer" ? (
            <button
              onClick={endMeeting}
              disabled={uploadingRecording}
              className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3.5 py-1.5 rounded-xl font-semibold transition-all disabled:opacity-40 cursor-pointer"
            >
              End Session
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm("Leave this interview room?")) navigate("/candidate-dashboard");
              }}
              className="text-xs bg-[#082235] hover:bg-[#0c2e47] text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-xl transition-all border border-cyan-500/20 cursor-pointer"
            >
              Leave
            </button>
          )}
        </div>
      </header>

      {/* 2. MAIN SPLIT SCREEN VIEW */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* INTERVIEWER LAYOUT */}
        {user?.role === "interviewer" && (
          <>
            {/* Primary Center Panel: Video/Screen Stream or Synced Code */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#031320]/60 relative">
              {/* Candidate Code Execution Failure Notification Banner */}
              {codeFailNotification && codeFailNotification.show && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-rose-950/90 border border-rose-500/50 backdrop-blur-md px-4 py-2.5 rounded-2xl text-xs text-rose-200 shadow-2xl flex items-center gap-3 animate-fade-rise">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    <strong className="font-semibold text-white">Candidate Run Failed:</strong>{" "}
                    {codeFailNotification.summary} ({codeFailNotification.time})
                  </span>
                  <button
                    onClick={() => {
                      setLeftTab("output");
                      setCodeFailNotification(null);
                    }}
                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-rose-500/30 transition-all cursor-pointer"
                  >
                    Inspect Output
                  </button>
                  <button
                    onClick={() => setCodeFailNotification(null)}
                    className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {activeInterviewerMainView === "video" ? (
                <div className="w-full h-full max-w-6xl aspect-video bg-black rounded-3xl border border-cyan-500/20 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative flex items-center justify-center">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />

                  {!remoteStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 text-xs gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-cyan-500/30" />
                      <span>Waiting for candidate to connect stream...</span>
                    </div>
                  )}

                  {/* Candidate Screen Shared Pill */}
                  {candidateIsSharingScreen && (
                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl border border-cyan-500/30 text-[11px] text-cyan-300 flex items-center gap-1.5 z-10 font-mono">
                      <ScreenShare className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Candidate Screen Feed</span>
                    </div>
                  )}

                  {/* Interviewer Self PIP */}
                  <div className="absolute bottom-4 right-4 w-44 aspect-video bg-[#031320] rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden z-20">
                    <video
                      ref={pipVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Floating Media Controls Dock */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-black/75 backdrop-blur-md px-4 py-2 rounded-2xl border border-cyan-500/30 shadow-2xl z-20">
                    <button
                      onClick={toggleMic}
                      className={`p-2 rounded-xl text-xs transition-all border cursor-pointer ${
                        micActive
                          ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-200"
                          : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                      }`}
                      title={micActive ? "Mute Microphone" : "Unmute Microphone"}
                    >
                      {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={toggleCamera}
                      className={`p-2 rounded-xl text-xs transition-all border cursor-pointer ${
                        cameraActive
                          ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-200"
                          : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                      }`}
                      title={cameraActive ? "Turn Off Camera" : "Turn On Camera"}
                    >
                      {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                /* Synced Read-Only Code Viewer for Interviewer */
                <div className="w-full h-full max-w-6xl flex flex-col bg-[#051726] rounded-3xl border border-cyan-500/20 overflow-hidden shadow-2xl">
                  <div className="h-12 bg-[#041523] border-b border-cyan-500/15 flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono">
                      <CodeIcon className="w-4 h-4 text-cyan-400" />
                      <span>Live Synced Candidate Editor ({language})</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">Live Mirroring</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <Editor
                      height="100%"
                      language={language === "c" || language === "cpp" ? "cpp" : language}
                      value={editorCode}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 13,
                        padding: { top: 14 },
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar: Problem Statement, Candidate Output, and Chat */}
            <div className="w-[430px] shrink-0 border-l border-cyan-500/15 flex flex-col shadow-2xl z-10">
              {renderTabsBlock()}
            </div>
          </>
        )}

        {/* CANDIDATE LAYOUT */}
        {user?.role === "candidate" && (
          <>
            {/* Left Column: Video Feeds + Problem/Chat Tabs */}
            <div className="w-[380px] min-w-[340px] border-r border-cyan-500/15 flex flex-col bg-[#051726]/90 shrink-0">
              {/* Remote Interviewer Video Feed */}
              <div className="aspect-video bg-black relative border-b border-cyan-500/15 shrink-0 overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!remoteStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 text-xs gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-500/30" />
                    <span>Waiting for interviewer...</span>
                  </div>
                )}

                {/* Candidate Self PIP */}
                <div className="absolute bottom-3 right-3 w-28 aspect-video bg-black rounded-xl border border-cyan-500/30 shadow-xl overflow-hidden z-10">
                  <video
                    ref={pipVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Dock Controls */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 z-20">
                  <button
                    onClick={toggleMic}
                    className={`p-1.5 rounded-lg text-xs transition-all border cursor-pointer ${
                      micActive
                        ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-200"
                        : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {micActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={toggleCamera}
                    className={`p-1.5 rounded-lg text-xs transition-all border cursor-pointer ${
                      cameraActive
                        ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-200"
                        : "bg-rose-500/20 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {cameraActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Tabs Block Under Video */}
              {renderTabsBlock()}
            </div>

            {/* Right Column: Code Editor + Screen Share Gate Overlay + Test Runner */}
            <div className="flex-1 flex flex-col bg-[#020d17] relative overflow-hidden">
              {/* Editor Header Toolbar */}
              <div className="h-12 bg-[#041523] border-b border-cyan-500/15 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                  <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="bg-[#082235] border border-cyan-500/30 text-cyan-100 text-xs rounded-xl px-3 py-1.5 outline-none font-medium cursor-pointer"
                  >
                    {Object.keys(LANGUAGES).map((key) => (
                      <option key={key} value={key}>
                        {LANGUAGES[key].name}
                      </option>
                    ))}
                  </select>

                  {!isSharingScreen && (
                    <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-400" /> Screen share required to code
                    </span>
                  )}
                </div>

                <button
                  onClick={runCode}
                  disabled={isExecuting || !isSharingScreen}
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#02101b] font-semibold px-5 py-1.5 rounded-xl text-xs transition-all disabled:opacity-40 shadow-md shadow-cyan-950/40 flex items-center gap-1.5 cursor-pointer"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Run Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Monaco Editor Container with Screen Share Gate Overlay */}
              <div className="flex-1 min-h-[50%] relative overflow-hidden">
                {/* 🔒 Screen Share Gate Overlay */}
                {!isSharingScreen && (
                  <div className="absolute inset-0 bg-[#041a2a]/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mb-4 text-cyan-400 shadow-[0_0_30px_rgba(56,189,248,0.25)]">
                      <ScreenShare className="w-8 h-8 animate-pulse text-cyan-300" />
                    </div>
                    <h3 className="text-xl font-normal text-white mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                      Screen Sharing Required to Code
                    </h3>
                    <p className="text-xs text-cyan-100/70 max-w-md mb-6 leading-relaxed font-sans">
                      For assessment integrity and live mentor review, you must share your entire screen before you can edit or execute code in this interview room.
                    </p>
                    <button
                      onClick={toggleScreenShare}
                      className="flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#02101b] font-semibold px-6 py-3 rounded-2xl text-xs shadow-xl shadow-cyan-900/50 hover:shadow-cyan-400/30 transition-all cursor-pointer"
                    >
                      <ScreenShare className="w-4 h-4" />
                      <span>Share Screen to Unlock Editor</span>
                    </button>
                  </div>
                )}

                <Editor
                  height="100%"
                  language={language === "c" || language === "cpp" ? "cpp" : language}
                  value={editorCode}
                  onChange={handleEditorChange}
                  theme="vs-dark"
                  options={{
                    readOnly: !isSharingScreen,
                    minimap: { enabled: false },
                    fontSize: 13,
                    padding: { top: 14 },
                    automaticLayout: true,
                  }}
                />
              </div>

              {/* Bottom Custom Stdin & Output Preview */}
              <div className="h-[28%] min-h-[140px] bg-[#041523] border-t border-cyan-500/15 flex flex-col shrink-0">
                <div className="flex h-full">
                  {/* Custom Stdin */}
                  <div className="w-1/3 border-r border-cyan-500/15 flex flex-col">
                    <div className="text-[10px] font-medium text-cyan-400 uppercase tracking-widest p-2 border-b border-cyan-500/15 bg-[#031320] flex items-center justify-between">
                      <span>Custom Input</span>
                      <span className="text-zinc-500 font-mono text-[9px]">Optional</span>
                    </div>
                    <textarea
                      value={stdin}
                      onChange={(e) => setStdin(e.target.value)}
                      placeholder="Enter custom standard input..."
                      className="flex-1 bg-transparent p-2.5 text-xs font-mono text-zinc-300 outline-none resize-none placeholder:text-zinc-600 leading-relaxed"
                    />
                  </div>

                  {/* Stdout / Execution Preview */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="text-[10px] font-medium text-cyan-400 uppercase tracking-widest p-2 border-b border-cyan-500/15 bg-[#031320] flex justify-between items-center">
                      <span>Live Output Preview</span>
                      {executionResult && (
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded ${
                            executionResult.type === "tests"
                              ? executionResult.results?.every((r) => r.passed)
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-rose-500/20 text-rose-300"
                              : executionResult.statusCode === 200
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {executionResult.type === "tests"
                            ? `${executionResult.results?.filter((r) => r.passed).length}/${executionResult.results?.length} Passed`
                            : executionResult.statusCode === 200
                            ? "Success (200)"
                            : "Error"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-zinc-300">
                      {isExecuting ? (
                        <span className="text-cyan-400 flex items-center gap-1.5 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Executing code...
                        </span>
                      ) : executionResult ? (
                        executionResult.type === "tests" ? (
                          <div className="space-y-1.5 text-xs">
                            <p className="text-cyan-300 font-semibold">
                              Summary: {executionResult.results?.filter((r) => r.passed).length}/
                              {executionResult.results?.length} test cases passed.
                            </p>
                            <p className="text-zinc-400 text-[11px]">
                              Switch to the "Output & Tests" tab on the left for detailed input/output breakdown.
                            </p>
                          </div>
                        ) : executionResult.type === "error" ? (
                          <pre className="text-rose-400 whitespace-pre-wrap">{executionResult.error}</pre>
                        ) : (
                          <pre className="whitespace-pre-wrap">{executionResult.output || "(no output)"}</pre>
                        )
                      ) : (
                        <span className="text-zinc-500 italic">Click "Run Code" to view execution results.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. CANDIDATE RESUME MODAL / DRAWER (Interviewer) */}
      {isResumeOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-rise">
          <div className="bg-[#082235] border border-cyan-500/30 rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Modal Header */}
            <div className="h-14 bg-[#051726] border-b border-cyan-500/15 flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">
                  Candidate Profile & Resume • {candidateName}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {effectiveResumeUrl && (
                  <a
                    href={effectiveResumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 font-medium underline"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setIsResumeOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {effectiveResumeUrl ? (
                <div className="w-full h-full rounded-2xl overflow-hidden border border-cyan-500/20 bg-[#03111c]">
                  <iframe
                    src={effectiveResumeUrl}
                    title="Candidate Resume"
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-[#051726] border border-cyan-500/15">
                    <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-mono block mb-1">
                      Candidate Bio & Overview
                    </span>
                    <p className="text-sm text-cyan-100 font-medium">
                      {candidateName} ({meetingDetails?.candidate?.email || "Email provided upon request"})
                    </p>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      {meetingDetails?.candidate?.intro || "No custom biography submitted."}
                    </p>
                  </div>

                  {meetingDetails?.candidate?.skills && meetingDetails.candidate.skills.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#051726] border border-cyan-500/15">
                      <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-mono block mb-2">
                        Core Competencies & Skills
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {meetingDetails.candidate.skills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-xl text-xs font-mono"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-[#051726] border border-cyan-500/15">
                    <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-mono block mb-1">
                      Target Job Profile
                    </span>
                    <p className="text-xs font-mono text-cyan-300">{jobIdDisplay}</p>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed whitespace-pre-wrap">
                      {meetingDetails?.jobDescription || "Standard Technical Assessment Loop."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingRoom;
