import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SORA_SITE_METADATA } from '../data/soraContent';

export function HeroSection() {
  return (
    <main
      id="home"
      className="relative z-10 flex min-h-screen flex-col items-center justify-between px-6 pt-28 pb-16 text-center sm:pt-36 sm:pb-20"
    >
      <div className="flex flex-col items-center">
        <h1
          className="animate-fade-rise max-w-7xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-white sm:text-7xl md:text-8xl mt-12"
          style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            textWrap: 'balance',
          }}
        >
          Interview with engineers from{' '}
          <em className="not-italic text-zinc-400">Google,</em>{' '}
          <em className="not-italic text-zinc-400">not bots.</em>
        </h1>

        <p className="animate-fade-rise-delay mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 sm:mt-8 sm:text-lg">
          {SORA_SITE_METADATA.description}
        </p>
      </div>

      <div className="animate-fade-rise-delay-2 mt-28 sm:mt-36 flex flex-col items-center gap-4">
        <Link
          to="/login"
          className="inline-flex shrink-0 cursor-pointer items-center gap-2.5 whitespace-nowrap rounded-full bg-white px-12 py-4.5 text-base font-semibold text-[#0A0A0A] shadow-[0_12px_36px_rgba(0,0,0,0.45)] transition-transform duration-200 hover:scale-[1.03] hover:bg-white/95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:px-14 sm:py-5"
        >
          <span>Begin Journey</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
