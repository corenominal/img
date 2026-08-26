import { describe, expect, it } from 'vitest';
import { relativeLuminance, smoothstep } from './luminance';

describe('relativeLuminance', () => {
  it('is 0 for black', () => {
    expect(relativeLuminance(0, 0, 0)).toBe(0);
  });

  it('is 1 for white', () => {
    expect(relativeLuminance(255, 255, 255)).toBe(1);
  });

  it('weights green highest and blue lowest, per Rec. 601', () => {
    expect(relativeLuminance(255, 0, 0)).toBeCloseTo(0.299, 5);
    expect(relativeLuminance(0, 255, 0)).toBeCloseTo(0.587, 5);
    expect(relativeLuminance(0, 0, 255)).toBeCloseTo(0.114, 5);
  });
});

describe('smoothstep', () => {
  it('is 0 at and below the lower edge', () => {
    expect(smoothstep(0.5, 1, 0.5)).toBe(0);
    expect(smoothstep(0.5, 1, 0)).toBe(0);
  });

  it('is 1 at and above the upper edge', () => {
    expect(smoothstep(0.5, 1, 1)).toBe(1);
    expect(smoothstep(0.5, 1, 2)).toBe(1);
  });

  it('is 0.5 at the midpoint between the edges', () => {
    expect(smoothstep(0.5, 1, 0.75)).toBeCloseTo(0.5, 5);
  });

  it('eases rather than transitioning linearly', () => {
    // At the quarter-point, a linear ramp would be 0.25; smoothstep is
    // flatter near the edges, so it should be strictly less.
    expect(smoothstep(0.5, 1, 0.625)).toBeLessThan(0.25);
  });
});
