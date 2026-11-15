import { useEffect, useRef, useState } from 'react';
import {
  FOOTER_MEDIA,
  NAV_ITEMS,
  NavSectionKey,
  SORA_SITE_METADATA,
} from '../data/soraContent';
import {
  CLIP_HEIGHT,
  CLIP_WIDTH,
  computeDotRadiusScale,
  computeGlintCount,
  CRT_LAST_LIGHT_CLIP_POINT,
  CRT_SCREEN_CLIP_RECT,
  easeInOutCubic,
  evalQuadraticBezier,
  mapVideoCoverPoint,
  mapVideoCoverRect,
  Point2D,
} from '../utils/footerScene';

type FooterPowerMode = 'idle-initial' | 'turning-on' | 'online' | 'turning-off' | 'offline';

interface CinematicFooterProps {
  onNavigateSection: (section: NavSectionKey) => void;
}

interface GlintSeed {
  xRatio: number;
  yRatio: number;
  phase: number;
  speed: number;
  size: number;
}

const GLINT_SEEDS: GlintSeed[] = Array.from({ length: 22 }, (_, i) => ({
  xRatio: ((i * 37 + 13) % 92) / 100 + 0.04,
  yRatio: ((i * 23 + 7) % 36) / 100 + 0.03,
  phase: i * 1.17,
  speed: 1.4 + (i % 5) * 0.35,
  size: 2.2 + (i % 3) * 1.1,
}));

