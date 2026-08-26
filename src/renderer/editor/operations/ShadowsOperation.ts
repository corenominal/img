import type { Size } from '../viewport/viewportTypes';
import { relativeLuminance, smoothstep } from './luminance';

// A single slider gesture's delta, in the range -100..100 — same
// relative/delta convention as AdjustmentOperation.ts/ExposureOperation.ts/
// HighlightsOperation.ts: committing a second shadows gesture stacks
// another delta rather than replacing the first.
export interface ShadowsOperation {
  type: 'shadows';
  value: number;
}

export function shadowsSize(size: Size): Size {
  return size;
}

// Mirror image of the highlight weight in HighlightsOperation.ts: 1 at
// pure black, ramping smoothly down to 0 at mid-gray and above. Midtones
// and highlights are unaffected (weight 0); only the lower half of the
// tonal range is, and only partially except right at black.
function shadowWeight(luminance: number): number {
  return 1 - smoothstep(0, 0.5, luminance);
}

// Unlike exposure/highlights (a multiplier), shadows use an additive
// offset: multiplying a near-black pixel by anything leaves it near-black
// (0 * n = 0), so lifting shadow detail toward gray needs to genuinely add
// light, not scale it. +100 adds up to 120 (of 255) at pure black,
// tapering to no change by mid-gray; -100 mirrors that, crushing shadows
// toward black.
const MAX_SHADOW_LIFT = 120;

function shadowsOffset(value: number, luminance: number): number {
  return (value / 100) * shadowWeight(luminance) * MAX_SHADOW_LIFT;
}

// Like exposure/highlights, there is no CSS `filter` equivalent (this
// needs a per-pixel, luminance-dependent adjustment), so this operates on
// raw pixel data — see flattenOperations.ts. Writes to a Uint8ClampedArray
// clamp to 0..255 automatically.
export function applyShadows(
  context: CanvasRenderingContext2D,
  size: Size,
  operation: ShadowsOperation,
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
    const offset = shadowsOffset(operation.value, relativeLuminance(r, g, b));
    data[i] = r + offset;
    data[i + 1] = g + offset;
    data[i + 2] = b + offset;
    // data[i + 3] is alpha — left untouched.
  }
  context.putImageData(imageData, 0, 0);
}
