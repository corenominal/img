import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderDocumentToBlob } from './renderExport';
import type { ImageDocument } from '../document/documentTypes';

interface FakeContext {
  fillStyle: string;
  fillRect: ReturnType<typeof vi.fn>;
  drawImage: ReturnType<typeof vi.fn>;
}

describe('renderDocumentToBlob', () => {
  let context: FakeContext;
  let toBlobMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    context = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    toBlobMock = vi.fn(function (this: HTMLCanvasElement, callback: BlobCallback) {
      callback(new Blob(['fake'], { type: 'image/png' }));
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(toBlobMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function fakeDocument(overrides: Partial<ImageDocument> = {}): ImageDocument {
    return {
      id: 'doc-1',
      filename: 'photo.png',
      sourcePath: '/tmp/photo.png',
      width: 100,
      height: 80,
      source: { width: 100, height: 80, close: vi.fn() } as unknown as ImageBitmap,
      operations: [],
      dirty: false,
      ...overrides,
    };
  }

  it('sizes the export canvas to the document, not the source bitmap', async () => {
    const document = fakeDocument({
      width: 50,
      height: 40,
      source: { width: 200, height: 160, close: vi.fn() } as unknown as ImageBitmap,
    });

    await renderDocumentToBlob(document, { format: 'png', quality: 1, preserveTransparency: true });

    expect(context.drawImage).toHaveBeenCalledWith(document.source, 0, 0);
  });

  it('flattens onto an opaque background for jpeg (no alpha support)', async () => {
    await renderDocumentToBlob(fakeDocument(), {
      format: 'jpeg',
      quality: 0.8,
      preserveTransparency: true,
    });

    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 100, 80);
    expect(toBlobMock).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.8);
  });

  it('preserves transparency for png when requested (no background fill)', async () => {
    await renderDocumentToBlob(fakeDocument(), {
      format: 'png',
      quality: 1,
      preserveTransparency: true,
    });

    expect(context.fillRect).not.toHaveBeenCalled();
    expect(toBlobMock).toHaveBeenCalledWith(expect.any(Function), 'image/png', undefined);
  });

  it('flattens onto an opaque background for png when transparency is not preserved', async () => {
    await renderDocumentToBlob(fakeDocument(), {
      format: 'png',
      quality: 1,
      preserveTransparency: false,
    });

    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 100, 80);
  });

  it('never flattens the background for webp (alpha is always kept)', async () => {
    await renderDocumentToBlob(fakeDocument(), {
      format: 'webp',
      quality: 0.9,
      preserveTransparency: false,
    });

    expect(context.fillRect).not.toHaveBeenCalled();
    expect(toBlobMock).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.9);
  });

  it('rejects when the canvas fails to produce a blob', async () => {
    toBlobMock.mockImplementation(function (this: HTMLCanvasElement, callback: BlobCallback) {
      callback(null);
    });

    await expect(
      renderDocumentToBlob(fakeDocument(), {
        format: 'png',
        quality: 1,
        preserveTransparency: true,
      }),
    ).rejects.toThrow('Failed to encode the image.');
  });

  it('rejects when a 2D context is not available', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    await expect(
      renderDocumentToBlob(fakeDocument(), {
        format: 'png',
        quality: 1,
        preserveTransparency: true,
      }),
    ).rejects.toThrow('2D canvas context is not available');
  });
});
