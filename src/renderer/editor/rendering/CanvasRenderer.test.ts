import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderDocumentToCanvas } from './CanvasRenderer';
import type { ImageDocument } from '../document/documentTypes';
import type { ImageOperation } from '../operations/ImageOperation';

function fakeDocument(width: number, height: number, operations: ImageOperation[] = []): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.png',
    sourcePath: '/tmp/photo.png',
    width,
    height,
    source: { width, height } as unknown as ImageBitmap,
    operations,
    dirty: false,
  };
}

describe('renderDocumentToCanvas', () => {
  let context: {
    clearRect: ReturnType<typeof vi.fn>;
    drawImage: ReturnType<typeof vi.fn>;
    setTransform: ReturnType<typeof vi.fn>;
    translate: ReturnType<typeof vi.fn>;
    rotate: ReturnType<typeof vi.fn>;
    scale: ReturnType<typeof vi.fn>;
    imageSmoothingEnabled: boolean;
  };

  beforeEach(() => {
    context = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      setTransform: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      imageSmoothingEnabled: true,
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
  });

  it('sizes the canvas backing store to the container size times devicePixelRatio', () => {
    const canvas = document.createElement('canvas');
    renderDocumentToCanvas(canvas, fakeDocument(4000, 3000), { zoom: 1, offsetX: 0, offsetY: 0 }, { width: 800, height: 600 }, 2);

    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
  });

  it('scales by zoom and translates the offset by devicePixelRatio', () => {
    const canvas = document.createElement('canvas');
    const doc = fakeDocument(200, 100);

    renderDocumentToCanvas(canvas, doc, { zoom: 0.5, offsetX: 10, offsetY: 20 }, { width: 400, height: 300 }, 2);

    expect(context.setTransform).toHaveBeenLastCalledWith(0.5, 0, 0, 0.5, 20, 40);
    expect(context.drawImage).toHaveBeenCalledWith(doc.source, 0, 0);
  });

  it('disables smoothing once zoomed in past actual size', () => {
    const canvas = document.createElement('canvas');
    renderDocumentToCanvas(canvas, fakeDocument(100, 100), { zoom: 4, offsetX: 0, offsetY: 0 }, { width: 400, height: 400 }, 1);

    expect(context.imageSmoothingEnabled).toBe(false);
  });

  it('keeps smoothing enabled below actual size', () => {
    const canvas = document.createElement('canvas');
    renderDocumentToCanvas(canvas, fakeDocument(100, 100), { zoom: 0.5, offsetX: 0, offsetY: 0 }, { width: 400, height: 400 }, 1);

    expect(context.imageSmoothingEnabled).toBe(true);
  });

  it('applies the operation stack transform on top of the viewport transform before drawing', () => {
    const canvas = document.createElement('canvas');
    // Source is 200x100; after a 90° rotation the document is 100x200.
    const doc: ImageDocument = {
      id: 'doc-1',
      filename: 'photo.png',
      sourcePath: '/tmp/photo.png',
      width: 100,
      height: 200,
      source: { width: 200, height: 100 } as unknown as ImageBitmap,
      operations: [{ type: 'rotate', degrees: 90 }],
      dirty: true,
    };

    renderDocumentToCanvas(canvas, doc, { zoom: 1, offsetX: 0, offsetY: 0 }, { width: 400, height: 400 }, 1);

    expect(context.translate).toHaveBeenCalledWith(50, 100);
    expect(context.rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect(context.translate).toHaveBeenCalledWith(-100, -50);
    expect(context.drawImage).toHaveBeenCalledWith(doc.source, 0, 0);
  });
});
