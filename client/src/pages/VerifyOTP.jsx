import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

function VerifyOTP() {
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
    const signupEmail = sessionStorage.getItem("signup_email");
    if (signupEmail) {
      setEmail(signupEmail);
    }
  }, []);

  const handleResendOtp = async () => {
    if (!email) {
      setError("Please enter your email address to resend OTP.");
      return;
    }

    setError("");
    setSuccess("");
    setResending(true);

    try {
      const response = await API.post("/auth/resend-otp", { email });
      setSuccess(response.data.message || "A new OTP has been sent to your email!");
      setCooldown(60); // Start 60-second cooldown
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP. Please try again.");
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

      setSuccess("Account verified successfully! Redirecting...");
      
      const { token, user } = response.data;
      
      // Clear any stale tokens from previous sessions to prevent data merging
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      
      // Save token by default in sessionStorage on OTP verification
      sessionStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setTimeout(() => {
        if (user.role === "candidate") {
          navigate("/candidate-dashboard");
        } else {
          navigate("/interviewer-dashboard");
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please check your OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex items-center justify-center relative overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md px-6 z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            Verify Email
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-light">
            Enter the 6-digit OTP code sent to your email address
          </p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 rounded-xl py-3 px-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                One-Time Password (OTP)
              </label>
              <input
                type="text"
                required
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 rounded-xl py-3 px-4 text-center text-lg font-mono tracking-[0.5em] text-slate-100 outline-none transition-all placeholder:text-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Verifying..." : "Verify OTP Code"}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending || cooldown > 0}
              className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-medium py-3 px-4 rounded-xl text-sm transition-all duration-300 border border-slate-700 hover:border-slate-600 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {resending ? "Sending..." : cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 flex justify-between">
            <Link to="/signup" className="text-slate-400 hover:text-white hover:underline">
              ← Change Email
            </Link>
            <Link to="/" className="text-slate-400 hover:text-white hover:underline">
              Sign In Instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyOTP;
