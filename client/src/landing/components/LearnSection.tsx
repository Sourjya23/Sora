import { ArrowRight } from 'lucide-react';
import { STORY_ARCS } from '../data/soraContent';

interface LearnSectionProps {
  selectedArcId: string;
  onSelectArc: (arcId: string) => void;
  onPracticeArc: (arcTitle: string) => void;
}

export function LearnSection({ selectedArcId, onSelectArc, onPracticeArc }: LearnSectionProps) {
  const activeArc = STORY_ARCS.find((arc) => arc.id === selectedArcId) ?? STORY_ARCS[0];

  return (
    <section
      id="learn"
      aria-labelledby="learn-heading"
      className="relative z-10 border-t border-white/10 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground">Learn</p>
            <h2
              id="learn-heading"
              className="mt-3 text-4xl font-normal tracking-tight text-foreground sm:text-6xl"
              style={{
                fontFamily: "'Instrument Serif', serif",
                lineHeight: 1.02,
                letterSpacing: '-0.03em',
                textWrap: 'balance',
              }}
            >
              Story-driven, <em className="italic text-muted-foreground">topic-wise</em> problem
              sets.
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Every problem lives inside a narrative world. Share your weak areas and traverse a
            curated story arc that builds algorithmic intuition instead of rote memorization.
          </p>
        </div>

        {/* Asymmetric 5 / 7 Editorial Split */}
        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
          <div
            className="flex flex-col divide-y divide-white/12 border-y border-white/12 lg:col-span-5"
            role="tablist"
            aria-label="Select story-driven problem arc"
          >
            {STORY_ARCS.map((arc) => {
              const isSelected = arc.id === activeArc.id;
              return (
                <button
                  key={arc.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onSelectArc(arc.id)}
                  className={`relative flex w-full cursor-pointer flex-col gap-2 py-7 pl-5 text-left transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-55 hover:opacity-90'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-6 bottom-6 left-0 w-[2px] transition-opacity ${
                      isSelected ? 'bg-white opacity-100' : 'bg-white/20 opacity-0'
                    }`}
                  />
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-xs text-muted-foreground">
                      {arc.topic} · {arc.difficulty}
                    </span>
                    <span
                      className="text-xl italic text-muted-foreground tabular-nums"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      {arc.index}.
                    </span>
                  </div>
                  <h3
                    className="text-3xl font-normal tracking-tight text-foreground"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    {arc.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{arc.chapter}</p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-white/12 bg-black/25 p-8 backdrop-blur-sm sm:p-10 lg:col-span-7">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/12 pb-5">
                <span className="text-xs font-medium text-muted-foreground">
                  {activeArc.chapter}
                </span>
                <span className="text-xs text-muted-foreground">
                  {activeArc.topic} · {activeArc.difficulty}
                </span>
              </div>

              <h3
                className="mt-7 text-4xl font-normal tracking-tight text-foreground sm:text-5xl"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                {activeArc.title}
              </h3>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {activeArc.summary}
              </p>

              <div className="mt-8 grid grid-cols-1 gap-6 border-t border-white/12 pt-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Session objective</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                    {activeArc.objective}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Target complexity</p>
                  <p className="mt-1.5 font-mono text-xs text-foreground tabular-nums">
                    {activeArc.complexity}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-4 font-mono text-xs">
                <p className="text-muted-foreground">
                  Input: <span className="text-foreground">{activeArc.sampleInput}</span>
                </p>
                <p className="mt-1.5 text-muted-foreground">
                  Expected: <span className="text-foreground">{activeArc.sampleOutput}</span>
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/12 pt-6">
              <span className="text-xs text-muted-foreground">
                Includes live engineer walkthrough
              </span>
              <button
                type="button"
                onClick={() => onPracticeArc(activeArc.title)}
                className="inline-flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-white px-7 py-3 text-sm font-medium text-[#0A0A0A] transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <span>Practice this arc</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
