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
      const response = await API.post("/auth/signup", {
        name,
        email,
        password,
        role,
      });

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
              Create your account
            </h1>
            <p className="text-zinc-400 text-[13px] mb-8">
              Join a network of visionaries and unlock premium design resources tailored for you.
            </p>

            {error && (
              <div className="mb-6 p-3 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium flex flex-col gap-2">
                <span>{error}</span>
              </div>
            )}

            {/* Role Toggle */}
            <div className="flex p-1 bg-white/5 rounded-[10px] border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => setRole("candidate")}
                className={`flex-1 py-2 text-[12px] font-medium rounded-[6px] transition-all duration-300 ${role === "candidate"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole("interviewer")}
                className={`flex-1 py-2 text-[12px] font-medium rounded-[6px] transition-all duration-300 ${role === "interviewer"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                  }`}
              >
                Interviewer
              </button>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-zinc-300 mb-1.5">
                  Full name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Andrew Thomas"
                  className="w-full bg-transparent border border-white/10 focus:border-white/30 focus:bg-white/5 rounded-[8px] py-2.5 px-3 text-[14px] text-white outline-none transition-all placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-zinc-300 mb-1.5">
                  Email address *
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
                  placeholder="andrew@example.com"
                  className={`w-full bg-transparent border ${emailStatus === 'valid' ? 'border-green-500/50 focus:border-green-500' : emailStatus === 'invalid' ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-white/30'} focus:bg-white/5 rounded-[8px] py-2.5 px-3 text-[14px] text-white outline-none transition-all placeholder:text-zinc-600`}
                />
                {emailStatus === "checking" && (
                  <div className="mt-2 text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border-2 border-zinc-500 border-t-zinc-200 animate-spin"></span>
                    Verifying mailbox...
                  </div>
                )}
                {emailStatus === "valid" && (
                  <div className="mt-2 text-[11px] text-green-400 flex items-center gap-1.5 font-medium bg-green-500/10 px-2 py-1.5 rounded-md border border-green-500/20">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Valid email! You can proceed further.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-zinc-300 mb-1.5">
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
                <p className="text-[10px] text-zinc-600 mt-2">
                  Password must be at least 8 characters, including a number and a special character.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#d2dbbd] text-black font-medium py-2.5 px-4 rounded-[8px] text-[13px] hover:bg-[#e0e8cd] transition-all duration-200 shadow-[0_0_15px_rgba(210,219,189,0.1)] active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                {loading ? "Creating..." : "Create account"}
              </button>
            </form>

            <div className="mt-8 text-center text-[12px] text-zinc-500">
              Already have an account?{" "}
              <Link to="/" className="text-zinc-300 hover:text-white transition-colors">
                Sign In
              </Link>
            </div>

            <p className="mt-6 text-center text-[10px] text-zinc-600">
              By creating an account, you agree to our <a href="#" className="hover:text-zinc-400">Terms of Service</a> and <a href="#" className="hover:text-zinc-400">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
