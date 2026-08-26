import { describe, expect, it, vi } from 'vitest';
import { applyGeometricTransform, applyOperationToSize, isImageOperation } from './ImageOperation';

describe('applyOperationToSize', () => {
  it('applies a rotate operation', () => {
    expect(
      applyOperationToSize({ width: 200, height: 100 }, { type: 'rotate', degrees: 90 }),
    ).toEqual({
      width: 100,
      height: 200,
    });
  });

  it('applies a flip operation (no size change)', () => {
    expect(
      applyOperationToSize({ width: 200, height: 100 }, { type: 'flip', axis: 'vertical' }),
    ).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('applies a crop operation (size comes from the operation, not the input)', () => {
    expect(
      applyOperationToSize(
        { width: 200, height: 100 },
        { type: 'crop', x: 10, y: 10, width: 50, height: 40 },
      ),
    ).toEqual({ width: 50, height: 40 });
  });

  it('applies a colour adjustment operation (no size change)', () => {
    expect(
      applyOperationToSize({ width: 200, height: 100 }, { type: 'brightness', value: 20 }),
    ).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('applies a resize operation (size comes from the operation, not the input)', () => {
    expect(
      applyOperationToSize(
        { width: 200, height: 100 },
        { type: 'resize', width: 400, height: 300, resampling: 'smooth' },
      ),
    ).toEqual({ width: 400, height: 300 });
  });

  it('applies an exposure operation (no size change)', () => {
    expect(
      applyOperationToSize({ width: 200, height: 100 }, { type: 'exposure', value: 40 }),
    ).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('applies a highlights operation (no size change)', () => {
    expect(
      applyOperationToSize({ width: 200, height: 100 }, { type: 'highlights', value: -30 }),
    ).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('applies a shadows operation (no size change)', () => {
    expect(
      applyOperationToSize({ width: 200, height: 100 }, { type: 'shadows', value: 30 }),
    ).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('applies a temperature operation (no size change)', () => {
    expect(
      applyOperationToSize({ width: 200, height: 100 }, { type: 'temperature', value: -40 }),
    ).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('applies a tint operation (no size change)', () => {
    expect(applyOperationToSize({ width: 200, height: 100 }, { type: 'tint', value: 25 })).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('applies a vibrance operation (no size change)', () => {
    expect(
      applyOperationToSize({ width: 200, height: 100 }, { type: 'vibrance', value: 30 }),
    ).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('applies a gamma operation (no size change)', () => {
    expect(
      applyOperationToSize({ width: 200, height: 100 }, { type: 'gamma', value: -20 }),
    ).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('applies a black point operation (no size change)', () => {
    expect(
      applyOperationToSize({ width: 200, height: 100 }, { type: 'blackPoint', value: 40 }),
    ).toEqual({
      width: 200,
      height: 100,
    });
  });

  it('applies a white point operation (no size change)', () => {
    expect(
      applyOperationToSize({ width: 200, height: 100 }, { type: 'whitePoint', value: -30 }),
    ).toEqual({
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
    applyGeometricTransform(
      context,
      { type: 'flip', axis: 'horizontal' },
      { width: 200, height: 100 },
    );
    expect(context.scale).toHaveBeenCalledWith(-1, 1);
  });
});

describe('isImageOperation', () => {
  it.each([
    { type: 'rotate', degrees: 90 },
    { type: 'rotate', degrees: 180 },
    { type: 'rotate', degrees: 270 },
    { type: 'flip', axis: 'horizontal' },
    { type: 'flip', axis: 'vertical' },
    { type: 'crop', x: 0, y: 0, width: 10, height: 10 },
    { type: 'brightness', value: 20 },
    { type: 'contrast', value: -10 },
    { type: 'saturation', value: 0 },
    { type: 'resize', width: 100, height: 50, resampling: 'smooth' },
    { type: 'resize', width: 100, height: 50, resampling: 'pixelated' },
    { type: 'exposure', value: 40 },
    { type: 'highlights', value: -30 },
    { type: 'shadows', value: 30 },
    { type: 'temperature', value: -40 },
    { type: 'tint', value: 25 },
    { type: 'vibrance', value: 30 },
    { type: 'gamma', value: -20 },
    { type: 'blackPoint', value: 40 },
    { type: 'whitePoint', value: -30 },
  ])('accepts a valid $type operation', (operation) => {
    expect(isImageOperation(operation)).toBe(true);
  });

  it.each([
    null,
    undefined,
    42,
    'rotate',
    {},
    { type: 'teleport' },
    { type: 'rotate', degrees: 45 },
    { type: 'rotate' },
    { type: 'flip', axis: 'diagonal' },
    { type: 'crop', x: 0, y: 0, width: 10 },
    { type: 'crop', x: 0, y: 0, width: '10', height: 10 },
    { type: 'brightness', value: 'a lot' },
    { type: 'resize', width: 100, height: 50, resampling: 'blurry' },
    { type: 'resize', width: 100, height: 50 },
    { type: 'exposure', value: 'bright' },
    { type: 'exposure' },
    { type: 'highlights', value: 'bright' },
    { type: 'highlights' },
    { type: 'shadows', value: 'dark' },
    { type: 'shadows' },
    { type: 'temperature', value: 'warm' },
    { type: 'temperature' },
    { type: 'tint', value: 'cool' },
    { type: 'tint' },
    { type: 'vibrance', value: 'more' },
    { type: 'vibrance' },
    { type: 'gamma', value: 'darker' },
    { type: 'gamma' },
    { type: 'blackPoint', value: 'crushed' },
    { type: 'blackPoint' },
    { type: 'whitePoint', value: 'faded' },
    { type: 'whitePoint' },
  ])('rejects %j', (value) => {
    expect(isImageOperation(value)).toBe(false);
  });
});
