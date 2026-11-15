export function parseCssColorToVec3(input: string): [number, number, number] {
  const trimmed = input.trim();

  if (trimmed.startsWith('#')) {
    const raw = trimmed.slice(1);
    const full =
      raw.length === 3
        ? raw
            .split('')
            .map((c) => c + c)
            .join('')
        : raw.slice(0, 6);

    if (/^[0-9a-fA-F]{6}$/.test(full)) {
      const n = parseInt(full, 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
  }

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*[\d.]+)?\s*\)$/i
  );
  if (rgbMatch) {
    const r = Math.min(255, Math.max(0, Number(rgbMatch[1]))) / 255;
    const g = Math.min(255, Math.max(0, Number(rgbMatch[2]))) / 255;
    const b = Math.min(255, Math.max(0, Number(rgbMatch[3]))) / 255;
    return [r, g, b];
  }

  return [0.016, 0.094, 0.149];
}
