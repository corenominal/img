import { describe, expect, it, vi } from 'vitest';
import { applyWhitePoint, whitePointSize } from './WhitePointOperation';

describe('whitePointSize', () => {
  it('does not change the dimensions', () => {
    expect(whitePointSize({ width: 200, height: 100 })).toEqual({ width: 200, height: 100 });
  });
});

describe('applyWhitePoint', () => {
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
    const { context, getImageData, putImageData } = fakeContext([60, 100, 180, 255]);

    applyWhitePoint(context, { width: 1, height: 1 }, { type: 'whitePoint', value: 0 });

    expect(getImageData).not.toHaveBeenCalled();
    expect(putImageData).not.toHaveBeenCalled();
  });

  it('crushes highlights and raises contrast at a positive value', () => {
    const { context, data } = fakeContext([60, 100, 180, 255]);

    applyWhitePoint(context, { width: 1, height: 1 }, { type: 'whitePoint', value: 100 });

    expect(Array.from(data)).toEqual([113, 189, 255, 255]);
  });

  it('lifts (fades) the white point and lowers contrast at a negative value', () => {
    const { context, data } = fakeContext([60, 100, 180, 255]);

    applyWhitePoint(context, { width: 1, height: 1 }, { type: 'whitePoint', value: -100 });

    expect(Array.from(data)).toEqual([41, 68, 122, 255]);
  });

  it('applies a proportionally smaller shift for a partial value', () => {
    const { context, data } = fakeContext([60, 100, 180, 255]);

    applyWhitePoint(context, { width: 1, height: 1 }, { type: 'whitePoint', value: 50 });

    expect(Array.from(data)).toEqual([78, 131, 235, 255]);
  });

  it('clips pure white to 255 at a positive value (crushing all the way)', () => {
    const { context, data } = fakeContext([255, 255, 255, 255]);

    applyWhitePoint(context, { width: 1, height: 1 }, { type: 'whitePoint', value: 100 });

    expect(Array.from(data)).toEqual([255, 255, 255, 255]);
  });

  it('fades pure white below the ceiling at a negative value', () => {
    const { context, data } = fakeContext([255, 255, 255, 255]);

    applyWhitePoint(context, { width: 1, height: 1 }, { type: 'whitePoint', value: -100 });

    expect(Array.from(data)).toEqual([173, 173, 173, 255]);
  });

  it('leaves black unchanged, regardless of value or direction', () => {
    const { context: crushContext, data: crushData } = fakeContext([0, 0, 0, 255]);
    applyWhitePoint(crushContext, { width: 1, height: 1 }, { type: 'whitePoint', value: 100 });
    expect(Array.from(crushData)).toEqual([0, 0, 0, 255]);

    const { context: liftContext, data: liftData } = fakeContext([0, 0, 0, 255]);
    applyWhitePoint(liftContext, { width: 1, height: 1 }, { type: 'whitePoint', value: -100 });
    expect(Array.from(liftData)).toEqual([0, 0, 0, 255]);
  });

  it('writes the result back via putImageData', () => {
    const { context, putImageData } = fakeContext([60, 100, 180, 255]);

    applyWhitePoint(context, { width: 1, height: 1 }, { type: 'whitePoint', value: 20 });

    expect(putImageData).toHaveBeenCalledTimes(1);
    expect(putImageData.mock.calls[0]?.[1]).toBe(0);
    expect(putImageData.mock.calls[0]?.[2]).toBe(0);
  });
});
