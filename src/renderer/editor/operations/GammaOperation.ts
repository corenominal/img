import type { Size } from '../viewport/viewportTypes';

// A single slider gesture's delta, in the range -100..100 — same
// relative/delta convention as AdjustmentOperation.ts/VibranceOperation.ts/
// etc.: committing a second gamma gesture stacks another delta rather than
// replacing the first.
export interface GammaOperation {
  type: 'gamma';
  value: number;
}

export function gammaSize(size: Size): Size {
  return size;
}

// -100..100 maps exponentially to a gamma exponent of 0.5..2, centred on 1
// (no change) at value 0: a positive value brightens midtones (exponent
// <1), a negative value darkens them (exponent >1) — the conventional
// meaning of "gamma" in photo editors. The mapping is exponential
// (2^(-value/100)) rather than linear so that value=100 and value=-100
// produce exactly reciprocal exponents (0.5 and 2), keeping the control
// symmetric in both directions. Endpoints (0 and 255) are unaffected by
// any exponent, since 0^n = 0 and 1^n = 1 — gamma reshapes the midtones,
// it doesn't move black or white points (see BlackPointOperation.ts/
// WhitePointOperation.ts for that).
const GAMMA_EXPONENT_BASE = 2;

// No CSS `filter` performs a per-channel power-curve remap, so this
// operates on raw pixel data — see flattenOperations.ts. Writes to a
// Uint8ClampedArray clamp to 0..255 automatically.
export function applyGamma(
  context: CanvasRenderingContext2D,
  size: Size,
  operation: GammaOperation,
): void {
  if (operation.value === 0) {
    return;
  }
  const exponent = Math.pow(GAMMA_EXPONENT_BASE, -operation.value / 100);
  const imageData = context.getImageData(0, 0, size.width, size.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 * Math.pow(data[i]! / 255, exponent);
    data[i + 1] = 255 * Math.pow(data[i + 1]! / 255, exponent);
    data[i + 2] = 255 * Math.pow(data[i + 2]! / 255, exponent);
    // alpha (data[i + 3]) is left untouched.
  }
  context.putImageData(imageData, 0, 0);
}
