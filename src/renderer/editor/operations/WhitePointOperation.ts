import type { Size } from '../viewport/viewportTypes';

// A single slider gesture's delta, in the range -100..100 — same
// relative/delta convention as AdjustmentOperation.ts/BlackPointOperation.ts/
// etc.: committing a second white point gesture stacks another delta
// rather than replacing the first.
export interface WhitePointOperation {
  type: 'whitePoint';
  value: number;
}

export function whitePointSize(size: Size): Size {
  return size;
}

// Mirror image of BlackPointOperation.ts: -100..100 maps to the same ±120
// (of 255) shift, but applied to the *white* end of the tonal range while
// black (input 0) stays fixed at output 0 — 0 * any scale is still 0. A
// positive value crushes highlights: inputs above the shifted level clip
// to 255 and the range below is stretched to fill it, raising contrast. A
// negative value lifts (fades) the white point instead: input 255 no
// longer reaches output 255, giving highlights a washed-out look and
// lowering contrast.
const MAX_WHITE_POINT_SHIFT = 120;

// No CSS `filter` performs this per-channel endpoint remap, so this
// operates on raw pixel data — see flattenOperations.ts. Writes to a
// Uint8ClampedArray clamp to 0..255 automatically (handling the
// positive-value clip at existing highlights).
export function applyWhitePoint(
  context: CanvasRenderingContext2D,
  size: Size,
  operation: WhitePointOperation,
): void {
  if (operation.value === 0) {
    return;
  }
  const shift = (operation.value / 100) * MAX_WHITE_POINT_SHIFT;
  const scale = 255 / (255 - shift);
  const imageData = context.getImageData(0, 0, size.width, size.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i]! * scale;
    data[i + 1] = data[i + 1]! * scale;
    data[i + 2] = data[i + 2]! * scale;
    // alpha (data[i + 3]) is left untouched.
  }
  context.putImageData(imageData, 0, 0);
}
