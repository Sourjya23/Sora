import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { toast } from "../components/ui/Toast";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  ScreenShare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Wifi,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Lock,
} from "lucide-react";

export default function InterviewReadiness() {
  const { id } = useParams(); // meetingId
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);

  // Readiness States
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [micAllowed, setMicAllowed] = useState(false);
  const [micVolume, setMicVolume] = useState(0);
  const [screenShareTested, setScreenShareTested] = useState(false);
  const [networkPingMs, setNetworkPingMs] = useState(null);
  const [browserOk, setBrowserOk] = useState(true);

  // Password & Verification
  const [password, setPassword] = useState("");
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const videoPreviewRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // 1. Load user & meeting details
  useEffect(() => {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        navigate(`/login?redirect=${encodeURIComponent(`/readiness/${id}`)}`);
        return;
      }
    } else {
      navigate(`/login?redirect=${encodeURIComponent(`/readiness/${id}`)}`);
      return;
    }

    const fetchDetails = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const startPing = performance.now();
        const res = await API.get(`/meeting/details/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const latency = Math.round(performance.now() - startPing);
        setNetworkPingMs(latency);
        setMeeting(res.data);
      } catch (err) {
        console.error("Failed to fetch meeting", err);
        setPasswordError("Failed to find or verify meeting session.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();

    // Check browser compatibility
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasDisplay = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
    const hasWebRTC = !!window.RTCPeerConnection;
    setBrowserOk(hasMedia && hasDisplay && hasWebRTC);
  }, [id, navigate]);

  // 2. Request Camera & Mic
  const requestMediaPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      streamRef.current = mediaStream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
      }
      setCameraAllowed(true);
      setMicAllowed(true);
      toast.success("Media Permissions Granted", "Camera and microphone streams verified.");

      // Setup audio level meter
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const micSource = audioCtx.createMediaStreamSource(mediaStream);
        micSource.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateMeter = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();
      } catch (aErr) {
        console.warn("Audio meter init error:", aErr);
      }
    } catch (err) {
      console.error("Media permission error:", err);
      setCameraAllowed(false);
      setMicAllowed(false);
      toast.error("Permission Denied", "Camera and microphone access are required.");
    }
  };

  // 3. Test Screen Sharing
  const testScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });
      // Test passed immediately
      setScreenShareTested(true);
      toast.success("Screen Sharing Verified", "You are ready to write code during the assessment.");
      // Cleanly stop the test screen tracks
      screenStream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.warn("Screen share test cancelled or failed", err);
      setScreenShareTested(false);
      toast.warning("Screen Share Test Cancelled", "Screen sharing will be required to write code.");
    }
  };

  // 4. Verify password
  const verifyPassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await API.post(
        `/meeting/verify-password/${id}`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordVerified(true);
      toast.success("Passcode Verified", "Session credentials authenticated.");
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid meeting key password.";
      setPasswordError(msg);
      toast.error("Invalid Passcode", msg);
    }
  };

  // 5. Submit readiness and proceed to meeting room
  const handleProceedToMeeting = async () => {
    setSubmitting(true);
    toast.info("Connecting to Room", "Entering secure interview session...");
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await API.post(
        `/meeting/readiness/${id}`,
        {
          cameraVerified: cameraAllowed,
          micVerified: micAllowed,
          screenShareVerified: screenShareTested,
          networkLatencyMs: networkPingMs || 40,
          browserChecked: browserOk,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Clean up local preview stream before transitioning
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();

      navigate(`/meeting/${id}`);
    } catch (err) {
      console.error("Failed to submit readiness", err);
      // Even if endpoint has network hiccup, allow entering meeting
      navigate(`/meeting/${id}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const allChecksReady = cameraAllowed && micAllowed && screenShareTested && passwordVerified && browserOk;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#062438] via-[#041a2a] to-[#02101b] flex flex-col items-center justify-center text-white font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mb-4" />
        <p className="text-sm text-cyan-200">Preparing Pre-Interview Readiness Gate...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#062438] via-[#041a2a] to-[#02101b] text-white font-sans flex flex-col relative overflow-hidden select-none">
      {/* Ambient Top Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan-500/10 rounded-full blur-[130px]"
      />

      {/* Top Header */}
      <header className="h-16 border-b border-cyan-500/15 bg-[#051726]/85 backdrop-blur-xl flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/Sora_Favicon.jpg"
            alt="Sora"
            className="w-8 h-8 rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.4)] border border-cyan-400/40 object-cover"
          />
          <span
            className="font-normal text-white text-xl tracking-tight"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Sora
          </span>
          <div className="h-4 w-px bg-cyan-500/20" />
          <span className="text-xs font-mono text-cyan-300">Pre-Interview System Verification</span>
        </div>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-zinc-300">Secure Protocol v2.4</span>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 flex flex-col lg:flex-row gap-8 items-start justify-center relative z-10">
        {/* Left Column: Live Video & Audio Preview */}
        <div className="w-full lg:w-1/2 flex flex-col gap-5">
          <div className="bg-[#051726]/90 border border-cyan-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-cyan-200 mb-4 flex items-center justify-between">
              <span>Camera & Microphone Stream</span>
              <span className="text-[11px] font-mono text-cyan-400/70">Live Feed</span>
            </h3>

            {/* Video Container */}
            <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-cyan-500/30 relative flex items-center justify-center shadow-inner">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {!cameraAllowed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#031320]/95">
                  <VideoOff className="w-10 h-10 text-cyan-500/30 mb-3" />
                  <p className="text-xs text-zinc-300 mb-4 max-w-xs">
                    Camera preview is idle. Grant camera and microphone permissions to verify audio/video.
                  </p>
                  <button
                    onClick={requestMediaPermissions}
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-[#02101b] font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-950/50 cursor-pointer"
                  >
                    Allow Camera & Mic
                  </button>
                </div>
              )}
            </div>

            {/* Mic Level Bar */}
            <div className="mt-4 flex items-center gap-3 bg-[#031320] p-3 rounded-xl border border-cyan-500/15">
              <Mic className={`w-4 h-4 ${micAllowed ? "text-emerald-400" : "text-zinc-500"}`} />
              <div className="flex-1 h-2 bg-[#062438] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-75"
                  style={{ width: `${micAllowed ? micVolume : 0}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-zinc-400 w-12 text-right">
                {micAllowed ? `${micVolume}%` : "Off"}
              </span>
            </div>
          </div>

          {/* Password Verification Card */}
          <div className="bg-[#051726]/90 border border-cyan-500/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-cyan-200 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Meeting Key Password</span>
            </h3>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Enter the session passcode provided in your assessment invitation email.
            </p>

            {passwordVerified ? (
              <div className="flex items-center gap-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Passcode verified and authenticated for this room.</span>
              </div>
            ) : (
              <form onSubmit={verifyPassword} className="flex gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Key Password..."
                  className="flex-1 bg-[#031320] border border-cyan-500/25 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={!password.trim()}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-[#02101b] font-semibold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Verify Key
                </button>
              </form>
            )}
            {passwordError && (
              <p className="text-[11px] text-rose-400 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                {passwordError}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Pre-Flight Checklist */}
        <div className="w-full lg:w-1/2 flex flex-col gap-5">
          <div className="bg-[#051726]/90 border border-cyan-500/20 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
            <h2
              className="text-2xl font-normal text-white mb-2"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Candidate Readiness Checklist
            </h2>
            <p className="text-xs text-cyan-100/70 mb-6 leading-relaxed">
              Before entering the live technical assessment, all four verification checks must be satisfied to ensure high call reliability and assessment integrity.
            </p>

            {/* Checklist Items */}
            <div className="space-y-3.5">
              {/* Check 1: Camera */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#031320] border border-cyan-500/15">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${cameraAllowed ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Camera Permission</h4>
                    <p className="text-[11px] text-zinc-400">Live candidate video feed</p>
                  </div>
                </div>
                {cameraAllowed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <button
                    onClick={requestMediaPermissions}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
                  >
                    Enable
                  </button>
                )}
              </div>

              {/* Check 2: Microphone */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#031320] border border-cyan-500/15">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${micAllowed ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Microphone Input</h4>
                    <p className="text-[11px] text-zinc-400">Clear two-way voice stream</p>
                  </div>
                </div>
                {micAllowed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <button
                    onClick={requestMediaPermissions}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
                  >
                    Enable
                  </button>
                )}
              </div>

              {/* Check 3: Screen Share */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#031320] border border-cyan-500/15">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${screenShareTested ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                    <ScreenShare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Screen Share Verification</h4>
                    <p className="text-[11px] text-zinc-400">Required to write code in the interview</p>
                  </div>
                </div>
                {screenShareTested ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Verified</span>
                  </div>
                ) : (
                  <button
                    onClick={testScreenShare}
                    className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
                  >
                    Test Share
                  </button>
                )}
              </div>

              {/* Check 4: Network & Browser */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#031320] border border-cyan-500/15">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${browserOk ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Network & WebRTC Engine</h4>
                    <p className="text-[11px] text-zinc-400">
                      {networkPingMs ? `RTT Latency: ${networkPingMs}ms` : "Testing connection..."}
                    </p>
                  </div>
                </div>
                {browserOk ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
              </div>
            </div>

            {/* CTA Enter Button */}
            <div className="mt-8 pt-5 border-t border-cyan-500/15">
              <button
                onClick={handleProceedToMeeting}
                disabled={!allChecksReady || submitting}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 disabled:opacity-40 text-[#02101b] font-semibold py-3.5 px-6 rounded-2xl text-sm transition-all shadow-xl shadow-cyan-950/50 hover:shadow-cyan-400/30 cursor-pointer disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synchronizing Readiness...</span>
                  </>
                ) : (
                  <>
                    <span>Enter Live Interview Session</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {!allChecksReady && (
                <p className="text-[11px] text-cyan-200/60 text-center mt-2.5">
                  Complete camera, screen-share test, and passcode verification to proceed.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
