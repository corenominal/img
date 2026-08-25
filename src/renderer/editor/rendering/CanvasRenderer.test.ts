import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToCanvas } from './CanvasRenderer';

function fakeSource(width: number, height: number): ImageBitmap {
  return { width, height } as unknown as ImageBitmap;
}

describe('renderToCanvas', () => {
  let context: {
    clearRect: ReturnType<typeof vi.fn>;
    drawImage: ReturnType<typeof vi.fn>;
    setTransform: ReturnType<typeof vi.fn>;
    imageSmoothingEnabled: boolean;
  };

  beforeEach(() => {
    context = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      setTransform: vi.fn(),
      imageSmoothingEnabled: true,
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
  });

  it('sizes the canvas backing store to the container size times devicePixelRatio', () => {
    const canvas = document.createElement('canvas');
    renderToCanvas(canvas, fakeSource(4000, 3000), { zoom: 1, offsetX: 0, offsetY: 0 }, { width: 800, height: 600 }, 2);

    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
  });

  it('scales by zoom and translates the offset by devicePixelRatio', () => {
    const canvas = document.createElement('canvas');
    const source = fakeSource(200, 100);

    renderToCanvas(canvas, source, { zoom: 0.5, offsetX: 10, offsetY: 20 }, { width: 400, height: 300 }, 2);

    expect(context.setTransform).toHaveBeenLastCalledWith(0.5, 0, 0, 0.5, 20, 40);
    expect(context.drawImage).toHaveBeenCalledWith(source, 0, 0);
  });

  it('disables smoothing once zoomed in past actual size', () => {
    const canvas = document.createElement('canvas');
    renderToCanvas(canvas, fakeSource(100, 100), { zoom: 4, offsetX: 0, offsetY: 0 }, { width: 400, height: 400 }, 1);

    expect(context.imageSmoothingEnabled).toBe(false);
  });

  it('keeps smoothing enabled below actual size', () => {
    const canvas = document.createElement('canvas');
    renderToCanvas(canvas, fakeSource(100, 100), { zoom: 0.5, offsetX: 0, offsetY: 0 }, { width: 400, height: 400 }, 1);

    expect(context.imageSmoothingEnabled).toBe(true);
  });
});
