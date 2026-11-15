import React, { memo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type Logo = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

type InfiniteSliderProps = {
  children: React.ReactNode;
  gap?: number;
  duration?: number;
  durationOnHover?: number;
  direction?: "horizontal" | "vertical";
  reverse?: boolean;
  className?: string;
};

export const InfiniteSlider = memo(function InfiniteSlider({
  children,
  gap = 16,
  duration = 25,
  durationOnHover,
  direction = "horizontal",
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const posRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let animId: number;

    const animate = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const delta = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      const el = containerRef.current;
      if (el) {
        const isHoriz = direction === "horizontal";
        const contentSize = (isHoriz ? el.scrollWidth : el.scrollHeight) / 2;

        if (contentSize > 0) {
          const currentDuration = isHovered && durationOnHover ? durationOnHover : duration;
          const speed = contentSize / currentDuration;

          if (reverse) {
            posRef.current += speed * delta;
            if (posRef.current >= 0) {
              posRef.current = -contentSize;
            }
          } else {
            posRef.current -= speed * delta;
            if (posRef.current <= -contentSize) {
              posRef.current = 0;
            }
          }

          if (isHoriz) {
            el.style.transform = `translate3d(${posRef.current}px, 0, 0)`;
          } else {
            el.style.transform = `translate3d(0, ${posRef.current}px, 0)`;
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [direction, duration, durationOnHover, isHovered, reverse]);

  return (
    <div
      className={cn("overflow-hidden select-none", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={containerRef}
        className="flex w-max will-change-transform items-center"
        style={{
          gap: `${gap}px`,
          flexDirection: direction === "horizontal" ? "row" : "column",
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
});

export const LogoImage = memo(function LogoImage({ logo }: { logo: Logo }) {
  return (
    <div className="flex items-center justify-center px-3 py-1">
      <img
        alt={logo.alt}
        src={logo.src}
        width={logo.width ?? "auto"}
        height={logo.height ?? "auto"}
        loading="lazy"
        className="pointer-events-none h-4.5 md:h-5 max-w-[110px] select-none object-contain brightness-0 invert opacity-65 hover:opacity-100 transition-opacity duration-200"
      />
    </div>
  );
});

export const LogoMarquee = memo(function LogoMarquee({
  logos,
  className,
}: {
  logos: Logo[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-7xl mx-auto overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
        className
      )}
    >
      <InfiniteSlider gap={42} reverse duration={65} durationOnHover={25}>
        {[...logos, ...logos].map((logo, i) => (
          <LogoImage key={`${logo.alt}-${i}`} logo={logo} />
        ))}
      </InfiniteSlider>
    </div>
  );
});

LogoMarquee.displayName = "LogoMarquee";
export default LogoMarquee;
