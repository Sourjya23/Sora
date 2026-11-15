import { SORA_SITE_METADATA } from '../data/soraContent';

export function LoopingVideoBackground() {
  return (
    <video
      src={SORA_SITE_METADATA.heroVideoUrl}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      data-testid="hero-video-layer"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
    />
  );
}
