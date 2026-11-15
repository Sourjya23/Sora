import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import Whiteboard from "../components/Whiteboard";
import API from "../api/axios";
import socket from "../socket/socket";

// Language configurations
const LANGUAGES = {
  javascript: { name: "JavaScript", defaultCode: "// Write your solution here...\nfunction solve() {\n  \n}" },
  python: { name: "Python", defaultCode: "def solve():\n    pass\n\nif __name__ == '__main__':\n    solve()" },
  java: { name: "Java", defaultCode: "public class Solution {\n    public static void main(String[] args) {\n        \n    }\n}" },
  c: { name: "C", defaultCode: "#include <stdio.h>\n\nint main() {\n    return 0;\n}" },
  cpp: { name: "C++", defaultCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}" }
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
  const [activeTool, setActiveTool] = useState("code"); // 'code', 'whiteboard', 'chat'
  
  // Chat States
  const [chatMessage, setChatMessage] = useState("");
  const [messages, setMessages] = useState([]);

  // Editor States
  const [language, setLanguage] = useState("python");
  const [editorCode, setEditorCode] = useState(LANGUAGES["python"].defaultCode);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [stdin, setStdin] = useState("");

  // Problem / Chat States
  const [problemStatement, setProblemStatement] = useState("");
  const [testCases, setTestCases] = useState([]);
  const [problemBank, setProblemBank] = useState([]);
  const [selectedProblemIndex, setSelectedProblemIndex] = useState("");
  const [isEditingProblem, setIsEditingProblem] = useState(false);
  const [leftTab, setLeftTab] = useState("problem"); // "problem" or "chat"
  const [activeTestCaseTab, setActiveTestCaseTab] = useState(0);

  // Recording State
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const recordedChunks = useRef([]);

  // Telemetry State
  const [telemetryEvents, setTelemetryEvents] = useState([]);

  // Screen Share State (Candidate)
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const screenStreamRef = useRef(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pipVideoRef = useRef(null); // Used for PIP after join

  const fetchMeetingMetadata = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      
      const res = await API.get(`/meeting/details/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
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
      setUser(JSON.parse(userStr));
    } else {
      navigate("/login");
    }
    fetchMeetingMetadata();
  }, [id, navigate]);

  // Telemetry Setup
  useEffect(() => {
    if (user?.role !== "candidate") return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newEvent = { type: "tab_change", timestamp: new Date().toISOString(), description: "Candidate switched tabs or minimized window." };
        setTelemetryEvents((prev) => [...prev, newEvent]);
        socket.emit("telemetry-update", { meetingId: id, event: newEvent });
      }
    };
    
    const handlePaste = (e) => {
      const newEvent = { type: "paste", timestamp: new Date().toISOString(), description: "Candidate pasted content into the document." };
      setTelemetryEvents((prev) => [...prev, newEvent]);
      socket.emit("telemetry-update", { meetingId: id, event: newEvent });
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("paste", handlePaste, true); // Use capture phase
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("paste", handlePaste, true);
    };
  }, [user, id]);

  // Fetch problem bank for interviewer
  useEffect(() => {
    if (user?.role === "interviewer") {
      const fetchProblemBank = async () => {
        try {
          const token = localStorage.getItem("token") || sessionStorage.getItem("token");
          const res = await API.get("/meeting/problem-bank", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProblemBank(res.data);
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
      testCases: problem.testCases || []
    });
  };

  // Setup sockets and room subscriptions
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

    const messageListener = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    const telemetryListener = (data) => {
      setTelemetryEvents((prev) => [...prev, data.event]);
    };

    const endListener = () => {
      alert("The interview has been ended by the interviewer.");
      navigate(user.role === "candidate" ? "/candidate-dashboard" : "/interviewer-dashboard");
    };

    socket.on("code-changed", codeListener);
    socket.on("language-changed", langListener);
    socket.on("problem-statement-changed", problemListener);
    socket.on("receive-message", messageListener);
    socket.on("telemetry-update", telemetryListener);
    socket.on("meeting-ended", endListener);

    return () => {
      socket.off("code-changed", codeListener);
      socket.off("language-changed", langListener);
      socket.off("problem-statement-changed", problemListener);
      socket.off("receive-message", messageListener);
      socket.off("telemetry-update", telemetryListener);
      socket.off("meeting-ended", endListener);
    };
  }, [isJoined, user, id, editorCode, language, problemStatement, navigate]);

  // Play camera preview on screen
  useEffect(() => {
    if (stream && localVideoRef.current && !isJoined) {
      localVideoRef.current.srcObject = stream;
    }
    if (stream && pipVideoRef.current && isJoined) {
      pipVideoRef.current.srcObject = stream;
    }
  }, [stream, isJoined]);

  // Play remote stream
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // WebRTC Setup
  useEffect(() => {
    if (!isJoined || !stream) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("webrtc-ice-candidate", { meetingId: id, candidate: event.candidate });
      }
    };

    setPeerConnection(pc);

    // If interviewer, create offer after a small delay to ensure candidate is ready
    if (user?.role === "interviewer") {
      setTimeout(async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("webrtc-offer", { meetingId: id, offer });
      }, 2000);
    }

    const offerListener = async (offer) => {
      if (pc.signalingState !== "stable") return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc-answer", { meetingId: id, answer });
    };

    const answerListener = async (answer) => {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
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
      socket.off("webrtc-offer", offerListener);
      socket.off("webrtc-answer", answerListener);
      socket.off("webrtc-ice-candidate", iceListener);
      pc.close();
    };
  }, [isJoined, stream, id, user]);

  const toggleScreenShare = async () => {
    if (!isSharingScreen) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = displayStream;
        
        const videoTrack = displayStream.getVideoTracks()[0];
        if (peerConnection) {
          const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        }
        
        setIsSharingScreen(true);
        
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
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    if (peerConnection && stream) {
      const cameraTrack = stream.getVideoTracks()[0];
      const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === "video");
      if (sender && cameraTrack) {
        sender.replaceTrack(cameraTrack);
      }
    }
    setIsSharingScreen(false);
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setVerifyingPassword(true);
    setPasswordError("");

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await API.post(`/meeting/verify-password/${id}`, { password }, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      alert("You must grant camera and microphone permissions to enter the lobby.");
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

  const startScreenRecording = async () => {
    try {
      if (!remoteVideoRef.current || !remoteVideoRef.current.srcObject) {
        console.warn("No remote stream available yet, retrying in 2 seconds...");
        setTimeout(startScreenRecording, 2000);
        return;
      }

      const remoteStream = remoteVideoRef.current.srcObject;
      const audioContext = new AudioContext();
      const dest = audioContext.createMediaStreamDestination();

      // Add interviewer's mic audio
      if (stream && stream.getAudioTracks().length > 0) {
        const micSource = audioContext.createMediaStreamSource(stream);
        micSource.connect(dest);
      }

      // Add candidate's audio (from remote stream)
      if (remoteStream.getAudioTracks().length > 0) {
        const remoteAudioSource = audioContext.createMediaStreamSource(remoteStream);
        remoteAudioSource.connect(dest);
      }

      const tracks = [];
      if (remoteStream.getVideoTracks().length > 0) {
        tracks.push(remoteStream.getVideoTracks()[0]);
      }
      if (dest.stream.getAudioTracks().length > 0) {
        tracks.push(dest.stream.getAudioTracks()[0]);
      }

      if (tracks.length === 0) {
        console.error("No tracks available to record.");
        return;
      }

      const finalStream = new MediaStream(tracks);


      const recorder = new MediaRecorder(finalStream, { mimeType: "video/webm" });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      recorder.start(1000); // chunk every second
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Stop recording automatically after 10 minutes (600,000 ms)
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 600000);

    } catch (err) {
      console.error("Screen recording failed", err);
    }
  };

  const stopRecordingAndUpload = async () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setUploadingRecording(true);

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks.current, { type: "video/webm" });
        const file = new File([blob], `interview-${id}.webm`, { type: "video/webm" });
        
        const formData = new FormData();
        formData.append("recording", file);
        formData.append("finalCode", editorCode);
        formData.append("problemStatement", problemStatement);
        formData.append("telemetryEvents", JSON.stringify(telemetryEvents));

        try {
          const token = localStorage.getItem("token");
          await API.post(`/meeting/upload-recording/${id}`, formData, {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data" 
            }
          });
          alert("Recording uploaded successfully");
        } catch (err) {
          console.error("Failed to upload recording", err);
          alert("Failed to upload recording");
        } finally {
          setUploadingRecording(false);
          socket.emit("end-meeting", { meetingId: id });
          navigate("/interviewer-dashboard");
        }
      };
    } else {
      socket.emit("end-meeting", { meetingId: id });
      navigate("/interviewer-dashboard");
    }
  };

  const joinMeeting = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await API.post(`/meeting/join/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (user?.role === "candidate") {
        socket.emit("candidate-joined", {
          meetingId: id,
          candidateName: user.name
        });
      }

      setIsJoined(true);

      if (user?.role === "interviewer") {
        startScreenRecording();
      }
    } catch (err) {
      console.error("Failed to register join on backend", err);
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      socket.emit("send-message", {
        meetingId: id,
        sender: user?.name || "Anonymous",
        text: chatMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setMessages((prev) => [...prev, {
        sender: "You",
        text: chatMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setChatMessage("");
    }
  };

  const runCode = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      if (testCases && testCases.length > 0) {
        setActiveTestCaseTab(0); // Reset tab when running tests
        // Run against testcases
        const res = await API.post(
          "/code/execute-tests",
          { language: language === "c" || language === "cpp" ? language : language, code: editorCode, testCases },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setExecutionResult({ type: "tests", results: res.data.results });
      } else {
        // Run with custom stdin
        const res = await API.post(
          "/code/execute",
          { language: language === "c" || language === "cpp" ? language : language, code: editorCode, stdin },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setExecutionResult({ type: "single", ...res.data });
      }
    } catch (err) {
      console.error("Execution failed", err);
      setExecutionResult({ type: "error", error: err.response?.data?.message || err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const endMeeting = () => {
    if (confirm("Are you sure you want to end the meeting for everyone?")) {
      if (user?.role === "interviewer" && isRecording) {
        stopRecordingAndUpload();
      } else {
        socket.emit("end-meeting", { meetingId: id });
        navigate(user?.role === "candidate" ? "/candidate-dashboard" : "/interviewer-dashboard");
      }
    }
  };

  if (loadingDetails) {
    return (
      <div className="h-screen bg-[#041826] flex items-center justify-center text-white text-xs font-sans">
        Loading session...
      </div>
    );
  }

  // STEP 1: Enter Key Password
  if (!passwordVerified) {
    return (
      <div className="min-h-screen bg-[#041826] flex flex-col items-center justify-center text-white p-4 font-sans">
        <div className="bg-[#041a2a] border border-white/10 p-8 rounded-2xl max-w-sm w-full shadow-2xl">
          <h2 className="text-xl font-normal mb-1 text-center text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Interview Room Access
          </h2>
          <p className="text-zinc-400 text-xs text-center mb-6">
            {meetingDetails 
              ? `Session with ${user?.role === "candidate" ? (meetingDetails.interviewer?.name || "Mentor") : (meetingDetails.candidate?.name || "Candidate")}` 
              : "Enter your entry password key to unlock this room."}
          </p>

          {passwordError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider text-center">Password Key</label>
              <input 
                type="text" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value.toUpperCase())}
                placeholder="PASS-XXXX"
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl py-2.5 px-4 text-sm text-center text-white outline-none focus:border-white/40 font-mono tracking-widest font-bold uppercase transition-colors"
              />
            </div>
            <button 
              type="submit"
              disabled={verifyingPassword}
              className="w-full bg-white hover:bg-zinc-200 text-[#041826] font-medium py-2.5 px-4 rounded-xl text-xs transition-all disabled:opacity-40"
            >
              {verifyingPassword ? "Verifying..." : "Enter Room"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // STEP 2: Pre-join Lobby
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-[#041826] flex items-center justify-center p-6 font-sans text-white">
        <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-medium mb-3 self-start text-white">Media Check</h2>
            <div className="w-full aspect-video bg-[#031320] rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl flex items-center justify-center">
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
                    <div className="text-zinc-500 text-xs text-center">
                      Camera turned off
                    </div>
                  )}
                </>
              ) : (
                <div className="text-zinc-500 text-xs p-4 text-center">
                  Enable camera and microphone permissions to proceed.
                </div>
              )}

              {hasGrantedPermissions && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                  <button onClick={toggleMic} className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${micActive ? "bg-white/[0.08] border-white/20 text-white" : "bg-rose-500/20 border-rose-500/30 text-rose-300"}`}>
                    {micActive ? "Mute" : "Unmute"}
                  </button>
                  <button onClick={toggleCamera} className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${cameraActive ? "bg-white/[0.08] border-white/20 text-white" : "bg-rose-500/20 border-rose-500/30 text-rose-300"}`}>
                    {cameraActive ? "Cam Off" : "Cam On"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#041a2a] border border-white/10 p-8 rounded-2xl shadow-2xl flex flex-col justify-between min-h-[260px]">
            <div>
              <span className="text-[11px] text-zinc-400 font-mono">Room Unlocked</span>
              <h1 className="text-2xl font-normal tracking-tight text-white mt-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                Ready to Join?
              </h1>
              <p className="text-xs text-zinc-400 mt-1">Make sure your camera and microphone are working smoothly before entering.</p>
            </div>
            <div className="mt-6">
              {!hasGrantedPermissions ? (
                <button onClick={requestPermissions} className="w-full bg-white hover:bg-zinc-200 text-[#041826] font-medium py-3 px-4 rounded-xl text-xs transition-all">
                  Enable Camera & Mic
                </button>
              ) : (
                <button onClick={joinMeeting} className="w-full bg-white hover:bg-zinc-200 text-[#041826] font-medium py-3 px-4 rounded-xl text-xs transition-all">
                  Enter Meeting Room
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: Active meeting view (Split Screen)
  const renderTabsBlock = () => (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex bg-[#031320] border-y border-white/10">
        <button 
          onClick={() => setLeftTab("problem")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            leftTab === "problem" ? "text-white border-b-2 border-white bg-white/[0.03]" : "text-zinc-400 hover:text-white"
          }`}
        >
          Problem Statement
        </button>
        <button 
          onClick={() => setLeftTab("chat")}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            leftTab === "chat" ? "text-white border-b-2 border-white bg-white/[0.03]" : "text-zinc-400 hover:text-white"
          }`}
        >
          Chat
        </button>
      </div>

      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {leftTab === "problem" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-mono">Overview</span>
              {user?.role === "interviewer" && (
                <div className="flex items-center gap-2">
                  <select 
                    value={selectedProblemIndex} 
                    onChange={handleProblemSelect}
                    className="bg-[#041826] border border-white/10 text-xs text-zinc-300 rounded-lg px-2.5 py-1 outline-none"
                  >
                    <option value="">Select a Problem...</option>
                    {problemBank.map((p, i) => (
                      <option key={i} value={i}>{p.title} ({p.difficulty})</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => setIsEditingProblem(!isEditingProblem)}
                    className="text-xs text-zinc-300 hover:text-white underline font-medium"
                  >
                    {isEditingProblem ? "Save" : "Edit"}
                  </button>
                </div>
              )}
            </div>
            
            {isEditingProblem ? (
              <textarea 
                className="w-full h-full bg-[#041826] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-white/40 font-mono resize-none"
                value={problemStatement}
                onChange={handleProblemChange}
                placeholder="Type or paste problem statement..."
              />
            ) : (
              <div className="w-full h-full bg-white/[0.02] border border-white/10 rounded-xl p-4 text-xs text-zinc-300 whitespace-pre-wrap overflow-y-auto leading-relaxed">
                {problemStatement || "No problem statement selected yet."}
              </div>
            )}
          </div>
        )}

        {leftTab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-white/[0.01] rounded-xl border border-white/10">
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-xs text-zinc-500 italic mt-6">No messages yet.</div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"}`}>
                    <span className="text-[10px] text-zinc-500 mb-0.5">{msg.sender} • {msg.time}</span>
                    <div className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] break-words ${
                      msg.sender === "You" ? "bg-white text-[#041826] font-medium" : "bg-white/[0.05] border border-white/10 text-zinc-300"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="p-2 border-t border-white/10 bg-[#031320] flex items-center gap-2 shrink-0">
              <input 
                type="text" 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Message..."
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white/40 placeholder:text-zinc-500"
              />
              <button type="submit" disabled={!chatMessage.trim()} className="bg-white hover:bg-zinc-200 text-[#041826] px-3.5 py-1.5 rounded-xl text-xs font-medium disabled:opacity-40">
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#041826] flex flex-col relative overflow-hidden font-sans text-white">
      {/* HEADER SECTION */}
      <header className="h-14 border-b border-white/10 bg-[#041826]/90 backdrop-blur-md flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <span className="font-normal text-white text-xl tracking-tight" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
            Sora Session
          </span>
          <span className="text-[11px] font-mono bg-white/[0.04] border border-white/10 text-zinc-400 px-2 py-0.5 rounded">
            {meetingDetails?.jobId || id}
          </span>
          {isRecording && <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded uppercase animate-pulse">● Recording</span>}
          {uploadingRecording && <span className="text-[10px] text-amber-300 font-mono">Uploading Recording...</span>}
        </div>

        <div className="flex items-center gap-2">
          {user?.role === "interviewer" && (
            <button 
              onClick={endMeeting}
              disabled={uploadingRecording}
              className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3.5 py-1.5 rounded-xl font-medium transition-all disabled:opacity-50"
            >
              End Session
            </button>
          )}
          {user?.role === "candidate" && (
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleScreenShare}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all border ${
                  isSharingScreen 
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/30" 
                    : "bg-white/[0.06] hover:bg-white/10 text-white border-white/10"
                }`}
              >
                {isSharingScreen ? "Stop Screen Share" : "Share Screen"}
              </button>
              <button 
                onClick={() => {
                  if (confirm("Leave this interview room?")) navigate("/candidate-dashboard");
                }}
                className="text-xs bg-white/[0.06] hover:bg-white/10 text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-xl transition-all border border-white/10"
              >
                Leave
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN VIEW: Split Pane */}
      <div className={`flex-1 flex overflow-hidden relative ${user?.role === "interviewer" ? "bg-[#031320]" : ""}`}>
        {/* FIRST PANEL: Video + Sidebar */}
        <div className={`${user?.role === "interviewer" ? "flex-1 flex flex-col items-center justify-center p-6 border-r border-white/10" : "w-1/3 min-w-[320px] border-r border-white/10 flex flex-col bg-[#031320]"}`}>
          {/* Remote Video */}
          <div className={`${user?.role === "interviewer" ? "w-full max-w-5xl aspect-video bg-black relative border border-white/10 rounded-2xl overflow-hidden shadow-2xl shrink-0" : "aspect-video bg-black relative border-b border-white/10 shrink-0"}`}>
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs">
                Waiting for remote participant...
              </div>
            )}
            
            {/* Self View PIP */}
            <div className="absolute bottom-3 right-3 w-1/4 aspect-video bg-black rounded-xl border border-white/20 shadow-xl overflow-hidden z-10">
              <video 
                ref={pipVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Media Controls Dock */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-2xl z-20">
              <button 
                onClick={toggleMic} 
                className={`p-2 rounded-lg text-xs transition-all border ${micActive ? "bg-white/[0.08] border-white/20 text-white" : "bg-rose-500/20 border-rose-500/30 text-rose-300"}`}
                title={micActive ? "Mute" : "Unmute"}
              >
                {micActive ? "Mic On" : "Mic Muted"}
              </button>
              <button 
                onClick={toggleCamera} 
                className={`p-2 rounded-lg text-xs transition-all border ${cameraActive ? "bg-white/[0.08] border-white/20 text-white" : "bg-rose-500/20 border-rose-500/30 text-rose-300"}`}
                title={cameraActive ? "Cam Off" : "Cam On"}
              >
                {cameraActive ? "Cam On" : "Cam Off"}
              </button>
            </div>
          </div>

          {/* Candidate Tabs: Under video */}
          {user?.role === "candidate" && renderTabsBlock()}
        </div>

        {/* Interviewer Tabs Panel */}
        {user?.role === "interviewer" && (
          <div className="w-[420px] shrink-0 bg-[#031320] flex flex-col shadow-2xl z-10 relative">
            {renderTabsBlock()}
          </div>
        )}

        {/* Code Editor (Candidate View) */}
        {user?.role === "candidate" && (
          <div className="flex-1 flex flex-col bg-[#020d17]">
            {/* Editor Header */}
            <div className="h-12 bg-white/[0.01] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-3">
                <select 
                  value={language}
                  onChange={handleLanguageChange}
                  className="bg-[#041826] border border-white/10 text-zinc-300 text-xs rounded-lg px-2.5 py-1 outline-none"
                >
                  {Object.keys(LANGUAGES).map(key => (
                    <option key={key} value={key}>{LANGUAGES[key].name}</option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={runCode}
                disabled={isExecuting}
                className="bg-white hover:bg-zinc-200 text-[#041826] px-4 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
              >
                {isExecuting ? "Executing..." : "Run Code"}
              </button>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-[50%]">
              <Editor
                height="100%"
                language={language === "c" || language === "cpp" ? "cpp" : language}
                value={editorCode}
                onChange={handleEditorChange}
                theme="vs-dark"
                options={{ 
                  minimap: { enabled: false }, 
                  fontSize: 13, 
                  padding: { top: 14 },
                  automaticLayout: true 
                }}
              />
            </div>

            {/* Output & Stdin Drawer */}
            <div className="h-[28%] min-h-[140px] bg-[#031320] border-t border-white/10 flex flex-col shrink-0">
              <div className="flex h-full">
                {/* Stdin */}
                <div className="w-1/3 border-r border-white/10 flex flex-col">
                  <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider p-2 border-b border-white/10 bg-white/[0.01]">
                    Custom Input
                  </div>
                  <textarea 
                    value={stdin}
                    onChange={(e) => setStdin(e.target.value)}
                    placeholder="Enter custom input..."
                    className="flex-1 bg-transparent p-2 text-xs font-mono text-zinc-300 outline-none resize-none placeholder:text-zinc-600"
                  />
                </div>
                
                {/* Stdout */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider p-2 border-b border-white/10 bg-white/[0.01] flex justify-between">
                    <span>Output</span>
                    {executionResult && executionResult.type === "single" && (
                      <span className={executionResult.statusCode === 200 ? "text-emerald-400" : "text-rose-400"}>
                        {executionResult.statusCode === 200 ? "Success" : "Error"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 overflow-y-auto p-2.5 font-mono text-xs text-zinc-300">
                    {executionResult ? (
                      executionResult.type === "tests" ? (
                        <div className="space-y-2">
                          <div className="flex gap-1.5 border-b border-white/10 pb-2">
                            {executionResult.results.map((tr, idx) => (
                              <button
                                key={idx}
                                onClick={() => setActiveTestCaseTab(idx)}
                                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                                  activeTestCaseTab === idx ? "bg-white text-[#041826] font-medium" : "text-zinc-400 hover:text-white"
                                }`}
                              >
                                Case {tr.testCaseNumber} {tr.passed ? '✓' : '✕'}
                              </button>
                            ))}
                          </div>
                          {executionResult.results[activeTestCaseTab] && (
                            <div className="text-xs space-y-1">
                              <p className="text-zinc-400">Input: <span className="text-zinc-200">{executionResult.results[activeTestCaseTab].input || "(empty)"}</span></p>
                              <p className="text-zinc-400">Expected: <span className="text-emerald-400">{executionResult.results[activeTestCaseTab].expectedOutput}</span></p>
                              <p className="text-zinc-400">Actual: <span className={executionResult.results[activeTestCaseTab].passed ? "text-emerald-400" : "text-rose-400"}>{executionResult.results[activeTestCaseTab].actualOutput}</span></p>
                            </div>
                          )}
                        </div>
                      ) : executionResult.type === "error" ? (
                        <pre className="text-rose-400 whitespace-pre-wrap">{executionResult.error}</pre>
                      ) : (
                        <pre className="whitespace-pre-wrap">{executionResult.output || "(no output)"}</pre>
                      )
                    ) : (
                      <span className="text-zinc-600 italic">Run code to see execution output.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MeetingRoom;
