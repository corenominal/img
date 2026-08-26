import type { Size } from '../viewport/viewportTypes';

// A single slider gesture's delta, in the range -100..100 — same
// relative/delta convention as AdjustmentOperation.ts/GammaOperation.ts/
// etc.: committing a second black point gesture stacks another delta
// rather than replacing the first.
export interface BlackPointOperation {
  type: 'blackPoint';
  value: number;
}

export function blackPointSize(size: Size): Size {
  return size;
}

// -100..100 maps to a ±120 (of 255) shift of the input level that maps to
// output black. A positive value crushes shadows: inputs below the shift
// clip to 0 and the remaining range is stretched to fill 0..255, raising
// contrast. A negative value lifts blacks instead: 0 no longer maps to
// output 0, giving shadows a faded, washed-out look and lowering contrast.
// Either way, input 255 always maps back to output 255 — this operation
// only moves the black end of the tonal range, mirroring the fixed white
// end that WhitePointOperation.ts (once it exists) will move instead.
const MAX_BLACK_POINT_SHIFT = 120;

// No CSS `filter` performs this per-channel endpoint remap, so this
// operates on raw pixel data — see flattenOperations.ts. Writes to a
// Uint8ClampedArray clamp to 0..255 automatically (handling both the
// negative-value clip and the positive-value overshoot at existing
// highlights).
export function applyBlackPoint(
  context: CanvasRenderingContext2D,
  size: Size,
  operation: BlackPointOperation,
): void {
  if (operation.value === 0) {
    return;
  }
  const shift = (operation.value / 100) * MAX_BLACK_POINT_SHIFT;
  const scale = 255 / (255 - shift);
  const imageData = context.getImageData(0, 0, size.width, size.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = (data[i]! - shift) * scale;
    data[i + 1] = (data[i + 1]! - shift) * scale;
    data[i + 2] = (data[i + 2]! - shift) * scale;
    // alpha (data[i + 3]) is left untouched.
  }
  context.putImageData(imageData, 0, 0);
}
