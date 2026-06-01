import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BrainCircuit, TerminalSquare, Video } from 'lucide-react';

export default function Guidelines() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white bg-transparent pb-20 pt-10 font-sans">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Navigation & Header */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-10 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Back
        </button>

        <div className="text-center mb-20 max-w-3xl mx-auto">
          <div className="inline-block px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider rounded-full mb-6">
            How It Works
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Master the Engineering Loop.
          </h1>
          <p className="text-lg text-zinc-400">
            Sora is built to eliminate the pain of isolated LeetCode grinding. 
            We simulate the actual engineering experience through story-driven AI and live pressure testing.
          </p>
        </div>

        {/* Feature 1: AI Tutor */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
          <div className="order-2 md:order-1">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
              <BrainCircuit className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Learn through Stories, Not LeetCode.</h2>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Tired of boring, abstract algorithms? Search for any topic like <em>Dynamic Programming</em> or <em>React Hooks</em>, and our <strong>Adaptive AI Tutor</strong> generates a unique, story-driven scenario just for you. 
            </p>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                FAANG-calibrated difficulty scaling
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Instant logic and code quality feedback
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Fallback architecture ensures 100% uptime
              </li>
            </ul>
          </div>
          <div className="order-1 md:order-2 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-violet-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <img 
              src="/guidelines_ai_tutor.png" 
              alt="AI Tutor Interface" 
              className="relative rounded-2xl border border-white/10 shadow-2xl shadow-black/50 w-full"
            />
          </div>
        </div>

        {/* Feature 2: Code Compiler */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <img 
              src="/guidelines_compiler.png" 
              alt="Live Compiler Test Cases" 
              className="relative rounded-2xl border border-white/10 shadow-2xl shadow-black/50 w-full"
            />
          </div>
          <div>
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-6">
              <TerminalSquare className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Write, Compile, and Prove.</h2>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Don't just write pseudo-code. Our browser-based IDE features a live <strong>Multi-Tier Execution Engine</strong>. 
              We support over 14 backend languages and modern React rendering right in the browser.
            </p>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                Robust JDoodle, Piston, and Judge0 integration
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                Execute hidden test cases to validate edge cases
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                Graceful fallback system prevents credit-limit crashes
              </li>
            </ul>
          </div>
        </div>

        {/* Feature 3: Live Interviews */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-32">
          <div className="order-2 md:order-1">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center mb-6">
              <Video className="w-6 h-6 text-rose-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Face the Real Pressure.</h2>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Once you're warmed up, book a live 1-on-1 session. Get matched with a verified FAANG engineer and code together in a real-time synchronized environment.
            </p>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                High-quality integrated Video and Audio 
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                Shared real-time Monaco IDE
              </li>
              <li className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                All sessions automatically recorded for playback
              </li>
            </ul>
          </div>
          <div className="order-1 md:order-2 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <img 
              src="/guidelines_interview.png" 
              alt="Live Interview Platform" 
              className="relative rounded-2xl border border-white/10 shadow-2xl shadow-black/50 w-full"
            />
          </div>
        </div>

        {/* Footer CTA */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center max-w-4xl mx-auto backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-4">Ready to test your limits?</h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
            Join thousands of engineers preparing for their next big career leap. 
            Sign up today and get your first AI lesson instantly.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/signup')}
              className="bg-white text-zinc-900 px-8 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 transition-all"
            >
              Get Started Free
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="bg-transparent border border-white/20 text-white px-8 py-3 rounded-xl font-medium hover:bg-white/5 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
