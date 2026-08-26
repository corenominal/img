import { describe, expect, it, vi } from 'vitest';
import { applyGamma, gammaSize } from './GammaOperation';

describe('gammaSize', () => {
  it('does not change the dimensions', () => {
    expect(gammaSize({ width: 200, height: 100 })).toEqual({ width: 200, height: 100 });
  });
});

describe('applyGamma', () => {
  function fakeContext(pixels: number[]): {
    context: CanvasRenderingContext2D;
    getImageData: ReturnType<typeof vi.fn>;
    putImageData: ReturnType<typeof vi.fn>;
    data: Uint8ClampedArray;
  } {
    const data = new Uint8ClampedArray(pixels);
    const imageData = { data, width: 1, height: data.length / 4 } as unknown as ImageData;
    const getImageData = vi.fn().mockReturnValue(imageData);
    const putImageData = vi.fn();
    return {
      context: { getImageData, putImageData } as unknown as CanvasRenderingContext2D,
      getImageData,
      putImageData,
      data,
    };
  }

  it('is a no-op at value 0: getImageData/putImageData are never called', () => {
    const { context, getImageData, putImageData } = fakeContext([64, 128, 192, 255]);

    applyGamma(context, { width: 1, height: 1 }, { type: 'gamma', value: 0 });

    expect(getImageData).not.toHaveBeenCalled();
    expect(putImageData).not.toHaveBeenCalled();
  });

  it('brightens midtones at a positive value (exponent 0.5)', () => {
    const { context, data } = fakeContext([64, 128, 192, 255]);

    applyGamma(context, { width: 1, height: 1 }, { type: 'gamma', value: 100 });

    expect(Array.from(data)).toEqual([128, 181, 221, 255]);
  });

  it('darkens midtones at a negative value (exponent 2)', () => {
    const { context, data } = fakeContext([64, 128, 192, 255]);

    applyGamma(context, { width: 1, height: 1 }, { type: 'gamma', value: -100 });

    expect(Array.from(data)).toEqual([16, 64, 145, 255]);
  });

  it('applies a proportionally smaller shift for a partial value', () => {
    const { context, data } = fakeContext([64, 128, 192, 255]);

    applyGamma(context, { width: 1, height: 1 }, { type: 'gamma', value: 50 });

    expect(Array.from(data)).toEqual([96, 157, 209, 255]);
  });

  it('leaves black unchanged, regardless of value (0^n is always 0)', () => {
    const { context, data } = fakeContext([0, 0, 0, 255]);

    applyGamma(context, { width: 1, height: 1 }, { type: 'gamma', value: 100 });

    expect(Array.from(data)).toEqual([0, 0, 0, 255]);
  });

  it('leaves white unchanged, regardless of value (1^n is always 1)', () => {
    const { context, data } = fakeContext([255, 255, 255, 255]);

    applyGamma(context, { width: 1, height: 1 }, { type: 'gamma', value: -100 });

    expect(Array.from(data)).toEqual([255, 255, 255, 255]);
  });

  it('leaves alpha untouched', () => {
    const { context, data } = fakeContext([64, 128, 192, 128]);

    applyGamma(context, { width: 1, height: 1 }, { type: 'gamma', value: 100 });

    expect(data[3]).toBe(128);
  });

  it('writes the result back via putImageData', () => {
    const { context, putImageData } = fakeContext([64, 128, 192, 255]);

    applyGamma(context, { width: 1, height: 1 }, { type: 'gamma', value: 20 });

    expect(putImageData).toHaveBeenCalledTimes(1);
    expect(putImageData.mock.calls[0]?.[1]).toBe(0);
    expect(putImageData.mock.calls[0]?.[2]).toBe(0);
  });
});
