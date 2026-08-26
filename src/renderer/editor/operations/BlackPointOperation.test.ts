import { describe, expect, it, vi } from 'vitest';
import { applyBlackPoint, blackPointSize } from './BlackPointOperation';

describe('blackPointSize', () => {
  it('does not change the dimensions', () => {
    expect(blackPointSize({ width: 200, height: 100 })).toEqual({ width: 200, height: 100 });
  });
});

describe('applyBlackPoint', () => {
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

    applyBlackPoint(context, { width: 1, height: 1 }, { type: 'blackPoint', value: 0 });

    expect(getImageData).not.toHaveBeenCalled();
    expect(putImageData).not.toHaveBeenCalled();
  });

  it('crushes shadows and raises contrast at a positive value', () => {
    const { context, data } = fakeContext([60, 100, 180, 255]);

    applyBlackPoint(context, { width: 1, height: 1 }, { type: 'blackPoint', value: 100 });

    expect(Array.from(data)).toEqual([0, 0, 113, 255]);
  });

  it('lifts blacks and lowers contrast at a negative value', () => {
    const { context, data } = fakeContext([60, 100, 180, 255]);

    applyBlackPoint(context, { width: 1, height: 1 }, { type: 'blackPoint', value: -100 });

    expect(Array.from(data)).toEqual([122, 150, 204, 255]);
  });

  it('applies a proportionally smaller shift for a partial value', () => {
    const { context, data } = fakeContext([60, 100, 180, 255]);

    applyBlackPoint(context, { width: 1, height: 1 }, { type: 'blackPoint', value: 50 });

    expect(Array.from(data)).toEqual([0, 52, 157, 255]);
  });

  it('clips pure black to 0 at a positive value (crushing all the way)', () => {
    const { context, data } = fakeContext([0, 0, 0, 255]);

    applyBlackPoint(context, { width: 1, height: 1 }, { type: 'blackPoint', value: 100 });

    expect(Array.from(data)).toEqual([0, 0, 0, 255]);
  });

  it('lifts pure black off the floor at a negative value', () => {
    const { context, data } = fakeContext([0, 0, 0, 255]);

    applyBlackPoint(context, { width: 1, height: 1 }, { type: 'blackPoint', value: -100 });

    expect(Array.from(data)).toEqual([82, 82, 82, 255]);
  });

  it('leaves white unchanged, regardless of value or direction', () => {
    const { context: crushContext, data: crushData } = fakeContext([255, 255, 255, 255]);
    applyBlackPoint(crushContext, { width: 1, height: 1 }, { type: 'blackPoint', value: 100 });
    expect(Array.from(crushData)).toEqual([255, 255, 255, 255]);

    const { context: liftContext, data: liftData } = fakeContext([255, 255, 255, 255]);
    applyBlackPoint(liftContext, { width: 1, height: 1 }, { type: 'blackPoint', value: -100 });
    expect(Array.from(liftData)).toEqual([255, 255, 255, 255]);
  });

  it('writes the result back via putImageData', () => {
    const { context, putImageData } = fakeContext([60, 100, 180, 255]);

    applyBlackPoint(context, { width: 1, height: 1 }, { type: 'blackPoint', value: 20 });

    expect(putImageData).toHaveBeenCalledTimes(1);
    expect(putImageData.mock.calls[0]?.[1]).toBe(0);
    expect(putImageData.mock.calls[0]?.[2]).toBe(0);
  });
});
