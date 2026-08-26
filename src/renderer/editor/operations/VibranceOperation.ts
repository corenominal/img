import type { Size } from '../viewport/viewportTypes';

// A single slider gesture's delta, in the range -100..100 — same
// relative/delta convention as AdjustmentOperation.ts/TintOperation.ts/
// etc.: committing a second vibrance gesture stacks another delta rather
// than replacing the first.
export interface VibranceOperation {
  type: 'vibrance';
  value: number;
}

export function vibranceSize(size: Size): Size {
  return size;
}

// Unlike the flat `saturate()` CSS filter behind AdjustmentOperation.ts's
// `saturation`, vibrance weights its effect by each pixel's *current*
// saturation: a pixel that is already vivid (max-channel/min-channel far
// apart) barely moves, while a muted pixel gets the full boost. This is
// what distinguishes vibrance from plain saturation — it avoids clipping
// already-saturated colours and, incidentally, is gentler on skin tones
// (typically low-to-mid saturation) than a flat saturation increase would
// be. A negative value desaturates with the same weighting, so already-grey
// pixels stay put while colourful-but-muted ones lose colour first.
//
// No CSS `filter` offers this per-pixel, saturation-dependent weighting, so
// this operates on raw pixel data — see flattenOperations.ts. Writes to a
// Uint8ClampedArray clamp to 0..255 automatically.
export function applyVibrance(
  context: CanvasRenderingContext2D,
  size: Size,
  operation: VibranceOperation,
): void {
  if (operation.value === 0) {
    return;
  }
  const amount = operation.value / 100;
  const imageData = context.getImageData(0, 0, size.width, size.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const weight = amount * (1 - saturation);
    const avg = (r + g + b) / 3;
    data[i] = r + (r - avg) * weight;
    data[i + 1] = g + (g - avg) * weight;
    data[i + 2] = b + (b - avg) * weight;
    // alpha (data[i + 3]) is left untouched.
  }
  context.putImageData(imageData, 0, 0);
}
