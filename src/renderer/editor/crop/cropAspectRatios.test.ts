import { describe, expect, it } from 'vitest';
import { aspectRatioValue } from './cropAspectRatios';

describe('aspectRatioValue', () => {
  it('is unconstrained (null) for free', () => {
    expect(aspectRatioValue('free', { width: 200, height: 100 })).toBeNull();
  });

  it('derives the ratio from the current image for "original"', () => {
    expect(aspectRatioValue('original', { width: 200, height: 100 })).toBe(2);
  });

  it('is exactly 1 for 1:1', () => {
    expect(aspectRatioValue('1:1', { width: 200, height: 100 })).toBe(1);
  });

  it('is 4/3 for 4:3', () => {
    expect(aspectRatioValue('4:3', { width: 999, height: 999 })).toBeCloseTo(4 / 3);
  });

  it('is 16/9 for 16:9', () => {
    expect(aspectRatioValue('16:9', { width: 999, height: 999 })).toBeCloseTo(16 / 9);
  });
});
