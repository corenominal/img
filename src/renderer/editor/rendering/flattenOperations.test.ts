import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flattenOperations } from './flattenOperations';
import type { ImageOperation } from '../operations/ImageOperation';

// jsdom has no real 2D canvas backend, so this verifies the *orchestration*
// (each operation gets its own correctly-sized canvas, chained via the
// right drawImage calls) rather than actual pixels. The real-world pixel
// correctness of crop composed with a later rotation is covered by an e2e
// screenshot test against the genuine Electron/Chromium canvas.
interface FakeContext {
  drawImage: ReturnType<typeof vi.fn>;
  translate: ReturnType<typeof vi.fn>;
  rotate: ReturnType<typeof vi.fn>;
  scale: ReturnType<typeof vi.fn>;
  filter: string;
  imageSmoothingEnabled: boolean;
  imageSmoothingQuality: string;
  getImageData: ReturnType<typeof vi.fn>;
  putImageData: ReturnType<typeof vi.fn>;
}

describe('flattenOperations', () => {
  let contexts: FakeContext[];

  beforeEach(() => {
    contexts = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      const context: FakeContext = {
        drawImage: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        filter: 'none',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'low',
        getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray([10, 20, 30, 255]) }),
        putImageData: vi.fn(),
      };
      contexts.push(context);
      return context as unknown as CanvasRenderingContext2D;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function fakeSource(width: number, height: number): ImageBitmap {
    return { width, height } as unknown as ImageBitmap;
  }

  it('returns the source unchanged when there are no operations', () => {
    const source = fakeSource(10, 10);
    expect(flattenOperations(source, [])).toBe(source);
    expect(contexts).toHaveLength(0);
  });

  it("creates one canvas per operation, sized to that step's output", () => {
    const source = fakeSource(200, 100);
    const operations: ImageOperation[] = [
      { type: 'rotate', degrees: 90 }, // -> 100x200
      { type: 'crop', x: 0, y: 0, width: 40, height: 60 }, // -> 40x60
    ];

    const result = flattenOperations(source, operations) as HTMLCanvasElement;

    expect(result.width).toBe(40);
    expect(result.height).toBe(60);
    expect(contexts).toHaveLength(2);
  });

  it('draws the crop step with a source-rect matching the operation, regardless of what precedes it', () => {
    const source = fakeSource(100, 100);
    const operations: ImageOperation[] = [
      { type: 'rotate', degrees: 90 },
      { type: 'crop', x: 10, y: 20, width: 30, height: 40 },
    ];

    flattenOperations(source, operations);

    const cropContext = contexts[1];
    expect(cropContext?.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      10,
      20,
      30,
      40,
      0,
      0,
      30,
      40,
    );
  });

  it("chains each step's output canvas into the next step's drawImage call", () => {
    const source = fakeSource(100, 100);
    const operations: ImageOperation[] = [
      { type: 'flip', axis: 'horizontal' },
      { type: 'flip', axis: 'vertical' },
    ];

    flattenOperations(source, operations);

    const [firstContext, secondContext] = contexts;
    // First step draws the original source...
    expect(firstContext?.drawImage).toHaveBeenCalledWith(source, 0, 0);
    // ...and the second step draws whatever canvas the first step produced,
    // not the original source again.
    const secondCallArg = secondContext?.drawImage.mock.calls[0]?.[0];
    expect(secondCallArg).not.toBe(source);
    expect(secondCallArg).toBeInstanceOf(HTMLCanvasElement);
  });

  it('applies a colour adjustment via the canvas filter, leaving size unchanged', () => {
    const source = fakeSource(100, 80);
    const operations: ImageOperation[] = [{ type: 'brightness', value: 20 }];

    const result = flattenOperations(source, operations) as HTMLCanvasElement;

    expect(result.width).toBe(100);
    expect(result.height).toBe(80);
    expect(contexts[0]?.filter).toBe('brightness(1.2)');
    expect(contexts[0]?.drawImage).toHaveBeenCalledWith(source, 0, 0);
  });

  it('scales into the target size for a resize operation', () => {
    const source = fakeSource(200, 100);
    const operations: ImageOperation[] = [
      { type: 'resize', width: 100, height: 50, resampling: 'pixelated' },
    ];

    const result = flattenOperations(source, operations) as HTMLCanvasElement;

    expect(result.width).toBe(100);
    expect(result.height).toBe(50);
    expect(contexts[0]?.imageSmoothingEnabled).toBe(false);
    expect(contexts[0]?.drawImage).toHaveBeenCalledWith(source, 0, 0, 100, 50);
  });

  it('draws the source before rewriting pixels for an exposure operation, leaving size unchanged', () => {
    const source = fakeSource(100, 80);
    const operations: ImageOperation[] = [{ type: 'exposure', value: 50 }];

    const result = flattenOperations(source, operations) as HTMLCanvasElement;

    expect(result.width).toBe(100);
    expect(result.height).toBe(80);
    expect(contexts[0]?.drawImage).toHaveBeenCalledWith(source, 0, 0);
    expect(contexts[0]?.getImageData).toHaveBeenCalledWith(0, 0, 100, 80);
    expect(contexts[0]?.putImageData).toHaveBeenCalled();
  });

  it('draws the source before rewriting pixels for a highlights operation, leaving size unchanged', () => {
    const source = fakeSource(100, 80);
    const operations: ImageOperation[] = [{ type: 'highlights', value: -30 }];

    const result = flattenOperations(source, operations) as HTMLCanvasElement;

    expect(result.width).toBe(100);
    expect(result.height).toBe(80);
    expect(contexts[0]?.drawImage).toHaveBeenCalledWith(source, 0, 0);
    expect(contexts[0]?.getImageData).toHaveBeenCalledWith(0, 0, 100, 80);
    expect(contexts[0]?.putImageData).toHaveBeenCalled();
  });

  it('draws the source before rewriting pixels for a shadows operation, leaving size unchanged', () => {
    const source = fakeSource(100, 80);
    const operations: ImageOperation[] = [{ type: 'shadows', value: 30 }];

    const result = flattenOperations(source, operations) as HTMLCanvasElement;

    expect(result.width).toBe(100);
    expect(result.height).toBe(80);
    expect(contexts[0]?.drawImage).toHaveBeenCalledWith(source, 0, 0);
    expect(contexts[0]?.getImageData).toHaveBeenCalledWith(0, 0, 100, 80);
    expect(contexts[0]?.putImageData).toHaveBeenCalled();
  });

  it('draws the source before rewriting pixels for a temperature operation, leaving size unchanged', () => {
    const source = fakeSource(100, 80);
    const operations: ImageOperation[] = [{ type: 'temperature', value: -40 }];

    const result = flattenOperations(source, operations) as HTMLCanvasElement;

    expect(result.width).toBe(100);
    expect(result.height).toBe(80);
    expect(contexts[0]?.drawImage).toHaveBeenCalledWith(source, 0, 0);
    expect(contexts[0]?.getImageData).toHaveBeenCalledWith(0, 0, 100, 80);
    expect(contexts[0]?.putImageData).toHaveBeenCalled();
  });

  it('draws the source before rewriting pixels for a tint operation, leaving size unchanged', () => {
    const source = fakeSource(100, 80);
    const operations: ImageOperation[] = [{ type: 'tint', value: 25 }];

    const result = flattenOperations(source, operations) as HTMLCanvasElement;

    expect(result.width).toBe(100);
    expect(result.height).toBe(80);
    expect(contexts[0]?.drawImage).toHaveBeenCalledWith(source, 0, 0);
    expect(contexts[0]?.getImageData).toHaveBeenCalledWith(0, 0, 100, 80);
    expect(contexts[0]?.putImageData).toHaveBeenCalled();
  });

  it('draws the source before rewriting pixels for a vibrance operation, leaving size unchanged', () => {
    const source = fakeSource(100, 80);
    const operations: ImageOperation[] = [{ type: 'vibrance', value: 30 }];

    const result = flattenOperations(source, operations) as HTMLCanvasElement;

    expect(result.width).toBe(100);
    expect(result.height).toBe(80);
    expect(contexts[0]?.drawImage).toHaveBeenCalledWith(source, 0, 0);
    expect(contexts[0]?.getImageData).toHaveBeenCalledWith(0, 0, 100, 80);
    expect(contexts[0]?.putImageData).toHaveBeenCalled();
  });

  it('draws the source before rewriting pixels for a gamma operation, leaving size unchanged', () => {
    const source = fakeSource(100, 80);
    const operations: ImageOperation[] = [{ type: 'gamma', value: -20 }];

    const result = flattenOperations(source, operations) as HTMLCanvasElement;

    expect(result.width).toBe(100);
    expect(result.height).toBe(80);
    expect(contexts[0]?.drawImage).toHaveBeenCalledWith(source, 0, 0);
    expect(contexts[0]?.getImageData).toHaveBeenCalledWith(0, 0, 100, 80);
    expect(contexts[0]?.putImageData).toHaveBeenCalled();
  });

  it('draws the source before rewriting pixels for a black point operation, leaving size unchanged', () => {
    const source = fakeSource(100, 80);
    const operations: ImageOperation[] = [{ type: 'blackPoint', value: 40 }];

    const result = flattenOperations(source, operations) as HTMLCanvasElement;

    expect(result.width).toBe(100);
    expect(result.height).toBe(80);
    expect(contexts[0]?.drawImage).toHaveBeenCalledWith(source, 0, 0);
    expect(contexts[0]?.getImageData).toHaveBeenCalledWith(0, 0, 100, 80);
    expect(contexts[0]?.putImageData).toHaveBeenCalled();
  });
});
