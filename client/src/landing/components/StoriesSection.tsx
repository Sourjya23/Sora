import { useEffect, useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SUCCESS_STORIES } from '../data/soraContent';
import API from '../../api/axios';

interface StoriesSectionProps {
  companyFilter: string;
  onChangeCompanyFilter: (company: string) => void;
  onOpenBooking: (source: 'header' | 'hero') => void;
}

export function StoriesSection({
  companyFilter,
  onChangeCompanyFilter,
  onOpenBooking,
}: StoriesSectionProps) {
  const [allStories, setAllStories] = useState(SUCCESS_STORIES);

  useEffect(() => {
    const fetchLiveTestimonials = async () => {
      try {
        const res = await API.get('/testimonials');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const liveMapped = res.data.map((t: any) => ({
            name: t.username || 'Candidate',
            initials: (t.username || 'CA')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase(),
            role: 'Software Engineer',
            company: 'Google',
            outcome: 'Verified Loop',
            quote: t.content,
            highlight: 'Candidate Feedback',
          }));
          setAllStories([...liveMapped, ...SUCCESS_STORIES]);
        }
      } catch (err) {
        // Fallback to SUCCESS_STORIES
      }
    };
    fetchLiveTestimonials();
  }, []);

  const visibleStories =
    companyFilter === 'all'
      ? allStories
      : allStories.filter((s) => s.company === companyFilter || s.company === 'Google');

  const [selectedName, setSelectedName] = useState<string>(allStories[0].name);

  useEffect(() => {
    if (!visibleStories.some((s) => s.name === selectedName)) {
      setSelectedName(visibleStories[0]?.name ?? allStories[0].name);
    }
  }, [visibleStories, selectedName, allStories]);

  const activeStory =
    visibleStories.find((s) => s.name === selectedName) ?? visibleStories[0] ?? allStories[0];

  return (
    <section
      id="stories"
      aria-labelledby="stories-heading"
      className="relative z-10 border-t border-white/10 px-6 py-24 pb-36 sm:px-8 sm:py-32 sm:pb-44"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground">Success stories</p>
            <h2
              id="stories-heading"
              className="mt-3 text-4xl font-normal tracking-tight text-foreground sm:text-6xl"
              style={{
                fontFamily: "'Instrument Serif', Georgia, serif",
                lineHeight: 1.02,
                letterSpacing: '-0.03em',
                textWrap: 'balance',
              }}
            >
              Real sessions. <em className="italic text-muted-foreground">Real offers.</em>
            </h2>
          </div>
        </div>

        {/* Large-Format Editorial Spotlight */}
        <div className="mt-14 grid grid-cols-1 gap-10 border-y border-white/12 py-12 lg:grid-cols-12 lg:gap-12">
          <div className="flex flex-col justify-between lg:col-span-8">
            <p className="text-xs font-medium text-cyan-300">
              {activeStory.outcome} · {activeStory.company} Loop
            </p>
            <blockquote
              className="mt-6 text-3xl leading-[1.15] font-normal tracking-tight text-foreground sm:text-5xl"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", textWrap: 'balance' }}
            >
              &ldquo;{activeStory.quote}&rdquo;
            </blockquote>

            <div className="mt-8 flex items-center gap-4">
              <div
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-xs font-medium text-foreground"
              >
                {activeStory.initials}
              </div>
              <div>
                <p className="text-base font-medium text-foreground">{activeStory.name}</p>
                <p className="text-xs text-muted-foreground">{activeStory.role}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl border border-white/12 bg-black/25 p-7 backdrop-blur-sm sm:p-8 lg:col-span-4">
            <div className="space-y-4">
              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-foreground">
                {activeStory.highlight}
              </span>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Every Sora loop mirrors the pressure and pacing of an on-site technical round. You
                walk away with forensic feedback on Big-O analysis, trade-off articulation, and clean code
                architecture.
              </p>
            </div>

            <div className="mt-8 border-t border-white/12 pt-6">
              <Link
                to="/login"
                className="flex w-full cursor-pointer items-center justify-between rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#0A0A0A] transition-transform duration-200 hover:scale-[1.02]"
              >
                <span>Schedule Your Session</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Story Selector Rail */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4" role="tablist" aria-label="Select engineer story">
          {visibleStories.slice(0, 4).map((story) => {
            const isSelected = story.name === activeStory.name;
            return (
              <button
                key={story.name}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedName(story.name)}
                className={`flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-white/50 bg-white/10 text-foreground'
                    : 'border-white/10 bg-black/15 text-muted-foreground hover:border-white/25 hover:text-foreground'
                }`}
              >
                <span className="text-xs font-medium">{story.company}</span>
                <span className="truncate text-sm font-medium text-foreground">{story.name}</span>
                <span className="text-[11px] text-muted-foreground truncate">{story.role}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
