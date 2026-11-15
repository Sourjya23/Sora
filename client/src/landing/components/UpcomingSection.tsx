import { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { UPCOMING_ROADMAP } from '../data/soraContent';

interface UpcomingSectionProps {
  quarterFilter: string;
  onChangeQuarterFilter: (quarter: string) => void;
}

export function UpcomingSection({
  quarterFilter,
  onChangeQuarterFilter,
}: UpcomingSectionProps) {
  const [followedIds, setFollowedIds] = useState<string[]>([]);

  const toggleFollow = (id: string) => {
    setFollowedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const visibleReleases =
    quarterFilter === 'all'
      ? UPCOMING_ROADMAP
      : UPCOMING_ROADMAP.filter((item) => item.quarter === quarterFilter);

  return (
    <section
      id="upcoming"
      aria-labelledby="upcoming-heading"
      className="relative z-10 border-t border-white/10 px-6 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">Coming soon</p>
            <h2
              id="upcoming-heading"
              className="mt-3 text-4xl font-normal tracking-tight text-foreground sm:text-6xl"
              style={{
                fontFamily: "'Instrument Serif', serif",
                lineHeight: 1.02,
                letterSpacing: '-0.03em',
                textWrap: 'balance',
              }}
            >
              What&apos;s next <em className="italic text-muted-foreground">on Sora.</em>
            </h2>
          </div>

          <div className="flex flex-col items-start gap-4 md:items-end">
            <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-right">
              We build in public alongside our engineering community. Flag the releases you want
              priority beta access to.
            </p>
          </div>
        </div>

        {/* Editorial Timeline Ledger */}
        <div className="mt-14 divide-y divide-white/12 border-y border-white/12">
          {visibleReleases.map((release, idx) => {
            const isFollowing = followedIds.includes(release.id);
            return (
              <article
                key={release.id}
                className="grid grid-cols-1 items-center gap-6 py-8 md:grid-cols-12 md:gap-8"
              >
                <div className="flex items-baseline gap-5 md:col-span-4">
                  <span
                    className="text-2xl italic text-muted-foreground tabular-nums"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    0{idx + 1}.
                  </span>
                  <div>
                    <p className="text-xs font-medium text-foreground tabular-nums">
                      {release.quarter}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{release.summary}</p>
                  </div>
                </div>

                <div className="md:col-span-5">
                  <h3
                    className="text-3xl font-normal tracking-tight text-foreground"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    {release.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {release.detail}
                  </p>
                </div>

                <div className="flex md:col-span-3 md:justify-end">
                  <button
                    type="button"
                    onClick={() => toggleFollow(release.id)}
                    aria-pressed={isFollowing}
                    className={`inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-xs font-medium transition-colors ${
                      isFollowing
                        ? 'bg-white text-[#0A0A0A]'
                        : 'border border-white/20 bg-white/[0.04] text-foreground hover:border-white/40 hover:bg-white/[0.08]'
                    }`}
                  >
                    {isFollowing ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>{isFollowing ? 'Beta updates enabled' : 'Notify me on launch'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
