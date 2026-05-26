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

    const endListener = () => {
      alert("The interview has been ended by the interviewer.");
      navigate(user.role === "candidate" ? "/candidate-dashboard" : "/interviewer-dashboard");
    };

    socket.on("code-changed", codeListener);
    socket.on("language-changed", langListener);
    socket.on("problem-statement-changed", problemListener);
    socket.on("receive-message", messageListener);
    socket.on("meeting-ended", endListener);

    return () => {
      socket.off("code-changed", codeListener);
      socket.off("language-changed", langListener);
      socket.off("problem-statement-changed", problemListener);
      socket.off("receive-message", messageListener);
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

  if (loadingDetails) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white font-sans">Loading meeting details...</div>;

  // STEP 1: Enter Key Password
  if (!passwordVerified) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-white p-4 font-sans">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl">
          <div className="w-16 h-16 bg-violet-600/10 border border-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold mb-1 text-center">Secure Entry Gate</h2>
          <p className="text-slate-400 text-xs text-center mb-6">
            {meetingDetails ? `Assessment scheduled with ${user?.role === "candidate" ? meetingDetails.interviewer?.name : meetingDetails.candidate?.name}` : "Please enter the password key to enter this assessment room."}
          </p>

          {passwordError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Key Password</label>
              <input 
                type="text" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value.toUpperCase())}
                placeholder="PASS-XXXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-center text-white outline-none focus:border-violet-500 font-mono tracking-widest font-bold uppercase transition-colors"
              />
            </div>
            <button 
              type="submit"
              disabled={verifyingPassword}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50"
            >
              {verifyingPassword ? "Verifying key..." : "Unlock Room"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // STEP 2: Pre-join Lobby
  if (!isJoined) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6 font-sans text-white">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 self-start">Camera & Mic Check</h2>
            <div className="w-full aspect-video bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl flex items-center justify-center">
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
                    <div className="text-slate-500 text-sm text-center">
                      Camera is turned off
                    </div>
                  )}
                </>
              ) : (
                <div className="text-slate-500 text-sm p-4 text-center">
                  Please grant media permissions.
                </div>
              )}

              {hasGrantedPermissions && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                  <button onClick={toggleMic} className={`p-2.5 rounded-lg border transition-all ${micActive ? "bg-white/5 backdrop-blur-lg/10 border-white/20 text-white" : "bg-rose-500/20 border-rose-500/30 text-rose-400"}`}>
                    {micActive ? "Mute" : "Unmute"}
                  </button>
                  <button onClick={toggleCamera} className={`p-2.5 rounded-lg border transition-all ${cameraActive ? "bg-white/5 backdrop-blur-lg/10 border-white/20 text-white" : "bg-rose-500/20 border-rose-500/30 text-rose-400"}`}>
                    {cameraActive ? "Cam Off" : "Cam On"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col justify-between min-h-[300px]">
            <div>
              <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 px-3 py-1 rounded-full font-bold">Room Unlocked</span>
              <h1 className="text-3xl font-extrabold tracking-tight text-white mt-4">Ready to join?</h1>
            </div>
            <div className="mt-8 space-y-3">
              {!hasGrantedPermissions ? (
                <button onClick={requestPermissions} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 px-4 rounded-xl text-sm">
                  Enable Camera & Mic
                </button>
              ) : (
                <button onClick={joinMeeting} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 px-4 rounded-xl text-sm">
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
      <div className="flex bg-slate-900 border-y border-slate-800">
        <button 
          onClick={() => setLeftTab("problem")}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${leftTab === "problem" ? "bg-violet-600/10 text-violet-400 border-b-2 border-violet-500" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"}`}
        >
          Problem Statement
        </button>
        <button 
          onClick={() => setLeftTab("chat")}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${leftTab === "chat" ? "bg-violet-600/10 text-violet-400 border-b-2 border-violet-500" : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"}`}
        >
          Chat
        </button>
      </div>

      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {leftTab === "problem" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Question Info</span>
              {user?.role === "interviewer" && (
                <div className="flex gap-2">
                  <select 
                    value={selectedProblemIndex} 
                    onChange={handleProblemSelect}
                    className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded px-2 py-1 outline-none"
                  >
                    <option value="">Select a Problem...</option>
                    {problemBank.map((p, i) => (
                      <option key={i} value={i}>{p.title} ({p.difficulty})</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => setIsEditingProblem(!isEditingProblem)}
                    className="text-xs text-violet-400 hover:text-violet-300"
                  >
                    {isEditingProblem ? "Save" : "Edit"}
                  </button>
                </div>
              )}
            </div>
            
            {isEditingProblem ? (
              <textarea 
                className="w-full h-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-violet-500 font-mono resize-none"
                value={problemStatement}
                onChange={handleProblemChange}
                placeholder="Type or paste the problem statement here..."
              />
            ) : (
              <div className="w-full h-full bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap overflow-y-auto font-sans">
                {problemStatement || "No problem statement provided."}
              </div>
            )}
          </div>
        )}

        {leftTab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/30 rounded-xl border border-slate-800 relative">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-xs text-slate-500 italic mt-4">No messages yet. Say hello!</div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.sender === "You" ? "items-end" : "items-start"}`}>
                    <span className="text-[9px] text-slate-500 mb-0.5">{msg.sender} • {msg.time}</span>
                    <div className={`px-3 py-1.5 rounded-lg text-sm max-w-[85%] break-words ${msg.sender === "You" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-200"}`}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-800 bg-slate-900 flex items-center gap-2 shrink-0">
              <input 
                type="text" 
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-violet-500"
              />
              <button type="submit" disabled={!chatMessage.trim()} className="bg-violet-600 text-white px-3 py-1.5 rounded text-sm font-bold disabled:opacity-50">
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-slate-950 flex flex-col relative overflow-hidden font-sans text-slate-200">
      
      {/* HEADER SECTION */}
      <header className="h-14 border-b border-slate-900 bg-slate-950 flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-white text-sm">Evaluation Room</span>
          <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">
            {meetingDetails?.jobId || "Assessment"}
          </span>
          {isRecording && <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded uppercase animate-pulse">● Recording</span>}
          {uploadingRecording && <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded uppercase">Uploading Recording...</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Media controls moved to bottom dock */}

          {user?.role === "interviewer" && (
            <button 
              onClick={endMeeting}
              disabled={uploadingRecording}
              className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded-lg font-bold transition-all disabled:opacity-50"
            >
              End Meeting for All
            </button>
          )}
          {user?.role === "candidate" && (
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleScreenShare}
                className={`text-xs px-4 py-1.5 rounded-lg font-bold transition-all ${isSharingScreen ? "bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20" : "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20"}`}
              >
                {isSharingScreen ? "Stop Sharing Screen" : "Share Screen"}
              </button>
              <button 
                onClick={() => {
                  if(confirm("Leave the interview?")) navigate("/candidate-dashboard");
                }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg font-bold transition-all"
              >
                Leave
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN VIEW: Split Pane */}
      <div className={`flex-1 flex overflow-hidden relative ${user?.role === "interviewer" ? "bg-slate-950" : ""}`}>
        
        {/* === FIRST PANEL === */}
        <div className={`${user?.role === "interviewer" ? "flex-1 flex flex-col items-center justify-center p-6 border-r border-slate-900" : "w-1/3 min-w-[300px] border-r border-slate-900 flex flex-col bg-slate-950"}`}>
          
          {/* Remote Video */}
          <div className={`${user?.role === "interviewer" ? "w-full max-w-6xl aspect-video bg-black relative border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shrink-0" : "aspect-video bg-black relative border-b border-slate-900 shrink-0"}`}>
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                Waiting for other participant...
              </div>
            )}
            
            {/* Self View PIP */}
            <div className="absolute bottom-4 right-4 w-1/4 aspect-video bg-black rounded-lg border border-slate-700 shadow-xl overflow-hidden z-10">
              <video 
                ref={pipVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* GMeet Style Media Dock */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-2xl z-20">
              <button 
                onClick={toggleMic} 
                className={`p-3 rounded-full transition-all flex items-center justify-center ${micActive ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20"}`}
                title={micActive ? "Mute Mic" : "Unmute Mic"}
              >
                {micActive ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                )}
              </button>
              <button 
                onClick={toggleCamera} 
                className={`p-3 rounded-full transition-all flex items-center justify-center ${cameraActive ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20"}`}
                title={cameraActive ? "Turn Off Camera" : "Turn On Camera"}
              >
                {cameraActive ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Candidate Tabs: Placed under the video */}
          {user?.role === "candidate" && renderTabsBlock()}
        </div>

        {/* === SECOND PANEL === */}
        {user?.role === "interviewer" && (
          <div className="w-[450px] shrink-0 bg-[#0f121b] flex flex-col shadow-2xl z-10 relative">
            {renderTabsBlock()}
          </div>
        )}

        {/* Right Side: Code Editor & Output (HIDDEN FOR INTERVIEWER) */}
        {user?.role === "candidate" && (
          <div className="flex-1 flex flex-col bg-[#1e1e1e]">
          
          {/* Editor Header */}
          <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <select 
                value={language}
                onChange={handleLanguageChange}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded px-2 py-1 outline-none"
              >
                {Object.keys(LANGUAGES).map(key => (
                  <option key={key} value={key}>{LANGUAGES[key].name}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={runCode}
              disabled={isExecuting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Running...
                </>
              ) : "▶ Run Code"}
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
                fontSize: 14, 
                padding: { top: 16 },
                automaticLayout: true 
              }}
            />
          </div>

          {/* Output / Stdin Panel */}
          <div className="h-[30%] min-h-[150px] bg-slate-950 border-t border-slate-800 flex flex-col shrink-0">
            <div className="flex h-full">
              {/* Stdin */}
              <div className="w-1/3 border-r border-slate-800 flex flex-col">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider p-2 border-b border-slate-800 bg-slate-900">Custom Input</div>
                <textarea 
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter custom input here..."
                  className="flex-1 bg-transparent p-2 text-xs font-mono text-slate-300 outline-none resize-none"
                />
              </div>
              
              {/* Stdout / Stderr */}
              <div className="flex-1 flex flex-col">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider p-2 border-b border-slate-800 bg-slate-900 flex justify-between">
                  <span>Execution Output</span>
                  {executionResult && executionResult.type === "single" && (
                    <span className={executionResult.statusCode === 200 ? "text-emerald-400" : "text-rose-400"}>
                      {executionResult.statusCode === 200 ? "Success" : "Error"}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden bg-[#0d0d0d] flex flex-col">
                  {executionResult ? (
                    executionResult.type === "tests" ? (
                      <div className="flex flex-col h-full overflow-hidden">
                        <div className="flex border-b border-slate-800 bg-slate-900/50 shrink-0 overflow-x-auto scrollbar-hide">
                          {executionResult.results.map((tr, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveTestCaseTab(idx)}
                              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTestCaseTab === idx ? 'border-violet-500 text-violet-400 bg-violet-500/10' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                            >
                              Case {tr.testCaseNumber}
                              {tr.passed ? '✅' : '❌'}
                            </button>
                          ))}
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                          {executionResult.results[activeTestCaseTab] && (
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${executionResult.results[activeTestCaseTab].passed ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                  {executionResult.results[activeTestCaseTab].passed ? 'Accepted' : 'Wrong Answer'}
                                </span>
                              </div>
                              <div className="flex flex-col gap-3 text-xs font-mono">
                                <div>
                                  <div className="text-slate-500 mb-1.5 font-sans font-semibold">Input:</div>
                                  <pre className="bg-slate-950/80 p-3 rounded-lg text-slate-300 border border-slate-800/50 whitespace-pre-wrap">{executionResult.results[activeTestCaseTab].input || " "}</pre>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="flex flex-col">
                                    <div className="text-slate-500 mb-1.5 font-sans font-semibold">Expected Output:</div>
                                    <pre className="flex-1 bg-slate-950/80 p-3 rounded-lg text-emerald-400/80 border border-emerald-900/30 whitespace-pre-wrap">{executionResult.results[activeTestCaseTab].expectedOutput || " "}</pre>
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="text-slate-500 mb-1.5 font-sans font-semibold">Actual Output:</div>
                                    <pre className={`flex-1 bg-slate-950/80 p-3 rounded-lg border whitespace-pre-wrap ${executionResult.results[activeTestCaseTab].passed ? 'text-emerald-400/80 border-emerald-900/30' : 'text-rose-400/80 border-rose-900/30'}`}>{executionResult.results[activeTestCaseTab].actualOutput || " "}</pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : executionResult.type === "error" ? (
                      <pre className="p-3 text-sm font-mono whitespace-pre-wrap text-rose-400 overflow-y-auto">
                        {executionResult.error}
                      </pre>
                    ) : (
                      <pre className={`p-3 text-sm font-mono whitespace-pre-wrap overflow-y-auto ${executionResult.statusCode !== 200 ? 'text-rose-400' : 'text-slate-300'}`}>
                        {executionResult.output}
                      </pre>
                    )
                  ) : (
                    <div className="text-slate-600 text-xs italic p-3">Output will appear here after execution...</div>
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
