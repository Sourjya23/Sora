import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Play, ExternalLink } from 'lucide-react';
import { LogoMarquee, Logo } from '@/components/ui/logo-marquee';
import {
  CodeSnippetLanguage,
  FRICTION_REMOVED,
  HERO_METRICS,
  LIVE_EDITOR_SNIPPETS,
  PARTNER_COMPANIES,
  SIMULATOR_PROBES,
  SimulatorProbeStep,
} from '../data/soraContent';

const PARTNER_LOGOS: Logo[] = [
  { src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/google.svg", alt: "Google" },
  { src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/meta.svg", alt: "Meta" },
  { src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/amazon.svg", alt: "Amazon" },
  { src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/apple.svg", alt: "Apple" },
  { src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/microsoft.svg", alt: "Microsoft" },
  { src: "https://cdn.21st.dev/assets/mirror/bd/bdf5f3ae72bcfda892a686c03b7932985c694e9a9828643c980601bbc9e53cb4.svg", alt: "Nvidia" },
  { src: "https://cdn.21st.dev/assets/mirror/2b/2bcdd4124223e3bf8e66bc08ce0ac32a6cc42ffe3584bbecfd377847176a188d.svg", alt: "OpenAI" },
  { src: "https://cdn.21st.dev/assets/mirror/e8/e8514b1206f79e1abdafcc1d2632393cc7cfbcbbe25426ac5143b17b184b56b8.svg", alt: "Claude" },
  { src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/netflix.svg", alt: "Netflix" },
  { src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/stripe.svg", alt: "Stripe" },
  { src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/uber.svg", alt: "Uber" },
  { src: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/airbnb.svg", alt: "Airbnb" },
  { src: "https://cdn.21st.dev/assets/mirror/56/5624b7c243ac8d60e848fb5ea222ec932c1600df54a2762238b37498372fb0c8.svg", alt: "Vercel" },
  { src: "https://cdn.21st.dev/assets/mirror/90/90f01a9537335666282ae5acc80bd4305f86d085a92d60904c3aa3ccc4414570.svg", alt: "GitHub" },
  { src: "https://cdn.21st.dev/assets/mirror/31/319eeae853dd1af99d442b6c16b6c38dc52a66a719f8e502c65f85d26255cbd3.svg", alt: "Supabase" },
  { src: "https://cdn.21st.dev/assets/mirror/96/96517bce3574d648280ff639d01d9889f354b488b3f826db5df746d730232a0c.svg", alt: "Clerk" },
  { src: "https://cdn.21st.dev/assets/mirror/fc/fc7b090ebcfc468d24a1dc482b2db1fcbfd99ca14568552a30ce553d6dda7fcb.svg", alt: "Turso" },
];

interface FeaturesSectionProps {
  selectedLang: CodeSnippetLanguage['id'];
  onSelectLang: (lang: CodeSnippetLanguage['id']) => void;
  activeProbeId: SimulatorProbeStep['id'];
  onSelectProbe: (probeId: SimulatorProbeStep['id']) => void;
}

export function FeaturesSection({
  selectedLang,
  onSelectLang,
  activeProbeId,
  onSelectProbe,
}: FeaturesSectionProps) {
  const [checkedProbes, setCheckedProbes] = useState<Record<string, boolean>>({});

  const activeSnippet =
    LIVE_EDITOR_SNIPPETS.find((item) => item.id === selectedLang) ?? LIVE_EDITOR_SNIPPETS[0];
  const activeProbe =
    SIMULATOR_PROBES.find((probe) => probe.id === activeProbeId) ?? SIMULATOR_PROBES[0];

  const codeLines = activeSnippet.code.split('\n');
  const hasRunCheck = Boolean(checkedProbes[`${activeSnippet.id}:${activeProbe.id}`]);

  const handleRunCheck = () => {
    setCheckedProbes((prev) => ({
      ...prev,
      [`${activeSnippet.id}:${activeProbe.id}`]: true,
    }));
  };

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative z-10 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        {/* Proof metrics & engineer companies */}
        <div className="grid grid-cols-2 gap-8 border-b border-white/12 pb-16 sm:grid-cols-4">
          {HERO_METRICS.map((metric) => (
            <div key={metric.label} className="space-y-1.5">
              <p
                className="text-4xl font-normal tracking-tight text-foreground tabular-nums sm:text-5xl"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {metric.value}
              </p>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* Verified Mentors Dynamic Logo Marquee */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/12 py-5 text-xs tracking-wide text-muted-foreground overflow-hidden">
          <span className="font-medium text-foreground shrink-0 pl-1">
            Verified mentors from
          </span>
          <div className="flex-1 min-w-0 overflow-hidden">
            <LogoMarquee logos={PARTNER_LOGOS} className="py-0" />
          </div>
        </div>

        {/* Section Header */}
        <div className="mt-20 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground">Live Interview Simulator</p>
            <h2
              id="features-heading"
              className="mt-3 text-4xl font-normal tracking-tight text-foreground sm:text-6xl"
              style={{
                fontFamily: "'Instrument Serif', serif",
                lineHeight: 1.02,
                letterSpacing: '-0.03em',
                textWrap: 'balance',
              }}
            >
              Built around real loops,{' '}
              <em className="italic text-muted-foreground">not scripted bots.</em>
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Step through a live 60-minute loop inside one shared window — articulate invariants,
            field unscripted edge-case probes, and verify complexity on the spot.
          </p>
        </div>

        {/* Interactive Split-Pane Live Interview Simulator */}
        <div className="mt-14 overflow-hidden rounded-3xl border border-white/12 bg-black/25 backdrop-blur-sm">
          {/* Workspace Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/12 bg-white/[0.02] px-6 py-4 sm:px-8">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Session #418</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Problem: Minimum Window Subarray</span>
              <span aria-hidden="true">·</span>
              <span className="text-foreground">Shared Editor Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Pane: Mentor Transcript & Interactive Probe Steps */}
            <div className="flex flex-col justify-between border-b border-white/12 p-6 sm:p-8 lg:col-span-5 lg:border-r lg:border-b-0">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Interview Progression</p>
                <div
                  className="mt-3 flex flex-col divide-y divide-white/10 border-y border-white/10"
                  role="tablist"
                  aria-label="Live interview probe steps"
                >
                  {SIMULATOR_PROBES.map((probe) => {
                    const active = probe.id === activeProbe.id;
                    return (
                      <button
                        key={probe.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onSelectProbe(probe.id)}
                        className={`flex w-full cursor-pointer items-center justify-between gap-4 py-3.5 text-left transition-colors ${
                          active
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="flex items-baseline gap-3">
                          <span
                            className="text-lg italic text-muted-foreground tabular-nums"
                            style={{ fontFamily: "'Instrument Serif', serif" }}
                          >
                            {probe.step}.
                          </span>
                          <span className={active ? 'text-sm font-medium' : 'text-sm'}>
                            {probe.label}
                          </span>
                        </span>
                        <span
                          className={`h-1.5 w-1.5 rounded-full transition-opacity ${
                            active ? 'bg-white opacity-100' : 'opacity-0'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Interviewer Prompt & Candidate Reply */}
                <div className="mt-6 space-y-4">
                  <div className="border-l-2 border-white/35 pl-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Interviewer (Google L5)
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                      “{activeProbe.interviewerPrompt}”
                    </p>
                  </div>

                  <div className="border-l-2 border-white/12 pl-4">
                    <p className="text-xs font-medium text-muted-foreground">Candidate Response</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {activeProbe.candidateReply}
                    </p>
                  </div>
                </div>
              </div>

              {/* Calibrated Rubric Notes */}
              <div className="mt-8 border-t border-white/12 pt-5">
                <p className="text-xs font-medium text-muted-foreground">Live Calibration Rubric</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {activeProbe.rubricNotes.map((note) => (
                    <div
                      key={note.label}
                      className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5"
                    >
                      <p className="text-[11px] text-muted-foreground">{note.label}</p>
                      <p className="mt-0.5 text-xs font-medium text-foreground">{note.score}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Pane: Multi-Language Shared Editor & Complexity Verification */}
            <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-7">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="tablist"
                    aria-label="Select live interview editor language"
                  >
                    {LIVE_EDITOR_SNIPPETS.map((snippet) => {
                      const active = snippet.id === activeSnippet.id;
                      return (
                        <button
                          key={snippet.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => onSelectLang(snippet.id)}
                          className={`cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? 'bg-white text-[#0A0A0A]'
                              : 'border border-white/15 bg-white/[0.03] text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {snippet.label}
                        </button>
                      );
                    })}
                  </div>

                  <span className="text-xs text-muted-foreground">Synced · 14ms</span>
                </div>

                {/* Code Block with Tabular Line Numbers */}
                <div className="mt-4 overflow-x-auto rounded-2xl border border-white/12 bg-black/45 p-5">
                  <pre className="font-mono text-xs leading-relaxed text-foreground sm:text-[13px]">
                    <code>
                      {codeLines.map((line, index) => (
                        <span key={index} className="flex gap-4">
                          <span
                            aria-hidden="true"
                            className="w-5 shrink-0 select-none text-right text-muted-foreground/45 tabular-nums"
                          >
                            {index + 1}
                          </span>
                          <span className="whitespace-pre">{line}</span>
                        </span>
                      ))}
                    </code>
                  </pre>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Mentor Annotation:</span>{' '}
                  {activeSnippet.annotation.replace('Interviewer note: ', '')}
                </p>
              </div>

              {/* Action Bar & Verification Output */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/12 pt-5">
                <div className="min-w-0 flex-1 text-xs">
                  {hasRunCheck ? (
                    <span className="inline-flex items-center gap-2 font-medium text-foreground">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                      <span>{activeProbe.checkResult}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Run verification against {activeSnippet.label} invariant cases
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to="/practice"
                    className="inline-flex shrink-0 items-center gap-1.5 text-xs text-cyan-300 hover:text-white transition-colors"
                  >
                    <span>Open Live IDE</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <button
                    type="button"
                    onClick={handleRunCheck}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#0A0A0A] transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white shadow-md"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    <span>{hasRunCheck ? 'Verified Invariants' : 'Run Complexity Check'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What Sora Removes — 4-Column Horizontal Hairline Ledger */}
        <div className="mt-24 border-t border-white/12 pt-16">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-muted-foreground">What Sora removes</p>
              <h3
                className="mt-2 text-3xl font-normal tracking-tight text-foreground sm:text-4xl"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                We eliminated the friction.
              </h3>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Traditional prep is fragmented. Sora replaces noise with deliberate, human-guided
              engineering practice.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 divide-y divide-white/12 border-y border-white/12 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            {FRICTION_REMOVED.map((item) => (
              <div key={item.index} className="py-7 sm:px-6 first:sm:pl-0 last:sm:pr-0">
                <div className="flex items-baseline justify-between">
                  <span
                    className="text-xl italic text-muted-foreground tabular-nums"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    {item.index}.
                  </span>
                  <span className="text-xs text-muted-foreground">Removed</span>
                </div>
                <h4
                  className="mt-4 text-2xl font-normal text-foreground"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {item.title}
                </h4>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
