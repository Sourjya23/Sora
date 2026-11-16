import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import API from "../api/axios";
import { toast } from "../components/ui/Toast";

const AUTH_IMAGES = [
  "https://i.pinimg.com/736x/6c/66/3c/6c663c35befeee95d2e3998c15db8666.jpg",
  "https://i.pinimg.com/736x/da/f6/df/daf6df11d43542be719478c10cf11e31.jpg",
  "https://i.pinimg.com/736x/11/b9/0d/11b90df8dbd3adbdaeee01d2bb28ca28.jpg",
  "https://i.pinimg.com/736x/17/d2/ef/17d2ef0599ee1972d046f911111cb256.jpg",
  "https://i.pinimg.com/736x/54/f4/78/54f478a2ffa014b2857c533b6829661d.jpg",
  "https://i.pinimg.com/736x/ef/95/be/ef95beb747566e0b8b7091a23dc4ffbc.jpg",
  "https://i.pinimg.com/736x/5e/63/e5/5e63e5bc92cda08a00d8a6c1b0fcc931.jpg"
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Carousel State
  const [shuffledImages, setShuffledImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const shuffled = [...AUTH_IMAGES].sort(() => Math.random() - 0.5);
    setShuffledImages(shuffled);

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % shuffled.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const validateEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("token", token);

      toast.success("Welcome Back!", `Successfully signed in as ${user.name || user.email}`);

      const params = new URLSearchParams(window.location.search);
      const redirectPath = params.get("redirect");
      if (redirectPath && redirectPath.startsWith("/")) {
        navigate(redirectPath);
        return;
      }

      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else if (user.role === "candidate") {
        navigate("/candidate-dashboard");
      } else {
        navigate("/interviewer-dashboard");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Invalid credentials. Please try again.";
      setError(errMsg);
      toast.error("Sign In Failed", errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative bg-gradient-to-b from-[#041826] via-[#052338] to-[#041826] text-white selection:bg-cyan-500/30 selection:text-white">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-cyan-900/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-blue-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Main Glass Card */}
      <div className="w-full max-w-[960px] bg-[#041a2a]/80 backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden flex flex-col md:flex-row min-h-[580px] shadow-[0_25px_70px_rgba(0,0,0,0.6)] relative z-10">

        {/* Left Side: Image Carousel */}
        <div className="w-full md:w-1/2 relative hidden md:block overflow-hidden border-r border-white/10">
          {shuffledImages.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt="Visual"
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
                idx === currentImageIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-[#03131f]/70 relative">
          <div className="max-w-[340px] w-full mx-auto relative z-10">

            {/* Branding Header */}
            <Link to="/" className="inline-flex items-center gap-3 mb-7 group">
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
              className="text-[26px] font-medium tracking-tight text-white mb-2 leading-tight"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Welcome back
            </h1>
            <p className="text-zinc-400 text-xs sm:text-[13px] mb-6">
              Sign in to your account to continue your interview sessions.
            </p>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex flex-col gap-1.5">
                <span>{error}</span>
                {error.toLowerCase().includes("verify email") && (
                  <Link to="/verify-otp" className="text-cyan-300 hover:text-white hover:underline font-semibold mt-1">
                    Go to OTP Verification Page →
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  placeholder="name@example.com"
                  className="w-full bg-white/[0.04] border border-white/15 focus:border-cyan-400 focus:bg-white/[0.07] rounded-xl py-2.5 px-3.5 text-sm text-white outline-none transition-all placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white/[0.04] border border-white/15 focus:border-cyan-400 focus:bg-white/[0.07] rounded-xl py-2.5 pl-3.5 pr-10 text-sm text-white outline-none transition-all placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 pb-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <a href="#" className="hover:text-cyan-300 transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-[#0A0A0A] font-semibold py-2.5 px-4 rounded-xl text-sm hover:bg-white/90 transition-all duration-200 shadow-lg active:scale-[0.99] disabled:opacity-50 mt-3 cursor-pointer"
              >
                {loading ? "Signing in..." : "Sign in to account"}
              </button>
            </form>

            <div className="mt-7 text-center text-xs text-zinc-400">
              Don't have an account?{" "}
              <Link to="/signup" className="text-cyan-300 font-medium hover:text-white transition-colors">
                Sign up for free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
