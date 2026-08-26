import { describe, expect, it, vi } from 'vitest';
import { applyShadows, shadowsSize } from './ShadowsOperation';

describe('shadowsSize', () => {
  it('does not change the dimensions', () => {
    expect(shadowsSize({ width: 200, height: 100 })).toEqual({ width: 200, height: 100 });
  });
});

describe('applyShadows', () => {
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
    const { context, getImageData, putImageData } = fakeContext([10, 10, 10, 255]);

    applyShadows(context, { width: 1, height: 1 }, { type: 'shadows', value: 0 });

    expect(getImageData).not.toHaveBeenCalled();
    expect(putImageData).not.toHaveBeenCalled();
  });

  it('leaves mid-gray and brighter pixels untouched, regardless of value', () => {
    // Luminance 128/255 ≈ 0.502, at/above the 0.5 "no longer a shadow"
    // threshold, so its weight — and therefore any effect — is exactly 0.
    const { context, data } = fakeContext([128, 128, 128, 255, 200, 200, 200, 200]);

    applyShadows(context, { width: 1, height: 2 }, { type: 'shadows', value: -100 });

    expect(Array.from(data)).toEqual([128, 128, 128, 255, 200, 200, 200, 200]);
  });

  it('lifts pure black toward gray at a positive value, leaving alpha untouched', () => {
    const { context, data } = fakeContext([0, 0, 0, 128]);

    applyShadows(context, { width: 1, height: 1 }, { type: 'shadows', value: 100 });

    // weight at luminance 0 is 1, offset = (100/100) * 1 * 120 = 120.
    expect(Array.from(data)).toEqual([120, 120, 120, 128]);
  });

  it('crushes a dark-but-not-pure-black pixel further toward black at a negative value', () => {
    const { context, data } = fakeContext([80, 80, 80, 255]);

    applyShadows(context, { width: 1, height: 1 }, { type: 'shadows', value: -100 });

    expect(Array.from(data)).toEqual([42, 42, 42, 255]);
  });

  it('partially affects a dark-but-not-pure-black pixel, scaled by how much of a shadow it is', () => {
    const { context, data } = fakeContext([40, 40, 40, 255]);

    applyShadows(context, { width: 1, height: 1 }, { type: 'shadows', value: 60 });

    expect(Array.from(data)).toEqual([95, 95, 95, 255]);
  });

  it('writes the result back via putImageData', () => {
    const { context, putImageData } = fakeContext([20, 20, 20, 255]);

    applyShadows(context, { width: 1, height: 1 }, { type: 'shadows', value: 50 });

    expect(putImageData).toHaveBeenCalledTimes(1);
    expect(putImageData.mock.calls[0]?.[1]).toBe(0);
    expect(putImageData.mock.calls[0]?.[2]).toBe(0);
  });
});
