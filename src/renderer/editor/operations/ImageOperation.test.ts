import { describe, expect, it, vi } from 'vitest';
import { applyGeometricTransform, applyOperationToSize } from './ImageOperation';

describe('applyOperationToSize', () => {
  it('applies a rotate operation', () => {
    expect(applyOperationToSize({ width: 200, height: 100 }, { type: 'rotate', degrees: 90 })).toEqual({
      width: 100,
      height: 200,
    });
  });

  it('applies a flip operation (no size change)', () => {
    expect(applyOperationToSize({ width: 200, height: 100 }, { type: 'flip', axis: 'vertical' })).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('applies a crop operation (size comes from the operation, not the input)', () => {
    expect(
      applyOperationToSize({ width: 200, height: 100 }, { type: 'crop', x: 10, y: 10, width: 50, height: 40 }),
    ).toEqual({ width: 50, height: 40 });
  });

  it('applies a colour adjustment operation (no size change)', () => {
    expect(applyOperationToSize({ width: 200, height: 100 }, { type: 'brightness', value: 20 })).toEqual({
      width: 200,
      height: 100,
    });
  });
});

describe('applyGeometricTransform', () => {
  it('dispatches rotate to applyRotateTransform', () => {
    const context = { translate: vi.fn(), rotate: vi.fn() } as unknown as CanvasRenderingContext2D;
    applyGeometricTransform(context, { type: 'rotate', degrees: 90 }, { width: 200, height: 100 });
    expect(context.rotate).toHaveBeenCalledWith(Math.PI / 2);
  });

  it('dispatches flip to applyFlipTransform', () => {
    const context = { translate: vi.fn(), scale: vi.fn() } as unknown as CanvasRenderingContext2D;
    applyGeometricTransform(context, { type: 'flip', axis: 'horizontal' }, { width: 200, height: 100 });
    expect(context.scale).toHaveBeenCalledWith(-1, 1);
  });
});
