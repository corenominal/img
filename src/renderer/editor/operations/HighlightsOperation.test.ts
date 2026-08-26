import { describe, expect, it, vi } from 'vitest';
import { applyHighlights, highlightsSize } from './HighlightsOperation';

describe('highlightsSize', () => {
  it('does not change the dimensions', () => {
    expect(highlightsSize({ width: 200, height: 100 })).toEqual({ width: 200, height: 100 });
  });
});

describe('applyHighlights', () => {
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
    const { context, getImageData, putImageData } = fakeContext([200, 200, 200, 255]);

    applyHighlights(context, { width: 1, height: 1 }, { type: 'highlights', value: 0 });

    expect(getImageData).not.toHaveBeenCalled();
    expect(putImageData).not.toHaveBeenCalled();
  });

  it('leaves mid-gray and darker pixels untouched, regardless of value', () => {
    // Luminance 127/255 ≈ 0.498, just below the 0.5 "not yet a highlight"
    // threshold, so its weight — and therefore any effect — is exactly 0.
    const { context, data } = fakeContext([127, 127, 127, 255, 40, 60, 20, 200]);

    applyHighlights(context, { width: 1, height: 2 }, { type: 'highlights', value: 100 });

    expect(Array.from(data)).toEqual([127, 127, 127, 255, 40, 60, 20, 200]);
  });

  it('brightens pure white further at a positive value, leaving alpha untouched', () => {
    const { context, data } = fakeContext([255, 255, 255, 128]);

    applyHighlights(context, { width: 1, height: 1 }, { type: 'highlights', value: 100 });

    // multiplier at luminance 1 is 1 + (100/100)*1 = 2, clamped at 255.
    expect(Array.from(data)).toEqual([255, 255, 255, 128]);
  });

  it('darkens pure white toward black at a full negative value ("recovering" highlights)', () => {
    const { context, data } = fakeContext([255, 255, 255, 128]);

    applyHighlights(context, { width: 1, height: 1 }, { type: 'highlights', value: -100 });

    // multiplier at luminance 1 is 1 + (-100/100)*1 = 0.
    expect(Array.from(data)).toEqual([0, 0, 0, 128]);
  });

  it('partially affects a bright-but-not-pure-white pixel, scaled by how much of a highlight it is', () => {
    const { context, data } = fakeContext([191, 191, 191, 255]);

    applyHighlights(context, { width: 1, height: 1 }, { type: 'highlights', value: 40 });

    // luminance 191/255 ≈ 0.749 -> weight ≈ 0.497 -> multiplier ≈ 1.199 ->
    // 191 * 1.199 ≈ 229 (a real change, but nowhere near the +40% a
    // fully-white pixel would get).
    expect(Array.from(data)).toEqual([229, 229, 229, 255]);
  });

  it('writes the result back via putImageData', () => {
    const { context, putImageData } = fakeContext([220, 220, 220, 255]);

    applyHighlights(context, { width: 1, height: 1 }, { type: 'highlights', value: 50 });

    expect(putImageData).toHaveBeenCalledTimes(1);
    expect(putImageData.mock.calls[0]?.[1]).toBe(0);
    expect(putImageData.mock.calls[0]?.[2]).toBe(0);
  });
});
