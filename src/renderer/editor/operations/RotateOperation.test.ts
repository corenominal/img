import { describe, expect, it, vi } from 'vitest';
import { applyRotateTransform, rotateSize } from './RotateOperation';

describe('rotateSize', () => {
  it('swaps width and height for a 90° rotation', () => {
    expect(rotateSize({ width: 200, height: 100 }, 90)).toEqual({ width: 100, height: 200 });
  });

  it('swaps width and height for a 270° rotation', () => {
    expect(rotateSize({ width: 200, height: 100 }, 270)).toEqual({ width: 100, height: 200 });
  });

  it('leaves dimensions unchanged for a 180° rotation', () => {
    expect(rotateSize({ width: 200, height: 100 }, 180)).toEqual({ width: 200, height: 100 });
  });
});

describe('applyRotateTransform', () => {
  function fakeContext() {
    return { translate: vi.fn(), rotate: vi.fn() } as unknown as CanvasRenderingContext2D;
  }

  it('rotates by the given angle in radians', () => {
    const context = fakeContext();
    applyRotateTransform(context, 90, { width: 200, height: 100 });
    expect(context.rotate).toHaveBeenCalledWith(Math.PI / 2);
  });

  it('translates to the post-rotation center, then the pre-rotation center', () => {
    const context = fakeContext();
    applyRotateTransform(context, 90, { width: 200, height: 100 });
    // sizeAfter for 90° is {width:100, height:200}
    expect(context.translate).toHaveBeenNthCalledWith(1, 50, 100);
    expect(context.translate).toHaveBeenNthCalledWith(2, -100, -50);
  });
});
