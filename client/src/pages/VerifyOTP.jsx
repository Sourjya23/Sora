import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { toast } from "../components/ui/Toast";

export default function VerifyOTP() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const storedEmail = localStorage.getItem("otpEmail") || sessionStorage.getItem("signup_email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleResendOtp = async () => {
    if (!email) {
      const err = "Please enter your email address to resend OTP.";
      setError(err);
      toast.warning("Email Required", err);
      return;
    }

    setError("");
    setSuccess("");
    setResending(true);

    try {
      const response = await API.post("/auth/resend-otp", { email });
      const msg = response.data.message || "A new OTP has been sent to your email!";
      setSuccess(msg);
      toast.success("OTP Sent!", "A new 6-digit code has been dispatched to your inbox.");
      setCooldown(60);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to resend OTP. Please try again.";
      setError(errMsg);
      toast.error("Resend Failed", errMsg);
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await API.post("/auth/verify-otp", {
        email,
        otp,
      });

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setSuccess("Email successfully verified! Redirecting to your dashboard...");
      toast.success("Email Verified!", "Welcome to Sora. Redirecting to your dashboard...");
      setTimeout(() => {
        if (user.role === "admin") {
          navigate("/admin-dashboard");
        } else if (user.role === "candidate") {
          navigate("/candidate-dashboard");
        } else {
          navigate("/interviewer-dashboard");
        }
      }, 1000);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Invalid OTP code. Please check your spam folder or resend.";
      setError(errMsg);
      toast.error("Verification Failed", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative bg-gradient-to-b from-[#041826] via-[#052338] to-[#041826] text-white selection:bg-cyan-500/30 selection:text-white">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-900/15 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Branding */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <img
              src="/Sora_Favicon.jpg"
              alt="Sora"
              className="w-9 h-9 rounded-xl border border-white/15 shadow-lg object-cover"
            />
            <span
              className="text-2xl font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Sora
            </span>
          </Link>
          <h1
            className="text-2xl sm:text-3xl font-medium tracking-tight text-white"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Verify Your Email
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Enter the 6-digit verification code sent to your inbox.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#041a2a]/85 backdrop-blur-2xl border border-white/10 p-8 rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.6)]">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full bg-white/[0.04] border border-white/15 focus:border-cyan-400 focus:bg-white/[0.07] rounded-xl py-2.5 px-3.5 text-sm text-white outline-none transition-all placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5 text-center">
                One-Time Password (OTP)
              </label>
              <input
                type="text"
                required
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full bg-white/[0.04] border border-white/15 focus:border-cyan-400 focus:bg-white/[0.07] rounded-xl py-3 px-4 text-center text-xl font-mono tracking-[0.4em] text-white outline-none transition-all placeholder:text-zinc-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="w-full bg-white text-[#0A0A0A] font-semibold py-2.5 px-4 rounded-xl text-sm hover:bg-white/90 transition-all duration-200 shadow-lg active:scale-[0.99] disabled:opacity-50 mt-1 cursor-pointer"
            >
              {loading ? "Verifying..." : "Verify Code & Continue →"}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending || cooldown > 0}
              className="w-full py-2.5 rounded-xl border border-white/15 bg-white/5 text-zinc-300 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {resending ? "Sending..." : cooldown > 0 ? `Resend Code in ${cooldown}s` : "Resend OTP Code"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-zinc-400 flex justify-between pt-3 border-t border-white/10">
            <Link to="/signup" className="text-cyan-300 hover:text-white transition-colors">
              ← Change Email
            </Link>
            <Link to="/login" className="text-cyan-300 hover:text-white transition-colors">
              Sign In Instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
