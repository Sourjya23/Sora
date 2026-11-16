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

function Signup() {
  const [role, setRole] = useState("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState("idle"); // idle, checking, valid, invalid
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

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return false;
    return email.toLowerCase().endsWith("@gmail.com");
  };

  const validatePassword = (password) => {
    // Min 8 chars, 1 uppercase, 1 number, 1 special character
    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  };

  const handleEmailBlur = async () => {
    if (!email) return;

    if (!validateEmail(email)) {
      setEmailStatus("invalid");
      setError("Please enter a valid Gmail address. We currently only accept @gmail.com to prevent spam.");
      return;
    }

    setEmailStatus("checking");
    setError("");
    try {
      const response = await API.post("/auth/validate-email", { email });
      if (response.data.valid) {
        setEmailStatus("valid");
      } else {
        setEmailStatus("invalid");
        setError("This mailbox does not exist or cannot receive mail. Please enter a real email.");
      }
    } catch (err) {
      console.error(err);
      setEmailStatus("invalid");
      setError(err.response?.data?.message || "Failed to validate email. Please try again.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Please enter a valid Gmail address. We currently only accept @gmail.com to prevent spam.");
      return;
    }
    if (emailStatus !== "valid") {
      setError("Please wait for your email to be verified as valid before proceeding.");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.");
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/signup", {
        name,
        email,
        password,
        role,
      });

      sessionStorage.setItem("signup_email", email);
      localStorage.setItem("otpEmail", email);
      toast.success("Account Created!", "A 6-digit verification code has been dispatched to your email.");
      navigate("/verify-otp");
    } catch (err) {
      const errMsg = err.response?.data?.message || "Signup failed. Please try again.";
      setError(errMsg);
      toast.error("Registration Failed", errMsg);
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

      <div className="w-full max-w-[1000px] bg-[#041a2a]/80 backdrop-blur-2xl border border-white/10 rounded-[28px] overflow-hidden flex flex-col md:flex-row min-h-[620px] shadow-[0_25px_70px_rgba(0,0,0,0.6)] relative z-10">

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
          <div className="max-w-[360px] w-full mx-auto relative z-10">

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
              Create your account
            </h1>
            <p className="text-zinc-400 text-xs sm:text-[13px] mb-6">
              Join a network of engineers and practice real technical interview loops.
            </p>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex flex-col gap-1.5">
                <span>{error}</span>
              </div>
            )}

            {/* Role Toggle */}
            <div className="flex p-1 bg-white/[0.04] rounded-xl border border-white/10 mb-5">
              <button
                type="button"
                onClick={() => setRole("candidate")}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                  role === "candidate"
                    ? "bg-white text-[#0A0A0A] font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole("interviewer")}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                  role === "interviewer"
                    ? "bg-white text-[#0A0A0A] font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Interviewer
              </button>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Full name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Andrew Thomas"
                  className="w-full bg-white/[0.04] border border-white/15 focus:border-cyan-400 focus:bg-white/[0.07] rounded-xl py-2.5 px-3.5 text-sm text-white outline-none transition-all placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Email address (@gmail.com only) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value.toLowerCase());
                    setEmailStatus("idle");
                  }}
                  onBlur={handleEmailBlur}
                  placeholder="andrew@gmail.com"
                  className={`w-full bg-white/[0.04] border ${
                    emailStatus === "valid"
                      ? "border-emerald-500/60 focus:border-emerald-400"
                      : emailStatus === "invalid"
                      ? "border-red-500/60 focus:border-red-400"
                      : "border-white/15 focus:border-cyan-400"
                  } focus:bg-white/[0.07] rounded-xl py-2.5 px-3.5 text-sm text-white outline-none transition-all placeholder:text-zinc-500`}
                />
                {emailStatus === "checking" && (
                  <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border-2 border-zinc-500 border-t-cyan-400 animate-spin" />
                    Verifying mailbox...
                  </div>
                )}
                {emailStatus === "valid" && (
                  <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Valid email! You can proceed further.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Password *
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
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Must be at least 8 chars, 1 uppercase, 1 number, and 1 special symbol.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-[#0A0A0A] font-semibold py-2.5 px-4 rounded-xl text-sm hover:bg-white/90 transition-all duration-200 shadow-lg active:scale-[0.99] disabled:opacity-50 mt-4 cursor-pointer"
              >
                {loading ? "Creating..." : "Create account"}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-zinc-400">
              Already have an account?{" "}
              <Link to="/login" className="text-cyan-300 font-medium hover:text-white transition-colors">
                Sign In
              </Link>
            </div>

            <p className="mt-5 text-center text-[11px] text-zinc-500">
              By creating an account, you agree to our{" "}
              <Link to="/guidelines" className="text-zinc-400 hover:text-white underline underline-offset-2">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/guidelines" className="text-zinc-400 hover:text-white underline underline-offset-2">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
