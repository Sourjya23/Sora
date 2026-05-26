import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email,
        password,
        rememberMe,
      });

      const { token, user } = response.data;

      // STEP 17: Save Token with Remember Me Logic
      if (rememberMe) {
        localStorage.setItem("token", token);
      } else {
        sessionStorage.setItem("token", token);
      }

      localStorage.setItem("user", JSON.stringify(user));

      // STEP 18: Role Based Dashboard Navigation
      if (user.role === "candidate") {
        navigate("/candidate-dashboard");
      } else {
        navigate("/interviewer-dashboard");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Login failed. Check your credentials.";
      setError(errMsg);
      
      // If user needs to verify their email, save the email and give a path to verification
      if (errMsg.toLowerCase().includes("verify email")) {
        sessionStorage.setItem("signup_email", email);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-transparent text-white flex items-center justify-center relative overflow-hidden"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div className="w-full max-w-[420px] px-6 z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-[2rem] font-extrabold tracking-[-0.02em] text-white">
            Sora
          </h1>
          <p className="text-zinc-400 text-[14px] mt-2">
            Sign in to your account
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[16px] shadow-sm">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-[10px] bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium flex flex-col gap-2">
              <span>{error}</span>
              {error.toLowerCase().includes("verify email") && (
                <Link to="/verify-otp" className="text-red-700 hover:text-red-800 underline font-semibold mt-1">
                  Go to OTP Verification Page →
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-[0.05em]">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 focus:border-white focus:ring-1 focus:ring-white rounded-[10px] py-[10px] px-4 text-[14px] text-white outline-none transition-all placeholder:text-zinc-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-[0.05em]">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 focus:border-white focus:ring-1 focus:ring-white rounded-[10px] py-[10px] px-4 text-[14px] text-white outline-none transition-all placeholder:text-zinc-400"
              />
            </div>

            <div className="flex items-center justify-between text-[13px] text-zinc-400 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 backdrop-blur-lg text-white focus:ring-white"
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-zinc-400 hover:text-white font-medium hover:underline underline-offset-2">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-zinc-900 font-bold hover:scale-105 font-bold py-[12px] px-4 rounded-[10px] text-[14px] hover:bg-zinc-800 transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-[13px] text-zinc-400">
            Don't have an account?{" "}
            <Link to="/signup" className="text-white font-semibold hover:underline underline-offset-2">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
