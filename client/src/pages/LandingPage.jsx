import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { question: "How does interview.io work?", answer: "We connect you with peers and expert AI for realistic mock interviews. You can practice coding, system design, and behavioral questions." },
    { question: "Is it really free?", answer: "Yes! Peer-to-peer practice and basic AI interviews are completely free. We also offer premium expert coaching." },
    { question: "What topics are covered?", answer: "You can practice Data Structures, Algorithms, System Design, Behavioral, Product Management, and more." },
    { question: "Who will I interview with?", answer: "You can choose to interview with an AI bot, or match with a peer of similar experience level." },
    { question: "Will my interviews be recorded?", answer: "Yes, you can opt-in to record your sessions so you can review your performance later." },
    { question: "Can I use my own IDE?", answer: "Our platform provides a built-in collaborative code editor that supports over 10 languages." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-violet-200">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white">i</span>
            </div>
            interview.io
          </div>
          <div className="hidden md:flex gap-6 text-sm font-semibold text-slate-500">
            <Link to="/practice" className="hover:text-slate-900 transition-colors">Practice</Link>
            <Link to="/practice" className="hover:text-slate-900 transition-colors">Learn</Link>
            <a href="#" className="hover:text-slate-900 transition-colors">Coaching</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Login</Link>
          <Link to="/signup" className="text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-full transition-colors shadow-lg shadow-violet-200">Sign up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-8 py-24 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8">
          <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
            Practice mock interviews with <span className="text-violet-600">peers and AI</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-lg font-medium">
            Join the community where top engineers practice for their next role. Gain confidence, identify your weak spots, and land your dream job.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/signup" className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-4 rounded-full transition-colors shadow-xl shadow-violet-200 text-lg">
              Sign up for free
            </Link>
            <button className="flex items-center gap-2 text-slate-600 font-bold hover:text-slate-900 px-6 py-4 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              Watch video
            </button>
          </div>
        </div>
        <div className="flex-1 w-full">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-400 rounded-[2.5rem] blur-3xl opacity-20 transform rotate-3"></div>
            <img
              src="/landing_hero.png"
              alt="Interview Interface Mockup"
              className="relative w-full"
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-white py-24 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row gap-16 items-start">
          <div className="flex-1 flex flex-wrap gap-3">
            {["Product Management", "Data Structures & Algorithms", "System Design", "Behavioral", "Front End", "Data Science", "Machine Learning", "Software Engineering"].map(topic => (
              <span key={topic} className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-600 font-semibold text-sm hover:border-violet-300 hover:bg-violet-50 transition-colors cursor-pointer">
                {topic}
              </span>
            ))}
          </div>
          <div className="flex-1 space-y-4">
            <span className="text-violet-600 font-bold uppercase tracking-wider text-sm">Preparation</span>
            <h2 className="text-3xl font-extrabold tracking-tight">How everyone in tech prepares</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              Practicing your speaking and problem solving under pressure is the only way to get better. Get comfortable with the format so you can shine when it counts.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 px-8 max-w-7xl mx-auto text-center">
        <span className="text-violet-600 font-bold uppercase tracking-wider text-sm mb-4 block">Workflow</span>
        <h2 className="text-3xl font-extrabold tracking-tight mb-16">How to schedule a practice session</h2>

        <div className="grid md:grid-cols-3 gap-12 text-left">
          <div className="relative">
            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-bold text-lg mb-6">1</div>
            <h3 className="text-xl font-bold mb-3">Schedule session</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Select a time that works for you. We'll automatically match you with a peer or boot up an AI interviewer.</p>
          </div>
          <div className="relative">
            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-bold text-lg mb-6">2</div>
            <h3 className="text-xl font-bold mb-3">Join session</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Jump into our custom built IDE and video room. No need to install anything, just open your browser and code.</p>
          </div>
          <div className="relative">
            <div className="w-10 h-10 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center font-bold text-lg mb-6">3</div>
            <h3 className="text-xl font-bold mb-3">Exchange feedback</h3>
            <p className="text-slate-500 font-medium leading-relaxed">After the interview, provide and receive actionable, anonymous feedback to help you improve.</p>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="bg-white py-24 px-8 border-y border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <span className="text-violet-600 font-bold uppercase tracking-wider text-sm">Level up</span>
            <h2 className="text-4xl font-extrabold tracking-tight">Gain confidence and get real results</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-1">✓</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Interview with peers & AI</h4>
                  <p className="text-slate-500 font-medium">Practice with real humans or our incredibly realistic AI interviewer.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-1">✓</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Actionable feedback</h4>
                  <p className="text-slate-500 font-medium">Get a detailed breakdown of your performance, communication, and code quality.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-1">✓</div>
                <div>
                  <h4 className="font-bold text-lg mb-1">Flexible scheduling</h4>
                  <p className="text-slate-500 font-medium">Practice anytime, 24/7. Fits perfectly into your busy schedule.</p>
                </div>
              </div>
            </div>
            <Link to="/signup" className="inline-block bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-4 rounded-full transition-colors shadow-xl shadow-violet-200">
              View all features
            </Link>
          </div>
          <div className="flex-1 w-full">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 rounded-[2.5rem] blur-3xl opacity-10 transform -rotate-3"></div>
              <img
                src="/landing_feature.png"
                alt="Feature Interface"
                className="relative z-10 w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">Testimonials</h2>
            <p className="text-slate-500 font-medium">Don't just take our word for it, see what the community has to say.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Sarah K.", role: "Software Engineer at Google", text: "This platform completely changed how I prepared. The mock interviews felt exactly like the real thing." },
              { name: "Michael T.", role: "Frontend Developer", text: "I was bombing my interviews because of nerves. Doing 10 peer mocks here completely cured my anxiety." },
              { name: "Priya R.", role: "Data Scientist", text: "The feedback I received was incredibly detailed. It helped me identify weaknesses I didn't even know I had." }
            ].map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex gap-1 text-amber-400 mb-6">
                  ★★★★★
                </div>
                <p className="text-slate-600 font-medium mb-8">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center text-violet-600 font-bold text-xl">
                    {t.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{t.name}</h4>
                    <span className="text-xs text-slate-500">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-24 px-8 border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight mb-12 text-center">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden transition-all">
                <button
                  className="w-full text-left px-6 py-5 font-bold flex items-center justify-between hover:bg-slate-50"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.question}
                  <span className={`transform transition-transform text-slate-400 ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-slate-500 font-medium leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-xl text-white">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white">i</span>
            </div>
            interview.io
          </div>
          <div className="text-sm font-medium">
            © {new Date().getFullYear()} interview.io. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
