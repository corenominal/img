import { describe, expect, it } from 'vitest';
import { getAdjustmentTotal } from './adjustmentTotals';
import type { ImageOperation } from './ImageOperation';

describe('getAdjustmentTotal', () => {
  it('is zero when there are no operations of that kind', () => {
    const operations: ImageOperation[] = [{ type: 'rotate', degrees: 90 }];
    expect(getAdjustmentTotal(operations, 'brightness')).toBe(0);
  });

  it('sums every committed delta of the given kind', () => {
    const operations: ImageOperation[] = [
      { type: 'brightness', value: 20 },
      { type: 'contrast', value: -5 },
      { type: 'brightness', value: 15 },
    ];
    expect(getAdjustmentTotal(operations, 'brightness')).toBe(35);
  });

  it('ignores other adjustment kinds and geometric operations interleaved in the stack', () => {
    const operations: ImageOperation[] = [
      { type: 'brightness', value: 20 },
      { type: 'rotate', degrees: 90 },
      { type: 'saturation', value: 10 },
      { type: 'flip', axis: 'horizontal' },
      { type: 'brightness', value: -5 },
    ];
    expect(getAdjustmentTotal(operations, 'brightness')).toBe(15);
    expect(getAdjustmentTotal(operations, 'saturation')).toBe(10);
    expect(getAdjustmentTotal(operations, 'contrast')).toBe(0);
  });

  it('sums exposure deltas too, despite exposure rendering differently from the CSS-filter kinds', () => {
    const operations: ImageOperation[] = [
      { type: 'exposure', value: 30 },
      { type: 'brightness', value: 20 },
      { type: 'exposure', value: -10 },
    ];
    expect(getAdjustmentTotal(operations, 'exposure')).toBe(20);
  });

  it('sums highlights deltas too', () => {
    const operations: ImageOperation[] = [
      { type: 'highlights', value: -20 },
      { type: 'exposure', value: 10 },
      { type: 'highlights', value: 5 },
    ];
    expect(getAdjustmentTotal(operations, 'highlights')).toBe(-15);
  });
});
