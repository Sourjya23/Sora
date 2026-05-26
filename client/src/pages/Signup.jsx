import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api/axios";

function Signup() {
  const [role, setRole] = useState("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/signup", {
        name,
        email,
        password,
        role,
      });

      // Save email to sessionStorage for OTP verification step
      sessionStorage.setItem("signup_email", email);

      navigate("/verify-otp");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-transparent text-white flex items-center justify-center relative overflow-hidden"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div className="w-full max-w-[420px] px-6 z-10 my-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-[2rem] font-extrabold tracking-[-0.02em] text-white">
            Create Account
          </h1>
          <p className="text-zinc-400 text-[14px] mt-2">
            Join Sora to streamline your technical evaluations
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-[16px] shadow-sm">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-[10px] bg-red-50 border border-red-200 text-red-600 text-[13px] font-medium">
              {error}
            </div>
          )}

          {/* Role Toggle */}
          <div className="flex p-1 bg-white/10 rounded-[10px] border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => setRole("candidate")}
              className={`flex-1 py-[7px] text-[12px] font-bold rounded-[8px] transition-all duration-300 ${
                role === "candidate"
                  ? "bg-white/5 backdrop-blur-lg text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-300 font-medium"
              }`}
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole("interviewer")}
              className={`flex-1 py-[7px] text-[12px] font-bold rounded-[8px] transition-all duration-300 ${
                role === "interviewer"
                  ? "bg-white/5 backdrop-blur-lg text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-300 font-medium"
              }`}
            >
              Interviewer
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5 uppercase tracking-[0.05em]">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white/5 border border-white/10 focus:border-white focus:ring-1 focus:ring-white rounded-[10px] py-[10px] px-4 text-[14px] text-white outline-none transition-all placeholder:text-zinc-400"
              />
            </div>

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
                placeholder="Min. 8 characters"
                className="w-full bg-white/5 border border-white/10 focus:border-white focus:ring-1 focus:ring-white rounded-[10px] py-[10px] px-4 text-[14px] text-white outline-none transition-all placeholder:text-zinc-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-zinc-900 font-bold hover:scale-105 font-bold py-[12px] px-4 rounded-[10px] text-[14px] hover:bg-zinc-800 transition-all duration-200 cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {loading ? "Registering..." : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </button>
          </form>

          <div className="mt-6 text-center text-[13px] text-zinc-400">
            Already have an account?{" "}
            <Link to="/" className="text-white font-semibold hover:underline underline-offset-2">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
