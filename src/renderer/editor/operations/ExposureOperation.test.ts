import { describe, expect, it, vi } from 'vitest';
import { applyExposure, exposureSize } from './ExposureOperation';

describe('exposureSize', () => {
  it('does not change the dimensions', () => {
    expect(exposureSize({ width: 200, height: 100 })).toEqual({ width: 200, height: 100 });
  });
});

describe('applyExposure', () => {
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

  it('is a no-op at value 0 (1x multiplier): getImageData/putImageData are never called', () => {
    const { context, getImageData, putImageData } = fakeContext([10, 20, 30, 255]);

    applyExposure(context, { width: 1, height: 1 }, { type: 'exposure', value: 0 });

    expect(getImageData).not.toHaveBeenCalled();
    expect(putImageData).not.toHaveBeenCalled();
  });

  it('doubles RGB at +50 (a single +1-stop increase), leaving alpha untouched', () => {
    const { context, data } = fakeContext([10, 20, 30, 128]);

    applyExposure(context, { width: 1, height: 1 }, { type: 'exposure', value: 50 });

    expect(Array.from(data)).toEqual([20, 40, 60, 128]);
  });

  it('quadruples RGB at +100 (a full +2-stop increase), leaving alpha untouched', () => {
    const { context, data } = fakeContext([10, 20, 30, 128]);

    applyExposure(context, { width: 1, height: 1 }, { type: 'exposure', value: 100 });

    expect(Array.from(data)).toEqual([40, 80, 120, 128]);
  });

  it('reduces RGB to a quarter at -100 (a full -2-stop decrease), leaving alpha untouched', () => {
    const { context, data } = fakeContext([40, 80, 120, 128]);

    applyExposure(context, { width: 1, height: 1 }, { type: 'exposure', value: -100 });

    expect(Array.from(data)).toEqual([10, 20, 30, 128]);
  });

  it('clamps brightened channels at 255 rather than overflowing', () => {
    const { context, data } = fakeContext([200, 250, 255, 255]);

    applyExposure(context, { width: 1, height: 1 }, { type: 'exposure', value: 100 });

    expect(Array.from(data)).toEqual([255, 255, 255, 255]);
  });

  it('writes the result back via putImageData', () => {
    const { context, putImageData } = fakeContext([10, 20, 30, 255]);

    applyExposure(context, { width: 1, height: 1 }, { type: 'exposure', value: 50 });

    expect(putImageData).toHaveBeenCalledTimes(1);
    expect(putImageData.mock.calls[0]?.[1]).toBe(0);
    expect(putImageData.mock.calls[0]?.[2]).toBe(0);
  });
});
