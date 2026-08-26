import { describe, expect, it, vi } from 'vitest';
import { applyVibrance, vibranceSize } from './VibranceOperation';

describe('vibranceSize', () => {
  it('does not change the dimensions', () => {
    expect(vibranceSize({ width: 200, height: 100 })).toEqual({ width: 200, height: 100 });
  });
});

describe('applyVibrance', () => {
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
    const { context, getImageData, putImageData } = fakeContext([150, 140, 130, 255]);

    applyVibrance(context, { width: 1, height: 1 }, { type: 'vibrance', value: 0 });

    expect(getImageData).not.toHaveBeenCalled();
    expect(putImageData).not.toHaveBeenCalled();
  });

  it('boosts a low-saturation pixel toward its extremes at a positive value', () => {
    const { context, data } = fakeContext([150, 140, 130, 255]);

    applyVibrance(context, { width: 1, height: 1 }, { type: 'vibrance', value: 100 });

    expect(Array.from(data)).toEqual([159, 140, 121, 255]);
  });

  it('applies a proportionally smaller boost for a partial value', () => {
    const { context, data } = fakeContext([150, 140, 130, 255]);

    applyVibrance(context, { width: 1, height: 1 }, { type: 'vibrance', value: 50 });

    expect(Array.from(data)).toEqual([154, 140, 126, 255]);
  });

  it('desaturates a low-saturation pixel toward grey at a negative value', () => {
    const { context, data } = fakeContext([150, 140, 130, 255]);

    applyVibrance(context, { width: 1, height: 1 }, { type: 'vibrance', value: -100 });

    expect(Array.from(data)).toEqual([141, 140, 139, 255]);
  });

  it('leaves an already fully-saturated pixel unchanged, regardless of value', () => {
    const { context, data } = fakeContext([255, 0, 0, 255]);

    applyVibrance(context, { width: 1, height: 1 }, { type: 'vibrance', value: 100 });

    expect(Array.from(data)).toEqual([255, 0, 0, 255]);
  });

  it('leaves a grey (zero-saturation) pixel unchanged, regardless of value', () => {
    const { context, data } = fakeContext([128, 128, 128, 255]);

    applyVibrance(context, { width: 1, height: 1 }, { type: 'vibrance', value: 100 });

    expect(Array.from(data)).toEqual([128, 128, 128, 255]);
  });

  it('clamps at the channel boundary rather than overflowing', () => {
    const { context, data } = fakeContext([250, 245, 240, 255]);

    applyVibrance(context, { width: 1, height: 1 }, { type: 'vibrance', value: 100 });

    expect(Array.from(data)).toEqual([255, 245, 235, 255]);
  });

  it('writes the result back via putImageData', () => {
    const { context, putImageData } = fakeContext([150, 140, 130, 255]);

    applyVibrance(context, { width: 1, height: 1 }, { type: 'vibrance', value: 20 });

    expect(putImageData).toHaveBeenCalledTimes(1);
    expect(putImageData.mock.calls[0]?.[1]).toBe(0);
    expect(putImageData.mock.calls[0]?.[2]).toBe(0);
  });
});