export function CinematicFooter({
  onNavigateSection,
}: CinematicFooterProps) {
  const footerRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const phoneSkyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const powerORef = useRef<HTMLSpanElement | null>(null);

  const modeRef = useRef<FooterPowerMode>('idle-initial');
  const dotFlightStartRef = useRef<number | null>(null);
  const litStartRef = useRef<number | null>(null);

  const [mode, setMode] = useState<FooterPowerMode>('idle-initial');
  const [arrived, setArrived] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 760 : false
  );
  const [use720Clip, setUse720Clip] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 900 : false
  );
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  const syncMode = (next: FooterPowerMode) => {
    modeRef.current = next;
    setMode(next);
  };

  useEffect(() => {
    const updateViewportFlags = () => {
      setIsMobile(window.innerWidth <= 760);
      setUse720Clip(window.innerWidth <= 900);
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => setReducedMotion(motionQuery.matches);

    updateViewportFlags();
    window.addEventListener('resize', updateViewportFlags);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('resize', updateViewportFlags);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  // Arrival observer at 35% visibility
  useEffect(() => {
    const footerEl = footerRef.current;
    if (!footerEl) return;

    if (reducedMotion) {
      setArrived(true);
      syncMode('online');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            setArrived(true);
            if (modeRef.current === 'idle-initial') {
              const video = videoRef.current;
              if (video) {
                syncMode('turning-on');
                try {
                  video.currentTime = 0.6;
                } catch {
                  // Metadata may still be loading; timeupdate/canplay handler will seek
                }
                const p = video.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
              }
            }
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: [0.35] }
    );

    observer.observe(footerEl);
    return () => observer.disconnect();
  }, [reducedMotion]);

  // Video timeline controller + canvas scanline / glint / dot flight / phone sky loop
  useEffect(() => {
    if (reducedMotion) return;

    const footerEl = footerRef.current;
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    if (!footerEl || !video || !canvas) return;

    let rafId = 0;
    let isDisposed = false;

    const getVideoRectForLayout = (containerW: number, containerH: number) => {
      if (window.innerWidth <= 760) {
        const renderedW = containerW * 1.7;
        const renderedH = renderedW * (CLIP_HEIGHT / CLIP_WIDTH);
        const offsetX = (containerW - renderedW) / 2;
        const offsetY = containerH - renderedH;
        return { renderedW, renderedH, offsetX, offsetY, scale: renderedW / CLIP_WIDTH };
      }
      const scale = Math.max(containerW / CLIP_WIDTH, containerH / CLIP_HEIGHT);
      const renderedW = CLIP_WIDTH * scale;
      const renderedH = CLIP_HEIGHT * scale;
      const offsetX = (containerW - renderedW) / 2;
      const offsetY = containerH - renderedH;
      return { renderedW, renderedH, offsetX, offsetY, scale };
    };

    const drawFourPointStar = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      r: number,
      alpha: number
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      const inner = r * 0.24;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const radius = i % 2 === 0 ? r : inner;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    const renderFrame = (now: number) => {
      if (isDisposed) return;

      const currentMode = modeRef.current;
      const currentTime = video.currentTime || 0;

      // Timeline pause & state transitions
      if (currentMode === 'turning-on' && currentTime >= 2.3) {
        video.pause();
        video.currentTime = 2.3;
        syncMode('online');
      } else if (currentMode === 'turning-off') {
        if (currentTime >= 4.72 && dotFlightStartRef.current === null) {
          dotFlightStartRef.current = now;
        }
        if (video.ended || currentTime >= 4.96) {
          video.pause();
          syncMode('offline');
        }
      }

      // Halo --lit animation over 0.9s after dot lands
      if (litStartRef.current !== null) {
        const litElapsed = (now - litStartRef.current) / 900;
        if (litElapsed >= 1) {
          footerEl.style.setProperty('--lit', '0');
          litStartRef.current = null;
        } else {
          const litValue = Math.max(0, 0.9 * (1 - litElapsed));
          footerEl.style.setProperty('--lit', litValue.toFixed(3));
        }
      }

      // Update phone sky canvas (blurred top rows of video)
      const skyCanvas = phoneSkyCanvasRef.current;
      if (skyCanvas && window.innerWidth <= 760 && video.readyState >= 2) {
        const sw = skyCanvas.clientWidth;
        const sh = skyCanvas.clientHeight;
        if (sw > 0 && sh > 0) {
          if (skyCanvas.width !== sw || skyCanvas.height !== sh) {
            skyCanvas.width = sw;
            skyCanvas.height = sh;
          }
          const skyCtx = skyCanvas.getContext('2d');
          if (skyCtx) {
            skyCtx.save();
            skyCtx.filter = 'blur(18px)';
            const srcH = Math.max(24, Math.floor((video.videoHeight || 720) * 0.18));
            skyCtx.drawImage(
              video,
              0,
              0,
              video.videoWidth || 1280,
              srcH,
              -24,
              -24,
              sw + 48,
              sh + 48
            );
            skyCtx.restore();
          }
        }
      }

      // Resize overlay canvas to match footer
      const rect = footerEl.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(1, Math.round(rect.width * dpr));
      const targetH = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, rect.width, rect.height);

        // 1. Sky glints (10 in day -> 22 at night)
        const glintCount = computeGlintCount(currentTime);
        const seconds = now / 1000;
        for (let i = 0; i < glintCount; i++) {
          const seed = GLINT_SEEDS[i];
          const twinkle = 0.5 + 0.5 * Math.sin(seconds * seed.speed + seed.phase);
          const alpha = 0.15 + twinkle * 0.65;
          drawFourPointStar(
            ctx,
            seed.xRatio * rect.width,
            seed.yRatio * rect.height,
            seed.size * (0.85 + twinkle * 0.35),
            alpha
          );
        }

        // 2. CRT scanline sweep while online (every ~1.8s)
        if (currentMode === 'online' || (currentMode === 'turning-on' && currentTime >= 1.7)) {
          const layout = getVideoRectForLayout(rect.width, rect.height);
          const screenRect =
            window.innerWidth <= 760
              ? {
                  x: layout.offsetX + CRT_SCREEN_CLIP_RECT.x1 * layout.scale,
                  y: layout.offsetY + CRT_SCREEN_CLIP_RECT.y1 * layout.scale,
                  width: (CRT_SCREEN_CLIP_RECT.x2 - CRT_SCREEN_CLIP_RECT.x1) * layout.scale,
                  height: (CRT_SCREEN_CLIP_RECT.y2 - CRT_SCREEN_CLIP_RECT.y1) * layout.scale,
                }
              : mapVideoCoverRect(
                  CRT_SCREEN_CLIP_RECT.x1,
                  CRT_SCREEN_CLIP_RECT.y1,
                  CRT_SCREEN_CLIP_RECT.x2,
                  CRT_SCREEN_CLIP_RECT.y2,
                  rect.width,
                  rect.height
                );

          if (screenRect.width > 0 && screenRect.height > 0) {
            const bandHeight = 52;
            const cycle = ((now % 1800) / 1800);
            const bandY = screenRect.y - bandHeight + cycle * (screenRect.height + bandHeight * 2);
            const flicker = 0.85 + 0.15 * Math.sin(now * 0.045);

            ctx.save();
            ctx.beginPath();
            ctx.rect(screenRect.x, screenRect.y, screenRect.width, screenRect.height);
            ctx.clip();

            const grad = ctx.createLinearGradient(0, bandY, 0, bandY + bandHeight);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            grad.addColorStop(0.5, `rgba(255, 255, 255, ${(0.1 * flicker).toFixed(3)})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(screenRect.x, bandY, screenRect.width, bandHeight);
            ctx.restore();
          }
        }

        // 3. Glowing dot flight from CRT (945, 594) to power-o center over 0.78s
        if (dotFlightStartRef.current !== null && powerORef.current) {
          const rawProgress = (now - dotFlightStartRef.current) / 780;
          if (rawProgress >= 1) {
            dotFlightStartRef.current = null;
            litStartRef.current = now;
            footerEl.style.setProperty('--lit', '0.9');
          } else {
            const eased = easeInOutCubic(rawProgress);
            const layout = getVideoRectForLayout(rect.width, rect.height);
            const p0: Point2D =
              window.innerWidth <= 760
                ? {
                    x: layout.offsetX + CRT_LAST_LIGHT_CLIP_POINT.x * layout.scale,
                    y: layout.offsetY + CRT_LAST_LIGHT_CLIP_POINT.y * layout.scale,
                  }
                : mapVideoCoverPoint(
                    CRT_LAST_LIGHT_CLIP_POINT.x,
                    CRT_LAST_LIGHT_CLIP_POINT.y,
                    rect.width,
                    rect.height
                  );

            const powerRect = powerORef.current.getBoundingClientRect();
            const p2: Point2D = {
              x: powerRect.left - rect.left + powerRect.width / 2,
              y: powerRect.top - rect.top + powerRect.height / 2,
            };

            const p1: Point2D = {
              x: p0.x * 0.58 + p2.x * 0.42 - Math.min(160, rect.width * 0.11),
              y: Math.min(p0.y, p2.y) - Math.min(120, rect.height * 0.12),
            };

            const pos = evalQuadraticBezier(p0, p1, p2, eased);
            const radiusScale = computeDotRadiusScale(rawProgress);
            const coreRadius = 3.8 * radiusScale;
            const haloRadius = coreRadius * 6;

            const haloGrad = ctx.createRadialGradient(
              pos.x,
              pos.y,
              coreRadius * 0.25,
              pos.x,
              pos.y,
              haloRadius
            );
            haloGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
            haloGrad.addColorStop(0.28, 'rgba(255, 255, 255, 0.55)');
            haloGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = haloGrad;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, haloRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, coreRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    const handleLoadedMetadata = () => {
      if (modeRef.current === 'turning-on' && video.currentTime < 0.55) {
        video.currentTime = 0.6;
        const p = video.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(rafId);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [reducedMotion]);

  const handleTogglePower = () => {
    const current = modeRef.current;

    // Clicks during switch-off are ignored
    if (current === 'turning-off') return;

    if (reducedMotion) {
      const next = current === 'offline' ? 'online' : 'offline';
      syncMode(next);
      if (footerRef.current) {
        footerRef.current.style.setProperty('--lit', next === 'offline' ? '0.6' : '0');
      }
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (current === 'online' || current === 'turning-on' || current === 'idle-initial') {
      dotFlightStartRef.current = null;
      litStartRef.current = null;
      if (footerRef.current) {
        footerRef.current.style.setProperty('--lit', '0');
      }
      syncMode('turning-off');
      if (video.currentTime < 2.3) {
        video.currentTime = 2.3;
      }
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else if (current === 'offline') {
      dotFlightStartRef.current = null;
      litStartRef.current = null;
      if (footerRef.current) {
        footerRef.current.style.setProperty('--lit', '0');
      }
      syncMode('turning-on');
      video.currentTime = 0.6;
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  };

  const clipUrl = use720Clip ? FOOTER_MEDIA.clip720 : FOOTER_MEDIA.clip1080;

  return (
    <footer
      ref={footerRef}
      id="footer"
      data-arrived={arrived ? 'true' : 'false'}
      data-power-mode={mode}
      className="cinematic-footer"
      aria-label="Sora cinematic footer"
    >
      {/* Phone sky canvas behind text */}
      {isMobile && !reducedMotion && (
        <canvas
          ref={phoneSkyCanvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        />
      )}

      {/* Scene video or static poster fallback */}
      {reducedMotion ? (
        <img
          src={FOOTER_MEDIA.poster}
          alt=""
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-bottom"
        />
      ) : (
        <video
          ref={videoRef}
          src={clipUrl}
          poster={FOOTER_MEDIA.poster}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          className={
            isMobile
              ? 'pointer-events-none absolute bottom-0 left-1/2 z-[1] aspect-video w-[170%] max-w-none -translate-x-1/2 object-cover'
              : 'pointer-events-none absolute inset-0 z-[1] h-full w-full object-cover object-bottom'
          }
          style={
            isMobile
              ? {
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 22%)',
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 22%)',
                }
              : undefined
          }
        />
      )}

      {/* Top atmospheric gradient bridge blending #0b1320 into the footer sky */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            'linear-gradient(to bottom, #0b1320 0%, rgba(11, 19, 32, 0.72) 14%, rgba(12, 14, 18, 0.34) 28%, rgba(12, 14, 18, 0) 42%)',
        }}
      />

      {/* Code overlay canvas: sky glints, CRT scanline shimmer, glowing dot trajectory */}
      <canvas
        ref={overlayCanvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[15] h-full w-full"
      />

      {/* Footer Content Grid */}
      <div className="cinematic-footer-grid">
        {/* Brand column */}
        <div className="cinematic-footer-brand">
          <div className="footer-rise" style={{ ['--rise-delay' as string]: '0ms' }}>
            <button
              type="button"
              onClick={handleTogglePower}
              aria-pressed={mode === 'offline'}
              aria-label={
                mode === 'offline'
                  ? 'Power on Sora scene'
                  : 'Power off Sora scene and take screen offline'
              }
              className="power-o-button focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-white"
            >
              <span>S</span>
              <span ref={powerORef} className="power-o-svg-wrap" aria-hidden="true">
                <span className="power-o-halo" />
                <svg
                  viewBox="0 0 50 62"
                  className="h-full w-full overflow-visible"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14.2 22.6 A19 19 0 1 0 35.8 22.6"
                    stroke="currentColor"
                    strokeWidth="4.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M25 6.5 V33"
                    stroke="currentColor"
                    strokeWidth="4.6"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span>ra</span>
            </button>
          </div>

          <p
            className="footer-rise mt-4 text-white/90"
            style={{
              ['--rise-delay' as string]: '60ms',
              fontSize: isMobile ? '0.95rem' : 'calc(19.5 * var(--u))',
              lineHeight: 1.5,
              maxWidth: isMobile ? '18rem' : 'calc(300 * var(--u))',
            }}
          >
            Everything you need before your next Big Tech interview.
          </p>

          <p
            className="footer-rise text-white/70"
            style={{
              ['--rise-delay' as string]: '120ms',
              fontSize: isMobile ? '0.8rem' : 'calc(17 * var(--u))',
              marginTop: isMobile ? '1.25rem' : 'calc(34 * var(--u))',
            }}
          >
            © 2026 {SORA_SITE_METADATA.brandName}, Inc. All rights reserved.
          </p>
        </div>

        {/* Column 2: Platform */}
        <div>
          <h2
            className="footer-rise font-serif font-normal text-white"
            style={{
              ['--rise-delay' as string]: '180ms',
              fontSize: isMobile ? '1.5rem' : 'calc(35 * var(--u))',
              lineHeight: 1.1,
              marginBottom: isMobile ? '1rem' : 'calc(40 * var(--u))',
            }}
          >
            Platform
          </h2>
          <ul
            className="flex flex-col"
            style={{ gap: isMobile ? '0.75rem' : 'calc(19 * var(--u))' }}
          >
            {NAV_ITEMS.map((item, idx) => (
              <li
                key={item.key}
                className="footer-rise"
                style={{ ['--rise-delay' as string]: `${240 + idx * 50}ms` }}
              >
                <a
                  href={`#${item.key}`}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigateSection(item.key);
                  }}
                  className="footer-link"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
