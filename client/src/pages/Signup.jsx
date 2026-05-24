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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center relative overflow-hidden">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md px-6 z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-light">
            Join interview.io to streamline your technical evaluations
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Role Toggle */}
          <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800/60 mb-6">
            <button
              type="button"
              onClick={() => setRole("candidate")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                role === "candidate"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole("interviewer")}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                role === "interviewer"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Interviewer
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 rounded-xl py-3 px-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600"
              />
            </div>

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
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 rounded-xl py-3 px-4 text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all duration-300 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Registering..." : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link to="/" className="text-slate-300 hover:text-white font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
