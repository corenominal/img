import { describe, expect, it, vi } from 'vitest';
import { applyTint, tintSize } from './TintOperation';

describe('tintSize', () => {
  it('does not change the dimensions', () => {
    expect(tintSize({ width: 200, height: 100 })).toEqual({ width: 200, height: 100 });
  });
});

describe('applyTint', () => {
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

    applyTint(context, { width: 1, height: 1 }, { type: 'tint', value: 0 });

    expect(getImageData).not.toHaveBeenCalled();
    expect(putImageData).not.toHaveBeenCalled();
  });

  it('shifts toward magenta at a positive value: green down, red/blue up by half as much, alpha untouched', () => {
    const { context, data } = fakeContext([100, 100, 100, 128]);

    applyTint(context, { width: 1, height: 1 }, { type: 'tint', value: 100 });

    // shift = (100/100) * 60 = 60. red/blue += 30, green -= 60.
    expect(Array.from(data)).toEqual([130, 40, 130, 128]);
  });

  it('shifts toward green at a negative value: green up, red/blue down', () => {
    const { context, data } = fakeContext([100, 100, 100, 255]);

    applyTint(context, { width: 1, height: 1 }, { type: 'tint', value: -100 });

    // shift = (-100/100) * 60 = -60. red/blue -= 30, green += 60.
    expect(Array.from(data)).toEqual([70, 160, 70, 255]);
  });

  it('applies a proportionally smaller shift for a partial value', () => {
    const { context, data } = fakeContext([100, 100, 100, 255]);

    applyTint(context, { width: 1, height: 1 }, { type: 'tint', value: 50 });

    // shift = (50/100) * 60 = 30. red/blue += 15, green -= 30.
    expect(Array.from(data)).toEqual([115, 70, 115, 255]);
  });

  it('leaves the total of red+green+blue unchanged (a pure hue shift, not a brightness change)', () => {
    const { context, data } = fakeContext([80, 150, 30, 255]);

    applyTint(context, { width: 1, height: 1 }, { type: 'tint', value: -70 });

    const originalSum = 80 + 150 + 30;
    const newSum = data[0]! + data[1]! + data[2]!;
    expect(newSum).toBe(originalSum);
  });

  it('clamps at the channel boundaries rather than overflowing or wrapping', () => {
    const { context, data } = fakeContext([250, 10, 250, 255]);

    applyTint(context, { width: 1, height: 1 }, { type: 'tint', value: 100 });

    // red: 250 + 30 -> clamps to 255. green: 10 - 60 -> clamps to 0.
    // blue: 250 + 30 -> clamps to 255.
    expect(Array.from(data)).toEqual([255, 0, 255, 255]);
  });

  it('writes the result back via putImageData', () => {
    const { context, putImageData } = fakeContext([100, 100, 100, 255]);

    applyTint(context, { width: 1, height: 1 }, { type: 'tint', value: 20 });

    expect(putImageData).toHaveBeenCalledTimes(1);
    expect(putImageData.mock.calls[0]?.[1]).toBe(0);
    expect(putImageData.mock.calls[0]?.[2]).toBe(0);
  });
});
