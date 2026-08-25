import { describe, expect, it } from 'vitest';
import { imageToViewport, viewportToImage } from './transforms';
import type { ViewportState } from './viewportTypes';

describe('viewport transforms', () => {
  const viewport: ViewportState = { zoom: 2, offsetX: 50, offsetY: 20 };

  it('converts image space to viewport space accounting for devicePixelRatio', () => {
    // zoom=2 (physical px/image px) at dpr=2 means 1 CSS px per image px.
    const result = imageToViewport({ x: 100, y: 200 }, viewport, 2);
    expect(result).toEqual({ x: 150, y: 220 });
  });

  it('converts viewport space back to image space', () => {
    const result = viewportToImage({ x: 150, y: 220 }, viewport, 2);
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('round-trips arbitrary points through both conversions', () => {
    const dpr = 1.5;
    const point = { x: 317.5, y: 42.25 };
    const roundTripped = viewportToImage(imageToViewport(point, viewport, dpr), viewport, dpr);

    expect(roundTripped.x).toBeCloseTo(point.x);
    expect(roundTripped.y).toBeCloseTo(point.y);
  });

  it('treats the image origin as the offset in viewport space', () => {
    expect(imageToViewport({ x: 0, y: 0 }, viewport, 2)).toEqual({ x: 50, y: 20 });
  });
});
