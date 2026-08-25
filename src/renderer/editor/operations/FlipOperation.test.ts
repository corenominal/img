import { describe, expect, it, vi } from 'vitest';
import { applyFlipTransform, flipSize } from './FlipOperation';

describe('flipSize', () => {
  it('does not change the dimensions', () => {
    expect(flipSize({ width: 200, height: 100 })).toEqual({ width: 200, height: 100 });
  });
});

describe('applyFlipTransform', () => {
  function fakeContext() {
    return { translate: vi.fn(), scale: vi.fn() } as unknown as CanvasRenderingContext2D;
  }

  it('mirrors horizontally by translating the full width and negating x-scale', () => {
    const context = fakeContext();
    applyFlipTransform(context, 'horizontal', { width: 200, height: 100 });
    expect(context.translate).toHaveBeenCalledWith(200, 0);
    expect(context.scale).toHaveBeenCalledWith(-1, 1);
  });

  it('mirrors vertically by translating the full height and negating y-scale', () => {
    const context = fakeContext();
    applyFlipTransform(context, 'vertical', { width: 200, height: 100 });
    expect(context.translate).toHaveBeenCalledWith(0, 100);
    expect(context.scale).toHaveBeenCalledWith(1, -1);
  });
});
