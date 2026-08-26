import type { Size } from '../viewport/viewportTypes';
import { relativeLuminance, smoothstep } from './luminance';

// A single slider gesture's delta, in the range -100..100 — same
// relative/delta convention as AdjustmentOperation.ts/ExposureOperation.ts:
// committing a second highlights gesture stacks another delta rather than
// replacing the first.
export interface HighlightsOperation {
  type: 'highlights';
  value: number;
}

export function highlightsSize(size: Size): Size {
  return size;
}

// How much a pixel counts as a "highlight", 0..1: 0 at or below mid-gray,
// ramping smoothly up to 1 at pure white. Shadows and midtones are
// unaffected (weight 0); only the upper half of the tonal range is, and
// only partially except right at white.
function highlightWeight(luminance: number): number {
  return smoothstep(0.5, 1, luminance);
}

// value/100 scales the effect, weighted by how much of a highlight the
// pixel is: +100 doubles brightness at pure white, tapering to no change
// by mid-gray; -100 mirrors that down to black at pure white ("recovering"
// blown highlights), same taper. Values below the midpoint are always
// left untouched, regardless of value.
function highlightsMultiplier(value: number, luminance: number): number {
  return 1 + (value / 100) * highlightWeight(luminance);
}

// Like exposure, there is no CSS `filter` equivalent (this needs a
// per-pixel, luminance-dependent multiplier, not a flat one), so this
// operates on raw pixel data — see flattenOperations.ts. Writes to a
// Uint8ClampedArray clamp to 0..255 automatically.
export function applyHighlights(
  context: CanvasRenderingContext2D,
  size: Size,
  operation: HighlightsOperation,
): void {
  if (operation.value === 0) {
    return;
  }
  const imageData = context.getImageData(0, 0, size.width, size.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const multiplier = highlightsMultiplier(operation.value, relativeLuminance(r, g, b));
    data[i] = r * multiplier;
    data[i + 1] = g * multiplier;
    data[i + 2] = b * multiplier;
    // data[i + 3] is alpha — left untouched.
  }
  context.putImageData(imageData, 0, 0);
}
