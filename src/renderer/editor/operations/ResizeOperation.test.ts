import { describe, expect, it } from 'vitest';
import { applyResizeScale, resizeSize } from './ResizeOperation';

describe('resizeSize', () => {
  it('takes the target size directly from the operation', () => {
    expect(resizeSize({ type: 'resize', width: 400, height: 300, resampling: 'smooth' })).toEqual({
      width: 400,
      height: 300,
    });
  });
});

describe('applyResizeScale', () => {
  function fakeContext(): CanvasRenderingContext2D {
    return {
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'low',
    } as unknown as CanvasRenderingContext2D;
  }

  it('enables smoothing for the smooth resampling method', () => {
    const context = fakeContext();
    applyResizeScale(context, { type: 'resize', width: 100, height: 100, resampling: 'smooth' });
    expect(context.imageSmoothingEnabled).toBe(true);
    expect(context.imageSmoothingQuality).toBe('high');
  });

  it('disables smoothing for the pixelated resampling method', () => {
    const context = fakeContext();
    applyResizeScale(context, { type: 'resize', width: 100, height: 100, resampling: 'pixelated' });
    expect(context.imageSmoothingEnabled).toBe(false);
  });
});
