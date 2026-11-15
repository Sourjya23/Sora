export interface Point2D {
  x: number;
  y: number;
}

export interface Rect2D {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const CLIP_WIDTH = 1920;
export const CLIP_HEIGHT = 1080;

export const CRT_SCREEN_CLIP_RECT = {
  x1: 806,
  y1: 505,
  x2: 1077,
  y2: 724,
} as const;

export const CRT_LAST_LIGHT_CLIP_POINT: Point2D = {
  x: 945,
  y: 594,
};

/**
 * Maps a point from clip coordinates (default 1920x1080) into container pixel coordinates
 * assuming `object-fit: cover` and `object-position: center bottom`.
 */
export function mapVideoCoverPoint(
  clipX: number,
  clipY: number,
  containerW: number,
  containerH: number,
  mediaW = CLIP_WIDTH,
  mediaH = CLIP_HEIGHT
): Point2D {
  if (containerW <= 0 || containerH <= 0 || mediaW <= 0 || mediaH <= 0) {
    return { x: 0, y: 0 };
  }

  const scale = Math.max(containerW / mediaW, containerH / mediaH);
  const renderedW = mediaW * scale;
  const renderedH = mediaH * scale;

  // object-position: center bottom -> x centered, y aligned to bottom
  const offsetX = (containerW - renderedW) / 2;
  const offsetY = containerH - renderedH;

  return {
    x: offsetX + clipX * scale,
    y: offsetY + clipY * scale,
  };
}

export function mapVideoCoverRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  containerW: number,
  containerH: number,
  mediaW = CLIP_WIDTH,
  mediaH = CLIP_HEIGHT
): Rect2D {
  const topLeft = mapVideoCoverPoint(x1, y1, containerW, containerH, mediaW, mediaH);
  const bottomRight = mapVideoCoverPoint(x2, y2, containerW, containerH, mediaW, mediaH);

  return {
    x: topLeft.x,
    y: topLeft.y,
    width: Math.max(0, bottomRight.x - topLeft.x),
    height: Math.max(0, bottomRight.y - topLeft.y),
  };
}

export function easeInOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

export function evalQuadraticBezier(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  t: number
): Point2D {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

/**
 * Computes the glowing dot's radius multiplier along its 0..1 flight progress:
 * starts at 1, swells mid-flight, and shrinks cleanly as it lands in the power-o.
 */
export function computeDotRadiusScale(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const arc = Math.sin(clamped * Math.PI);
  return 0.75 + arc * 1.15;
}

/**
 * Sky glint count grows from ~10 during day/idle (t <= 2.7s) to ~22 as night settles (t >= 4.4s).
 */
export function computeGlintCount(clipTime: number): number {
  if (!Number.isFinite(clipTime) || clipTime <= 2.7) {
    return 10;
  }
  if (clipTime >= 4.4) {
    return 22;
  }
  const progress = (clipTime - 2.7) / (4.4 - 2.7);
  return Math.round(10 + progress * 12);
}
