import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassFold } from './components/ui/GlassFold';
import { CinematicFooter } from './components/CinematicFooter';
import { FeaturesSection } from './components/FeaturesSection';
import { HeroSection } from './components/HeroSection';
import { LearnSection } from './components/LearnSection';
import { LoopingVideoBackground } from './components/LoopingVideoBackground';
import { Navbar } from './components/Navbar';
import { StoriesSection } from './components/StoriesSection';
import { UpcomingSection } from './components/UpcomingSection';
import {
  CodeSnippetLanguage,
  LIVE_EDITOR_SNIPPETS,
  NAV_ITEMS,
  NavSectionKey,
  SIMULATOR_PROBES,
  SimulatorProbeStep,
  STORY_ARCS,
} from './data/soraContent';
import { resolveActiveSectionFromScroll } from './utils/sectionNavigation';

export default function LandingView() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<NavSectionKey | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [footerInView, setFooterInView] = useState(false);

  const [selectedLang, setSelectedLang] = useState<CodeSnippetLanguage['id']>(
    LIVE_EDITOR_SNIPPETS[0].id
  );
  const [activeProbeId, setActiveProbeId] = useState<SimulatorProbeStep['id']>(
    SIMULATOR_PROBES[0].id
  );
  const [selectedArcId, setSelectedArcId] = useState<string>(STORY_ARCS[0].id);
  const [quarterFilter, setQuarterFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      const pivotY = window.innerHeight * 0.35;
      const bounds = NAV_ITEMS.map((item) => {
        const el = document.getElementById(item.key);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { id: item.key, top: rect.top, bottom: rect.bottom };
      }).filter((b): b is { id: NavSectionKey; top: number; bottom: number } => Boolean(b));

      setActiveSection(resolveActiveSectionFromScroll(bounds, pivotY));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    const footerEl = document.getElementById('footer');
    const footerObserver = footerEl
      ? new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry) {
              setFooterInView(entry.isIntersecting && entry.intersectionRatio >= 0.25);
            }
          },
          { threshold: [0, 0.25, 0.5] }
        )
      : null;

    if (footerEl && footerObserver) {
      footerObserver.observe(footerEl);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      footerObserver?.disconnect();
    };
  }, []);

  const scrollToSection = (section: NavSectionKey) => {
    setActiveSection(section);
    const target = document.getElementById(section);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSection(null);
  };

  return (
    <div id="top" className="min-h-screen w-full bg-[#041826] text-white">
      <Navbar
        activeSection={activeSection}
        scrolled={scrolled}
        hidden={footerInView}
        onSelectSection={scrollToSection}
        onScrollTop={scrollToTop}
      />

      {/* Fullscreen Hero Viewport with gentle bottom edge feather into middle backdrop */}
      <div className="relative min-h-screen w-full overflow-hidden bg-[#041826]">
        <LoopingVideoBackground />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-36"
          style={{
            background:
              'linear-gradient(180deg, rgba(4, 24, 38, 0) 0%, rgba(4, 24, 38, 0.35) 38%, rgba(4, 24, 38, 0.78) 72%, #041826 100%)',
          }}
        />
        <HeroSection />
      </div>

      {/* Scrollable Middle Sections with sticky GlassFold WebGL backdrop seamlessly blended top & bottom */}
      <div className="relative w-full overflow-x-clip bg-[#041826]">
        <div
          aria-hidden="true"
          className="pointer-events-none sticky top-0 z-0 h-screen w-full overflow-hidden"
        >
          <GlassFold
            color1="#0a4a73"
            color2="#041826"
            color3="#6fc0ef"
            speed={0.45}
            scale={1}
            noise={0.07}
            className="h-full w-full"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 45%, rgba(4, 22, 36, 0.38) 0%, rgba(4, 18, 32, 0.7) 100%)',
            }}
          />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-80 sm:h-96"
          style={{
            background:
              'linear-gradient(180deg, #041826 0%, rgba(4, 24, 38, 0.85) 32%, rgba(4, 24, 38, 0.36) 68%, rgba(4, 24, 38, 0) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[28rem]"
          style={{
            background:
              'linear-gradient(0deg, #0b1320 0%, rgba(11, 19, 32, 0.92) 26%, rgba(11, 19, 32, 0.56) 62%, rgba(11, 19, 32, 0) 100%)',
          }}
        />

        <div className="relative z-10 -mt-[100vh]">
          <FeaturesSection
            selectedLang={selectedLang}
            onSelectLang={setSelectedLang}
            activeProbeId={activeProbeId}
            onSelectProbe={setActiveProbeId}
          />
          <LearnSection
            selectedArcId={selectedArcId}
            onSelectArc={setSelectedArcId}
            onPracticeArc={(arcTitle) => {
              const arc = STORY_ARCS.find((a) => a.title === arcTitle || a.id === selectedArcId);
              const topic = arc ? arc.topic : arcTitle;
              navigate(`/practice?topic=${encodeURIComponent(topic)}`);
            }}
          />
          <UpcomingSection quarterFilter={quarterFilter} onChangeQuarterFilter={setQuarterFilter} />
          <StoriesSection
            companyFilter={companyFilter}
            onChangeCompanyFilter={setCompanyFilter}
          />
        </div>
      </div>

      {/* Cinematic Power-Button Footer */}
      <CinematicFooter
        onNavigateSection={scrollToSection}
      />
    </div>
  );
}
