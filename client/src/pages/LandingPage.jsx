import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Utility ────────────────────────────────────────────────────────────────
const cn = (...c) => c.filter(Boolean).join(" ");

// ── Typing Animation ───────────────────────────────────────────────────────
function TypingAnimation({ lines, speed = 75 }) {
  const [displayed, setDisplayed] = useState("");
  const [li, setLi] = useState(0);
  const [ci, setCi] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    const cur = lines[li];
    const timeout = setTimeout(() => {
      if (!del) {
        if (ci < cur.length) {
          setDisplayed(cur.slice(0, ci + 1));
          setCi((c) => c + 1);
        } else {
          setTimeout(() => setDel(true), 2000);
        }
      } else {
        if (ci > 0) {
          setDisplayed(cur.slice(0, ci - 1));
          setCi((c) => c - 1);
        } else {
          setDel(false);
          setLi((i) => (i + 1) % lines.length);
        }
      }
    }, del ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [ci, del, li, lines, speed]);

  return (
    <span className="text-white font-semibold">
      {displayed}
      <span className="animate-[blink_1s_step-end_infinite] text-zinc-400">|</span>
    </span>
  );
}

// ── Number Counter ─────────────────────────────────────────────────────────
function NumberCounter({ target, suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const e = 1 - Math.pow(1 - p, 3);
            setCount(Math.floor(e * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-[200] px-8 py-[0.9rem] transition-all duration-300",
        scrolled
          ? "bg-white/5 backdrop-blur-md/90 backdrop-blur-[14px] border-b border-white/10 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-[1160px] mx-auto flex items-center gap-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-[10px] flex-none no-underline">
          <div className="w-[30px] h-[30px] rounded-[8px] bg-white flex items-center justify-center overflow-hidden">
            <img src="/Sora_Favicon.jpg" alt="Sora Logo" className="w-full h-full object-cover" />
          </div>
          <span
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
            className="text-[20px] font-extrabold text-white tracking-[-0.01em]"
          >
            Sora
          </span>
        </a>

        {/* Links */}
        <div className="hidden md:flex gap-7 flex-1 justify-center">
          {["#features", "#learn", "#upcoming", "#success"].map((href, i) => (
            <a
              key={href}
              href={href}
              className="text-zinc-300 no-underline text-[13px] font-medium tracking-[0.01em] hover:text-white transition-colors duration-200"
            >
              {["Features", "Learn", "Upcoming", "Stories"][i]}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-[10px] flex-none">
          <button 
            onClick={() => navigate('/login')}
            className="hidden sm:block bg-transparent border border-white/30 text-white hover:bg-white/5 backdrop-blur-md/10 px-4 py-[7px] rounded-[8px] text-[13px] font-medium hover:border-white hover:bg-white/10 hover:text-white transition-all duration-200 cursor-pointer"
          >
            Sign in
          </button>
          <button 
            onClick={() => navigate('/signup')}
            className="bg-white text-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 border-none px-[18px] py-[8px] rounded-[8px] text-[13px] font-bold hover:bg-zinc-300 transition-all duration-200 cursor-pointer"
          >
            Get Early Access
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────


const COMPANY_NAMES = ["Google", "Amazon", "Meta", "Microsoft", "Apple", "Netflix", "Stripe", "Uber"];

const TYPING_LINES = [
  "Crack your FAANG loop this quarter →",
  "Practice with a Google engineer tonight →",
  "Learn Graph BFS through epic adventure →",
  "Dynamic Programming, finally intuitive →",
  "Book your first live session now →",
];

function Hero() {
  const [companyIdx, setCompanyIdx] = useState(0);
  const [companyVisible, setCompanyVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCompanyVisible(false);
      setTimeout(() => {
        setCompanyIdx((i) => (i + 1) % COMPANY_NAMES.length);
        setCompanyVisible(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen bg-transparent flex items-center justify-center px-8 pt-32 pb-16 relative overflow-hidden">


      {/* Content */}
      <div className="relative z-10 text-center max-w-[760px] animate-[fadeUp_0.8s_ease_both]">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-[5px] rounded-full text-[12px] text-zinc-300 mb-8 uppercase tracking-[0.03em] font-semibold">
          <span className="w-[6px] h-[6px] bg-green-500 rounded-full animate-pulse" />
          Real interviews. Real engineers.
        </div>

        <p className="text-[11px] text-zinc-400 uppercase tracking-[0.1em] font-semibold mb-3">
          Where great engineers are made
        </p>

        <h1
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
          className="text-[clamp(2.6rem,5.5vw,4.2rem)] font-extrabold leading-[1.1] mb-5 tracking-[-0.02em] text-white"
        >
          Interview with engineers
          <br />
          from{" "}
          <em
            className="not-italic text-zinc-300 transition-opacity duration-300"
            style={{ opacity: companyVisible ? 1 : 0 }}
          >
            {COMPANY_NAMES[companyIdx]}
          </em>
          ,
          <br />
          not bots.
        </h1>

        <p className="text-[1.05rem] text-zinc-300 mb-8 max-w-[560px] mx-auto">
          Practice live coding sessions with engineers from top companies. Learn DSA
          through story-driven problems.
          <br />
          <span className="block mt-1 min-h-[1.4em]">
            <TypingAnimation lines={TYPING_LINES} />
          </span>
        </p>

        <div className="flex gap-3 justify-center mb-14 flex-wrap">
          <button 
            onClick={() => navigate('/signup')}
            className="bg-white text-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 border-none px-7 py-[13px] rounded-[10px] text-[15px] font-bold hover:bg-zinc-300 transition-all duration-200 cursor-pointer tracking-[-0.01em]"
          >
            Book a Live Interview →
          </button>
          <button className="flex items-center gap-2 bg-transparent border border-white/30 text-white hover:bg-white/5 backdrop-blur-md/10 px-6 py-[13px] rounded-[10px] text-[15px] hover:border-zinc-400 hover:text-white transition-all duration-200 cursor-pointer">
            ▶&nbsp; See How It Works
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-10 justify-center flex-wrap pt-8 border-t border-white/10">
          {[
            { target: 8400, suffix: "+", label: "Live Sessions Done" },
            { target: 200, suffix: "+", label: "Story Problems" },
            { target: 30, suffix: "+", label: "Companies Covered" },
            { target: 94, suffix: "%", label: "Success Rate" },
          ].map(({ target, suffix, label }) => (
            <div key={label} className="text-center">
              <span
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                className="block text-[1.9rem] font-extrabold text-white"
              >
                <NumberCounter target={target} suffix={suffix} />
              </span>
              <span className="text-[12px] text-zinc-400 tracking-[0.02em]">{label}</span>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

// ── Company Marquee ────────────────────────────────────────────────────────
const COMPANIES = [
  { name: "Google", color: "#4285F4", letter: "G" },
  { name: "Amazon", color: "#FF9900", letter: "A" },
  { name: "Meta", color: "#0082FB", letter: "M" },
  { name: "Microsoft", color: "#00A4EF", letter: "⊞" },
  { name: "Apple", color: "#888", letter: "" },
  { name: "Netflix", color: "#E50914", letter: "N" },
  { name: "Stripe", color: "#635BFF", letter: "S" },
  { name: "Uber", color: "#000", letter: "U" },
  { name: "Airbnb", color: "#FF5A5F", letter: "A" },
  { name: "Coinbase", color: "#0052FF", letter: "C" },
  { name: "Atlassian", color: "#0052CC", letter: "At" },
  { name: "Spotify", color: "#1DB954", letter: "♫" },
];

function CompanyMarquee() {
  const all = [...COMPANIES, ...COMPANIES];
  return (
    <div className="py-6 overflow-hidden border-t border-b border-white/10/50 bg-transparent">
      <div className="relative overflow-hidden w-full">
        <div
          className="absolute top-0 left-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: "linear-gradient(90deg, #09090b, transparent)" }}
        />
        <div
          className="absolute top-0 right-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: "linear-gradient(-90deg, #09090b, transparent)" }}
        />
        <div
          className="flex gap-0 w-max"
          style={{ animation: "marquee 32s linear infinite" }}
        >
          {all.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-[10px] px-10 text-[13px] font-semibold text-zinc-400 whitespace-nowrap"
            >
              <div
                className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-[12px] font-extrabold border border-white/10"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  background: "rgba(255,255,255,0.06)",
                  color: c.color,
                }}
              >
                {c.letter || c.name[0]}
              </div>
              {c.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Features ───────────────────────────────────────────────────────────────
function Features() {
  return (
    <section className="py-22 px-8" id="features">
      <div className="max-w-[1160px] mx-auto">
        <span className="inline-block text-[11px] font-bold text-zinc-300 uppercase tracking-[0.1em] border border-white/20 px-3 py-1 rounded-full mb-4">
          Platform
        </span>
        <h2
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
          className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold text-white mb-4 leading-[1.15] tracking-[-0.02em]"
        >
          Built differently, for a reason.
        </h2>
        <p className="text-zinc-300 max-w-[520px] mb-12 text-[15px]">
          Every feature is designed around how real interviews actually happen — not how
          most platforms simulate them.
        </p>

        {/* Bento grid */}
        <div className="grid grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-[16px] overflow-hidden">
          {/* Live Interview — span 2 */}
          <div className="col-span-3 md:col-span-2 bg-white/5 backdrop-blur-md p-8 hover:bg-transparent transition-colors duration-300 border-r border-white/10">
            <span className="text-[1.6rem] block mb-4">🎙</span>
            <h3
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
              className="text-[1.05rem] font-bold text-white mb-2"
            >
              Real-time interviews with Big Tech engineers
            </h3>
            <p className="text-[13.5px] text-zinc-300 leading-[1.65] mb-5">
              Book 60-minute sessions with verified engineers from Google, Amazon, Meta,
              Microsoft & more. They run the interview — you code live, receive feedback,
              and grow fast.
            </p>
            <div className="flex flex-col gap-[7px]">
              <div className="self-start bg-white/10 text-zinc-300 border border-white/20 px-3 py-[9px] rounded-[9px] text-[12.5px] max-w-[88%]">
                "Walk me through your approach to this problem before you start coding."
              </div>
              <div className="self-end bg-white/10 text-zinc-300 border border-white/10 px-3 py-[9px] rounded-[9px] text-[12.5px] max-w-[88%]">
                "I'd use a monotonic stack here — storing indices to calculate areas."
              </div>
              <div className="self-start bg-white/10 text-zinc-300 border border-white/20 px-3 py-[9px] rounded-[9px] text-[12.5px] max-w-[88%]">
                "Perfect. Go ahead. I'll observe your thought process."
              </div>
              <div className="text-[11.5px] text-zinc-300 pt-[7px] border-t border-white/10">
                ✅ Strong problem decomposition &nbsp;·&nbsp; ✅ Clear communication &nbsp;·&nbsp; ⚠ Optimize edge case handling
              </div>
            </div>
          </div>

          {/* Regular sessions */}
          <div className="col-span-3 md:col-span-1 bg-white/5 backdrop-blur-md p-8 hover:bg-transparent transition-colors duration-300">
            <span className="text-[1.6rem] block mb-4">📅</span>
            <h3
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
              className="text-[1.05rem] font-bold text-white mb-2"
            >
              Regular scheduled sessions
            </h3>
            <p className="text-[13.5px] text-zinc-300 leading-[1.65]">
              Weekly group mock interviews, themed rounds (System Design, Behavioral, DP
              Week), and 1-on-1 bookings. Never miss practice momentum.
            </p>
          </div>

          {/* Story-based — span 2 */}
          <div className="col-span-3 md:col-span-2 bg-white/5 backdrop-blur-md p-8 hover:bg-transparent transition-colors duration-300 border-r border-white/10">
            <span className="text-[1.6rem] block mb-4">📖</span>
            <h3
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
              className="text-[1.05rem] font-bold text-white mb-2"
            >
              Story-driven, topic-wise problem sets
            </h3>
            <p className="text-[13.5px] text-zinc-300 leading-[1.65] mb-5">
              Every problem lives inside a narrative world. Tell us your weak areas — we
              curate a custom story arc that teaches through adventure, not rote practice.
            </p>
            <div className="flex flex-col gap-2">
              {[
                { icon: "🏰", name: "The Kingdom Search", diff: "Easy", diffClass: "bg-green-500/10 text-green-400", topic: "Binary Search — Chapter 1: The Oracle's Trial" },
                { icon: "🕸", name: "The Enchanted Maze", diff: "Medium", diffClass: "bg-amber-500/10 text-amber-400", topic: "Graph BFS — Chapter 3: Shadows & Paths" },
                { icon: "🐉", name: "Dragon's Coin Dilemma", diff: "Hard", diffClass: "bg-red-500/10 text-red-400", topic: "Dynamic Programming — Chapter 7: The Memoized Vault" },
              ].map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-[10px] px-[10px] py-2 rounded-[8px] bg-white/10 border border-white/10"
                >
                  <span className="text-[18px] w-7 text-center">{s.icon}</span>
                  <div>
                    <span className="text-[12.5px] font-semibold text-white block">
                      {s.name}
                      <span className={cn("inline-block text-[10px] px-[7px] py-[2px] rounded-[4px] font-bold ml-2", s.diffClass)}>
                        {s.diff}
                      </span>
                    </span>
                    <span className="text-[11px] text-zinc-400">{s.topic}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In-session coding */}
          <div className="col-span-3 md:col-span-1 bg-white/5 backdrop-blur-md p-8 hover:bg-transparent transition-colors duration-300">
            <span className="text-[1.6rem] block mb-4">⌨</span>
            <h3
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
              className="text-[1.05rem] font-bold text-white mb-2"
            >
              Code inside the interview, live
            </h3>
            <p className="text-[13.5px] text-zinc-300 leading-[1.65] mb-4">
              A shared editor opens within the session. Your interviewer can annotate,
              suggest, and review in real time — just like an actual FAANG loop.
            </p>
            <div className="bg-transparent border border-white/10 rounded-[8px] overflow-hidden mb-3">
              <div className="flex items-center gap-[5px] px-[10px] py-[7px] border-b border-white/10">
                <span className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]" />
                <span className="w-[9px] h-[9px] rounded-full bg-[#febc2e]" />
                <span className="w-[9px] h-[9px] rounded-full bg-[#28c840]" />
              </div>
              <div className="px-3 py-3 font-mono text-[11px] leading-[1.8] text-zinc-400">
                <span className="text-zinc-300">1&nbsp;&nbsp;</span>
                <span className="text-zinc-300">def</span> <span className="text-white">solve</span>(nums, k):<br />
                <span className="text-zinc-300">2&nbsp;&nbsp;</span>&nbsp;&nbsp;<span className="text-zinc-300"># Interviewer annotated ↓</span><br />
                <span className="text-zinc-300">3&nbsp;&nbsp;</span>&nbsp;&nbsp;window = collections<span className="text-zinc-300">...</span><br />
                <span className="text-zinc-300">4&nbsp;&nbsp;</span>&nbsp;&nbsp;<span className="text-white">|</span><span className="text-zinc-300">█ cursor</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-[6px]">
              {["Python", "JavaScript", "Java", "C++", "Go"].map((l) => (
                <span
                  key={l}
                  className="text-[11px] px-[9px] py-[3px] rounded-[5px] bg-white/10 text-zinc-300 border border-white/10 font-mono"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Remove Section ─────────────────────────────────────────────────────────
function RemoveSection() {
  const items = [
    { num: "01", title: "Fake AI interviewers", desc: "No more scripted bots that can't simulate pressure, judgment, or real follow-up questions. Every session is human-led." },
    { num: "02", title: "Context-free grinding", desc: "Solving 500 problems with no theme, no arc, and no understanding of why — replaced with curated story journeys." },
    { num: "03", title: "Switching tabs to code", desc: "Juggling Zoom + LeetCode + notes during a session. Sora gives you a shared editor right inside the interview call." },
    { num: "04", title: "Vague feedback loops", desc: '"Good job" after a session means nothing. Engineers on Sora give structured, FAANG-calibrated feedback every time.' },
  ];

  return (
    <section className="py-22 px-8 bg-transparent" id="learn">
      <div className="max-w-[1160px] mx-auto">
        <span className="inline-block text-[11px] font-bold text-zinc-300 uppercase tracking-[0.1em] border border-white/20 px-3 py-1 rounded-full mb-4">
          What Sora removes
        </span>
        <h2
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
          className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold text-white mb-4 leading-[1.15] tracking-[-0.02em]"
        >
          We eliminated the friction.
        </h2>
        <p className="text-zinc-300 max-w-[520px] mb-12 text-[15px]">
          Traditional prep is broken. Sora cuts the nonsense and replaces it with what
          actually gets you hired.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.num}
              className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[12px] hover:border-white/20 transition-colors duration-300 shadow-sm hover:shadow"
            >
              <div
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                className="text-[2.5rem] font-extrabold text-white/[0.06] mb-2 leading-none"
              >
                {item.num}
              </div>
              <div
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                className="text-[1rem] font-bold text-white mb-2"
              >
                {item.title}
              </div>
              <div className="text-[13px] text-zinc-300 leading-[1.6] mb-3">{item.desc}</div>
              <span className="inline-flex items-center gap-[5px] text-[11px] font-bold px-[9px] py-[3px] rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                ● Removed
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Upcoming ───────────────────────────────────────────────────────────────
function Upcoming() {
  const items = [
    {
      quarter: "Q3 2025",
      icon: "🗺",
      title: "Heatmaps for solvers",
      desc: "Visualize your activity streak, topic coverage, and weak zones across a GitHub-style contribution heatmap. Know exactly where to push harder.",
    },
    {
      quarter: "Q3 2025",
      icon: "🏘",
      title: "Community OA Board",
      desc: "Candidates can post OA screenshots, problem statements, and solutions. Crowd-sourced discussion and pattern tagging — all moderated for quality.",
    },
    {
      quarter: "Q4 2025",
      icon: "🤝",
      title: "Peer pairing rooms",
      desc: "Pair with another learner for mutual mock sessions. One interviews, one codes, then switch. Built-in timer, shared editor, and evaluation rubric.",
    },
  ];

  return (
    <section className="py-22 px-8" id="upcoming">
      <div className="max-w-[1160px] mx-auto">
        <span className="inline-block text-[11px] font-bold text-zinc-300 uppercase tracking-[0.1em] border border-white/20 px-3 py-1 rounded-full mb-4">
          Coming Soon
        </span>
        <h2
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
          className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold text-white mb-4 leading-[1.15] tracking-[-0.02em]"
        >
          What's next on Sora.
        </h2>
        <p className="text-zinc-300 max-w-[520px] mb-12 text-[15px]">
          We're building in public. Here's what the community is most excited about.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="relative p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[12px] overflow-hidden hover:border-white/20 transition-colors duration-300 shadow-sm hover:shadow"
              style={{
                backgroundImage: "linear-gradient(to bottom, rgba(255,255,255,0.015), transparent)",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent" />
              <span className="absolute top-4 right-4 text-[10px] px-2 py-[3px] rounded-[4px] bg-white/10 text-zinc-400 border border-white/10 font-bold uppercase tracking-[0.05em]">
                {item.quarter}
              </span>
              <span className="text-[1.8rem] block mb-4">{item.icon}</span>
              <h3
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
                className="text-[1rem] font-bold text-white mb-2"
              >
                {item.title}
              </h3>
              <p className="text-[13px] text-zinc-300 leading-[1.6]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ───────────────────────────────────────────────────────────
function Testimonials() {
  const reviews = [
    {
      initials: "AK",
      name: "Aarav Krishnan",
      role: "SDE @ Google — Bangalore",
      text: "My Sora interviewer was a current Google L5. She grilled me exactly like a real loop — I walked into my actual interview already knowing what to expect.",
    },
    {
      initials: "PM",
      name: "Pooja Mehra",
      role: "SDE-2 @ Amazon — Hyderabad",
      text: "The story-based DP track finally broke through. I'd failed DP interviews 3 times before. The Dragon's Vault arc made it genuinely intuitive.",
    },
    {
      initials: "RS",
      name: "Rohan Sehgal",
      role: "Engineer @ Meta — Remote",
      text: "Coding inside the same window as my interviewer felt like the real thing. No tab switching, no context loss. That alone changed my interview performance.",
    },
  ];

  return (
    <section className="py-22 px-8 bg-transparent" id="success">
      <div className="max-w-[1160px] mx-auto">
        <span className="inline-block text-[11px] font-bold text-zinc-300 uppercase tracking-[0.1em] border border-white/20 px-3 py-1 rounded-full mb-4">
          Success Stories
        </span>
        <h2
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
          className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold text-white mb-12 leading-[1.15] tracking-[-0.02em]"
        >
          Real sessions. Real offers.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <div
              key={r.name}
              className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[12px] hover:border-white/20 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
            >
              <div className="text-amber-400 text-[13px] mb-3">★★★★★</div>
              <p className="text-[13.5px] text-zinc-300 mb-5 leading-[1.7] italic">
                "{r.text}"
              </p>
              <div className="flex items-center gap-[10px]">
                <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[12px] font-bold flex-none bg-white/10 text-zinc-300">
                  {r.initials}
                </div>
                <div>
                  <span className="block font-bold text-[13px] text-white">{r.name}</span>
                  <span className="block text-[11.5px] text-zinc-400">{r.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ──────────────────────────────────────────────────────────────
function FinalCTA() {
  const navigate = useNavigate();
  return (
    <section className="py-20 px-8 text-center border-t border-white/10">
      <div className="max-w-[560px] mx-auto">
        <h2
          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
          className="text-[clamp(1.8rem,3.5vw,2.4rem)] font-extrabold text-white mb-3 tracking-[-0.02em]"
        >
          Your first real interview is one click away.
        </h2>
        <p className="text-zinc-300 mb-8 text-[15px]">
          Join engineers who practice with the real thing — not approximations of it.
        </p>
        <button 
          onClick={() => navigate('/signup')}
          className="bg-white text-zinc-900 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 border-none px-9 py-[14px] rounded-[12px] text-[16px] font-bold hover:bg-zinc-300 transition-all duration-200 cursor-pointer"
        >
          Get Early Access — Free →
        </button>
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    { title: "Learn", links: ["Story Library", "Topic Tracks", "OA Board", "Cheat Sheets"] },
    { title: "Interview", links: ["Book a Session", "Find Engineers", "Mock Rounds", "Feedback Reports"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
  ];

  return (
    <footer className="bg-transparent border-t border-white/10/50 px-8 pt-12 pb-6">
      <div className="max-w-[1160px] mx-auto flex gap-12 mb-8 flex-wrap">
        <div className="flex-1 min-w-[180px]">
          <div
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
            className="text-[1.2rem] font-extrabold text-white"
          >
            Sora
          </div>
          <p className="text-[13px] text-zinc-300 mt-[0.6rem] max-w-[200px] leading-[1.6]">
            Where great engineers are made.
          </p>
        </div>
        <div className="flex gap-10 flex-wrap">
          {cols.map((col) => (
            <div key={col.title} className="flex flex-col gap-[0.4rem]">
              <h4 className="text-[12px] font-bold uppercase tracking-[0.07em] text-white mb-1">
                {col.title}
              </h4>
              {col.links.map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-[13px] text-zinc-300 no-underline hover:text-zinc-300 transition-colors duration-200"
                >
                  {l}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-[1160px] mx-auto pt-6 border-t border-white/10 flex justify-between text-[12px] text-zinc-300 flex-wrap gap-2">
        <span>© 2026 Sora. All rights reserved.</span>
      </div>
    </footer>
  );
}

// ── Global CSS (keyframes only — Tailwind can't generate these) ────────────
const globalStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

  @keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(-50%); }
    50% { transform: translateY(calc(-50% - 14px)); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .py-22 { padding-top: 5.5rem; padding-bottom: 5.5rem; }
`;

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <style>{globalStyles}</style>
      <div className="bg-transparent text-white font-sans overflow-x-hidden">
        <Navbar />
        <main>
          <Hero />
          <CompanyMarquee />
          <Features />
          <RemoveSection />
          <Upcoming />
          <Testimonials />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </>
  );
}