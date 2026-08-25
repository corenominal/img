import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderDocumentToCanvas } from './CanvasRenderer';
import type { ImageDocument } from '../document/documentTypes';

function fakeDocument(width: number, height: number): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.png',
    sourcePath: '/tmp/photo.png',
    width,
    height,
    source: { width, height } as unknown as ImageBitmap,
    operations: [],
    dirty: false,
  };
}

describe('renderDocumentToCanvas', () => {
  let context: { clearRect: ReturnType<typeof vi.fn>; drawImage: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    context = { clearRect: vi.fn(), drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
  });

  it('sizes the canvas to the document dimensions', () => {
    const canvas = document.createElement('canvas');
    renderDocumentToCanvas(canvas, fakeDocument(4000, 3000));

    expect(canvas.width).toBe(4000);
    expect(canvas.height).toBe(3000);
  });

  it('draws the source bitmap onto the canvas', () => {
    const canvas = document.createElement('canvas');
    const doc = fakeDocument(200, 100);

    renderDocumentToCanvas(canvas, doc);

    expect(context.clearRect).toHaveBeenCalledWith(0, 0, 200, 100);
    expect(context.drawImage).toHaveBeenCalledWith(doc.source, 0, 0);
  });
});
