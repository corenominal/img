import type { Size } from '../viewport/viewportTypes';

// A single slider gesture's delta, in the range -100..100 — same
// relative/delta convention as AdjustmentOperation.ts/TemperatureOperation.ts/
// etc.: committing a second tint gesture stacks another delta rather than
// replacing the first.
export interface TintOperation {
  type: 'tint';
  value: number;
}

export function tintSize(size: Size): Size {
  return size;
}

// -100..100 maps to a ±60 (of 255) shift along the green-magenta axis —
// tint's counterpart to temperature's blue-orange axis (see
// TemperatureOperation.ts). Positive shifts toward magenta (green down,
// red/blue up); negative shifts toward green (green up, red/blue down).
// Red and blue each move by half of green's shift in the opposite
// direction, so the three channels' total stays constant — like
// temperature, this is a simple additive model, not a fully
// luminance-corrected one, but it keeps the tint shift from also
// brightening or darkening the image.
const MAX_TINT_SHIFT = 60;

// No CSS `filter` shifts green against red+blue, so this operates on raw
// pixel data — see flattenOperations.ts. Writes to a Uint8ClampedArray
// clamp to 0..255 automatically.
export function applyTint(
  context: CanvasRenderingContext2D,
  size: Size,
  operation: TintOperation,
): void {
  if (operation.value === 0) {
    return;
  }
  const shift = (operation.value / 100) * MAX_TINT_SHIFT;
  const imageData = context.getImageData(0, 0, size.width, size.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i]! + shift / 2; // red
    data[i + 1] = data[i + 1]! - shift; // green
    data[i + 2] = data[i + 2]! + shift / 2; // blue
    // alpha (data[i + 3]) is left untouched.
  }
  context.putImageData(imageData, 0, 0);
}
