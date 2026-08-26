import type { Size } from '../viewport/viewportTypes';

// A single slider gesture's delta, in the range -100..100 — same
// relative/delta convention as AdjustmentOperation.ts (brightness/
// contrast/saturation): committing a second exposure gesture stacks
// another delta rather than replacing the first.
export interface ExposureOperation {
  type: 'exposure';
  value: number;
}

export function exposureSize(size: Size): Size {
  return size;
}

// -100..100 maps to -2..+2 stops. Each stop doubles/halves the light,
// matching photographic exposure semantics — unlike brightness (a flat
// linear multiplier), exposure is exponential.
function exposureMultiplier(value: number): number {
  const stops = (value / 100) * 2;
  return Math.pow(2, stops);
}

// Unlike brightness/contrast/saturation, there is no CSS `filter`
// equivalent to exposure, so this operates on raw pixel data instead —
// see flattenOperations.ts for how this fits into the per-operation-canvas
// render pipeline (the source is drawn first, then these pixels are read
// back and rewritten in place). Writes to a Uint8ClampedArray clamp to
// 0..255 automatically, so no manual clamping is needed here.
export function applyExposure(
  context: CanvasRenderingContext2D,
  size: Size,
  operation: ExposureOperation,
): void {
  const multiplier = exposureMultiplier(operation.value);
  if (multiplier === 1) {
    return;
  }
  const imageData = context.getImageData(0, 0, size.width, size.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i]! * multiplier;
    data[i + 1] = data[i + 1]! * multiplier;
    data[i + 2] = data[i + 2]! * multiplier;
    // data[i + 3] is alpha — left untouched.
  }
  context.putImageData(imageData, 0, 0);
}
