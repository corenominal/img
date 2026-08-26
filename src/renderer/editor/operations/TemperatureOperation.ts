import type { Size } from '../viewport/viewportTypes';

// A single slider gesture's delta, in the range -100..100 — same
// relative/delta convention as AdjustmentOperation.ts/ExposureOperation.ts/
// etc.: committing a second temperature gesture stacks another delta
// rather than replacing the first.
export interface TemperatureOperation {
  type: 'temperature';
  value: number;
}

export function temperatureSize(size: Size): Size {
  return size;
}

// -100..100 maps to a ±60 (of 255) shift along the blue-orange axis:
// positive warms the image (more red, less blue), negative cools it (less
// red, more blue). Unlike exposure/highlights/shadows, this is a flat
// shift applied identically to every pixel — no luminance weighting —
// since white balance is meant to correct (or stylise) the whole image's
// colour cast evenly, not just its shadows or highlights. Green is
// untouched: that's the tint axis, a separate adjustment.
const MAX_TEMPERATURE_SHIFT = 60;

// No CSS `filter` shifts red and blue in opposite directions, so this
// operates on raw pixel data — see flattenOperations.ts. Writes to a
// Uint8ClampedArray clamp to 0..255 automatically.
export function applyTemperature(
  context: CanvasRenderingContext2D,
  size: Size,
  operation: TemperatureOperation,
): void {
  if (operation.value === 0) {
    return;
  }
  const shift = (operation.value / 100) * MAX_TEMPERATURE_SHIFT;
  const imageData = context.getImageData(0, 0, size.width, size.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i]! + shift; // red
    data[i + 2] = data[i + 2]! - shift; // blue
    // green (data[i + 1]) and alpha (data[i + 3]) are left untouched.
  }
  context.putImageData(imageData, 0, 0);
}
