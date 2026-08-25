import { describe, expect, it } from 'vitest';
import { adjustmentSize, applyAdjustmentFilter } from './AdjustmentOperation';

describe('adjustmentSize', () => {
  it('does not change the dimensions', () => {
    expect(adjustmentSize({ width: 200, height: 100 })).toEqual({ width: 200, height: 100 });
  });
});

describe('applyAdjustmentFilter', () => {
  function fakeContext(): CanvasRenderingContext2D {
    return { filter: 'none' } as unknown as CanvasRenderingContext2D;
  }

  it('maps a positive brightness value onto a >1 CSS brightness() filter', () => {
    const context = fakeContext();
    applyAdjustmentFilter(context, { type: 'brightness', value: 50 });
    expect(context.filter).toBe('brightness(1.5)');
  });

  it('maps a negative contrast value onto a <1 CSS contrast() filter', () => {
    const context = fakeContext();
    applyAdjustmentFilter(context, { type: 'contrast', value: -40 });
    expect(context.filter).toBe('contrast(0.6)');
  });

  it('maps a zero saturation value onto a no-op CSS saturate() filter', () => {
    const context = fakeContext();
    applyAdjustmentFilter(context, { type: 'saturation', value: 0 });
    expect(context.filter).toBe('saturate(1)');
  });
});
