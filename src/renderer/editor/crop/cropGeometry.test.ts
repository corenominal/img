import { describe, expect, it } from 'vitest';
import {
  clampRatioToRect,
  fullImageCropRect,
  moveCropRect,
  resizeCropRect,
  resizeCropRectWithRatio,
} from './cropGeometry';

const bounds = { width: 400, height: 300 };

describe('fullImageCropRect', () => {
  it('covers the whole image', () => {
    expect(fullImageCropRect({ width: 200, height: 100 })).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });
});

describe('moveCropRect', () => {
  it('shifts the rect by the delta', () => {
    const rect = { x: 50, y: 50, width: 100, height: 100 };
    expect(moveCropRect(rect, 10, -5, bounds)).toEqual({ x: 60, y: 45, width: 100, height: 100 });
  });

  it('clamps to the left/top edges', () => {
    const rect = { x: 10, y: 10, width: 100, height: 100 };
    expect(moveCropRect(rect, -50, -50, bounds)).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });

  it('clamps to the right/bottom edges', () => {
    const rect = { x: 250, y: 150, width: 100, height: 100 };
    expect(moveCropRect(rect, 100, 100, bounds)).toEqual({ x: 300, y: 200, width: 100, height: 100 });
  });
});

describe('resizeCropRect (free)', () => {
  it('drags the east edge, growing width only', () => {
    const rect = { x: 50, y: 50, width: 100, height: 100 };
    expect(resizeCropRect(rect, 'e', 30, 0, bounds)).toEqual({ x: 50, y: 50, width: 130, height: 100 });
  });

  it('drags the west edge, moving x and shrinking width', () => {
    const rect = { x: 50, y: 50, width: 100, height: 100 };
    expect(resizeCropRect(rect, 'w', 20, 0, bounds)).toEqual({ x: 70, y: 50, width: 80, height: 100 });
  });

  it('drags a corner, adjusting both dimensions', () => {
    const rect = { x: 50, y: 50, width: 100, height: 100 };
    expect(resizeCropRect(rect, 'se', 20, -10, bounds)).toEqual({ x: 50, y: 50, width: 120, height: 90 });
  });

  it('does not shrink below the minimum size', () => {
    const rect = { x: 50, y: 50, width: 20, height: 20 };
    const result = resizeCropRect(rect, 'e', -100, 0, bounds, 8);
    expect(result.width).toBe(8);
  });

  it('does not push the west edge past the left bound', () => {
    const rect = { x: 10, y: 50, width: 100, height: 100 };
    const result = resizeCropRect(rect, 'w', -50, 0, bounds);
    expect(result.x).toBe(0);
    expect(result.width).toBe(110);
  });

  it('does not push the east edge past the right bound', () => {
    const rect = { x: 350, y: 50, width: 40, height: 100 };
    const result = resizeCropRect(rect, 'e', 100, 0, bounds);
    expect(result.width).toBe(50); // bounds.width(400) - x(350)
  });
});

describe('resizeCropRectWithRatio', () => {
  const ratio = 2; // width = 2 * height

  it('keeps the opposite corner fixed and derives height from the ratio', () => {
    const rect = { x: 50, y: 50, width: 100, height: 50 };
    const result = resizeCropRectWithRatio(rect, 'se', 40, 0, bounds, ratio);
    // Anchor is the top-left corner (50,50); width grows by 40 -> 140, height = 70.
    expect(result.x).toBe(50);
    expect(result.y).toBe(50);
    expect(result.width).toBe(140);
    expect(result.height).toBe(70);
  });

  it('anchors the opposite corner for a nw drag', () => {
    const rect = { x: 100, y: 100, width: 100, height: 50 };
    const result = resizeCropRectWithRatio(rect, 'nw', -20, 0, bounds, ratio);
    // Anchor is bottom-right (200, 150). Width grows by 20 -> 120, height 60.
    expect(result.x).toBe(200 - 120);
    expect(result.y).toBe(150 - 60);
    expect(result.width).toBe(120);
    expect(result.height).toBe(60);
  });

  it('always produces a rect matching the requested ratio', () => {
    const rect = { x: 50, y: 50, width: 100, height: 50 };
    const result = resizeCropRectWithRatio(rect, 'se', 15, 30, bounds, ratio);
    expect(result.width / result.height).toBeCloseTo(ratio);
  });

  it('clamps growth so the rect stays within bounds', () => {
    const rect = { x: 350, y: 50, width: 40, height: 20 };
    const result = resizeCropRectWithRatio(rect, 'se', 1000, 1000, bounds, ratio);
    expect(result.x + result.width).toBeLessThanOrEqual(bounds.width + 0.001);
    expect(result.y + result.height).toBeLessThanOrEqual(bounds.height + 0.001);
  });
});

describe('clampRatioToRect', () => {
  it('shrinks height to match the ratio when width is unconstrained', () => {
    const rect = { x: 0, y: 0, width: 100, height: 100 };
    const result = clampRatioToRect(rect, bounds, 2);
    expect(result.width).toBe(100);
    expect(result.height).toBe(50);
  });

  it('shrinks width instead when height would overflow bounds', () => {
    const rect = { x: 0, y: 250, width: 300, height: 50 };
    // ratio 0.5 means height = width * 2; with only 50px of vertical room
    // left, width must shrink to fit.
    const result = clampRatioToRect(rect, bounds, 0.5);
    expect(result.height).toBeLessThanOrEqual(50);
    expect(result.width / result.height).toBeCloseTo(0.5);
  });
});
