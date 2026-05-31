import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import API from "../api/axios";

const AUTH_IMAGES = [
  "https://i.pinimg.com/736x/6c/66/3c/6c663c35befeee95d2e3998c15db8666.jpg",
  "https://i.pinimg.com/736x/da/f6/df/daf6df11d43542be719478c10cf11e31.jpg",
  "https://i.pinimg.com/736x/11/b9/0d/11b90df8dbd3adbdaeee01d2bb28ca28.jpg",
  "https://i.pinimg.com/736x/17/d2/ef/17d2ef0599ee1972d046f911111cb256.jpg",
  "https://i.pinimg.com/736x/54/f4/78/54f478a2ffa014b2857c533b6829661d.jpg",
  "https://i.pinimg.com/736x/ef/95/be/ef95beb747566e0b8b7091a23dc4ffbc.jpg",
  "https://i.pinimg.com/736x/5e/63/e5/5e63e5bc92cda08a00d8a6c1b0fcc931.jpg"
];

function Login() {
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
    // Shuffle images on mount
    const shuffled = [...AUTH_IMAGES].sort(() => Math.random() - 0.5);
    setShuffledImages(shuffled);

    // Start carousel
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % shuffled.length);
    }, 4500); // Crossfade every 4.5s

    return () => clearInterval(interval);
  }, []);

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

      if (rememberMe) {
        localStorage.setItem("token", token);
      } else {
        sessionStorage.setItem("token", token);
      }

      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "candidate") {
        navigate("/candidate-dashboard");
      } else {
        navigate("/interviewer-dashboard");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Login failed. Check your credentials.";
      setError(errMsg);

      if (errMsg.toLowerCase().includes("verify email")) {
        sessionStorage.setItem("signup_email", email);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative z-10"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >
      <div className="w-full max-w-[1000px] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[24px] overflow-hidden flex flex-col md:flex-row min-h-[600px] shadow-2xl">

        {/* Left Side: Image Carousel & Slogan */}
        <div className="w-full md:w-1/2 relative hidden md:flex flex-col justify-end p-10 overflow-hidden border-r border-white/5">
          {shuffledImages.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt="Architecture Hero"
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${idx === currentImageIndex ? 'opacity-70' : 'opacity-0'} mix-blend-luminosity`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

          <div className="relative z-10">

          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-[#09090b]/80 relative">
          <div className="max-w-[360px] w-full mx-auto relative z-10">

            {/* Branding Moved to Right Half Top */}
            <div className="flex items-center gap-3 mb-10">
              <img src="/Sora_Favicon.jpg" alt="Sora" className="w-9 h-9 rounded-xl border border-white/10 shadow-lg" />
              <span className="text-3xl font-extrabold tracking-tight text-white">Sora</span>
            </div>

            <h1 className="text-[24px] font-medium tracking-tight text-white mb-2">
              Welcome back
            </h1>
            <p className="text-zinc-400 text-[13px] mb-8">
              Sign in to your account to continue.
            </p>

            {error && (
              <div className="mb-6 p-3 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium flex flex-col gap-2">
                <span>{error}</span>
                {error.toLowerCase().includes("verify email") && (
                  <Link to="/verify-otp" className="text-red-400 hover:text-red-300 underline font-semibold mt-1">
                    Go to OTP Verification Page →
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[12px] font-medium text-zinc-300 mb-2">
                  Email address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. andrew@example.com"
                  className="w-full bg-transparent border border-white/10 focus:border-white/30 focus:bg-white/5 rounded-[8px] py-2.5 px-3 text-[14px] text-white outline-none transition-all placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-zinc-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-transparent border border-white/10 focus:border-white/30 focus:bg-white/5 rounded-[8px] py-2.5 pl-3 pr-10 text-[14px] text-white outline-none transition-all placeholder:text-zinc-600"
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

              <div className="flex items-center justify-between text-[12px] text-zinc-400 pt-1 pb-4">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer appearance-none w-4 h-4 border border-white/20 rounded-[4px] bg-transparent checked:bg-white checked:border-white transition-all cursor-pointer"
                    />
                    <svg className="absolute w-2.5 h-2.5 text-black pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="group-hover:text-zinc-300 transition-colors">Remember me</span>
                </label>
                <a href="#" className="hover:text-white transition-colors">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#d2dbbd] text-black font-medium py-2.5 px-4 rounded-[8px] text-[13px] hover:bg-[#e0e8cd] transition-all duration-200 shadow-[0_0_15px_rgba(210,219,189,0.1)] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Sign in to account"}
              </button>
            </form>

            <div className="mt-8 text-center text-[12px] text-zinc-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-zinc-300 hover:text-white transition-colors">
                Sign Up
              </Link>
            </div>

            <p className="mt-8 text-center text-[10px] text-zinc-600">
              By signing in, you agree to our <a href="#" className="hover:text-zinc-400">Terms of Service</a> and <a href="#" className="hover:text-zinc-400">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
