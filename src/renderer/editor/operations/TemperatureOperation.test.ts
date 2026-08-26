import { describe, expect, it, vi } from 'vitest';
import { applyTemperature, temperatureSize } from './TemperatureOperation';

describe('temperatureSize', () => {
  it('does not change the dimensions', () => {
    expect(temperatureSize({ width: 200, height: 100 })).toEqual({ width: 200, height: 100 });
  });
});

describe('applyTemperature', () => {
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
    const { context, getImageData, putImageData } = fakeContext([100, 100, 100, 255]);

    applyTemperature(context, { width: 1, height: 1 }, { type: 'temperature', value: 0 });

    expect(getImageData).not.toHaveBeenCalled();
    expect(putImageData).not.toHaveBeenCalled();
  });

  it('warms the image at a positive value: adds red, subtracts blue, leaves green and alpha untouched', () => {
    const { context, data } = fakeContext([100, 100, 100, 128]);

    applyTemperature(context, { width: 1, height: 1 }, { type: 'temperature', value: 100 });

    // shift = (100/100) * 60 = 60.
    expect(Array.from(data)).toEqual([160, 100, 40, 128]);
  });

  it('cools the image at a negative value: subtracts red, adds blue', () => {
    const { context, data } = fakeContext([100, 100, 100, 255]);

    applyTemperature(context, { width: 1, height: 1 }, { type: 'temperature', value: -100 });

    // shift = (-100/100) * 60 = -60.
    expect(Array.from(data)).toEqual([40, 100, 160, 255]);
  });

  it('applies a proportionally smaller shift for a partial value', () => {
    const { context, data } = fakeContext([100, 100, 100, 255]);

    applyTemperature(context, { width: 1, height: 1 }, { type: 'temperature', value: 50 });

    // shift = (50/100) * 60 = 30.
    expect(Array.from(data)).toEqual([130, 100, 70, 255]);
  });

  it('applies the same shift to every pixel, unlike the luminance-weighted adjustments', () => {
    const { context, data } = fakeContext([0, 0, 0, 255, 255, 255, 255, 255]);

    applyTemperature(context, { width: 1, height: 2 }, { type: 'temperature', value: 100 });

    // Black gains red (clamped floor at blue) and white's red clamps at
    // 255 while its blue drops by the same 60 — same shift, both pixels.
    expect(Array.from(data)).toEqual([60, 0, 0, 255, 255, 255, 195, 255]);
  });

  it('clamps at the channel boundaries rather than overflowing or wrapping', () => {
    const { context, data } = fakeContext([250, 128, 5, 255]);

    applyTemperature(context, { width: 1, height: 1 }, { type: 'temperature', value: 100 });

    // red: 250 + 60 -> clamps to 255. blue: 5 - 60 -> clamps to 0.
    expect(Array.from(data)).toEqual([255, 128, 0, 255]);
  });

  it('writes the result back via putImageData', () => {
    const { context, putImageData } = fakeContext([100, 100, 100, 255]);

    applyTemperature(context, { width: 1, height: 1 }, { type: 'temperature', value: 20 });

    expect(putImageData).toHaveBeenCalledTimes(1);
    expect(putImageData.mock.calls[0]?.[1]).toBe(0);
    expect(putImageData.mock.calls[0]?.[2]).toBe(0);
  });
});
