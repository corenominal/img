import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOpenImage } from './useOpenImage';
import { useDocumentStore } from '../stores/documentStore';

function mockOpenImage(result: Awaited<ReturnType<typeof window.imageEditor.openImage>>): void {
  window.imageEditor.openImage = vi.fn().mockResolvedValue(result);
}

describe('useOpenImage', () => {
  afterEach(() => {
    useDocumentStore.setState({ document: null, openError: null });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does nothing when the dialog is cancelled', async () => {
    mockOpenImage({ status: 'cancelled' });
    const { result } = renderHook(() => useOpenImage());

    await result.current();

    expect(useDocumentStore.getState().document).toBeNull();
    expect(useDocumentStore.getState().openError).toBeNull();
  });

  it('records a friendly error when the main process reports one', async () => {
    mockOpenImage({ status: 'error', message: 'The image could not be opened.' });
    const { result } = renderHook(() => useOpenImage());

    await result.current();

    expect(useDocumentStore.getState().openError).toBe('The image could not be opened.');
  });

  it('creates a document from a successfully opened image', async () => {
    mockOpenImage({
      status: 'opened',
      fileName: 'photo.png',
      filePath: '/tmp/photo.png',
      mimeType: 'image/png',
      data: new Uint8Array([1, 2, 3]),
    });
    const fakeBitmap = { width: 800, height: 600, close: vi.fn() };
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockResolvedValue(fakeBitmap),
    );

    const { result } = renderHook(() => useOpenImage());
    await result.current();

    await waitFor(() => {
      expect(useDocumentStore.getState().document).not.toBeNull();
    });
    const document = useDocumentStore.getState().document;
    expect(document?.filename).toBe('photo.png');
    expect(document?.width).toBe(800);
    expect(document?.height).toBe(600);
  });

  it('shows a friendly error when the image fails to decode', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockOpenImage({
      status: 'opened',
      fileName: 'corrupt.png',
      filePath: '/tmp/corrupt.png',
      mimeType: 'image/png',
      data: new Uint8Array([1, 2, 3]),
    });
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn().mockRejectedValue(new Error('decode failed')),
    );

    const { result } = renderHook(() => useOpenImage());
    await result.current();

    expect(useDocumentStore.getState().openError).toBe(
      'The image could not be opened. The file may be damaged or use an unsupported format.',
    );
  });
});
