import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOpenAtPath } from './useOpenAtPath';
import { useDocumentStore } from '../stores/documentStore';
import { packProject } from '../editor/project/packProject';
import type { ImageDocument } from '../editor/document/documentTypes';

function mockOpenAtPath(result: Awaited<ReturnType<typeof window.imageEditor.openAtPath>>): void {
  window.imageEditor.openAtPath = vi.fn().mockResolvedValue(result);
}

function fakeDocument(overrides: Partial<ImageDocument> = {}): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.jpg',
    sourcePath: '/tmp/photo.jpg',
    width: 400,
    height: 200,
    source: { width: 400, height: 200, close: vi.fn() } as unknown as ImageBitmap,
    operations: [{ type: 'rotate', degrees: 90 }],
    dirty: true,
    sourceData: new Uint8Array([1, 2, 3, 4]),
    sourceMimeType: 'image/jpeg',
    ...overrides,
  };
}

describe('useOpenAtPath', () => {
  afterEach(() => {
    useDocumentStore.setState({ document: null, documentError: null, history: null });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('passes the given path straight through to the main process', async () => {
    mockOpenAtPath({ status: 'error', message: 'nope' });
    const { result } = renderHook(() => useOpenAtPath());

    await result.current('/Users/me/holiday.png');

    expect(window.imageEditor.openAtPath).toHaveBeenCalledWith('/Users/me/holiday.png');
  });

  it('records a friendly error when the main process reports one (e.g. unsupported file type)', async () => {
    mockOpenAtPath({ status: 'error', message: 'This file type is not supported.' });
    const { result } = renderHook(() => useOpenAtPath());

    await result.current('/Users/me/notes.txt');

    expect(useDocumentStore.getState().documentError).toBe('This file type is not supported.');
  });

  it('decodes an opened image into a document', async () => {
    const fakeBitmap = { width: 320, height: 200, close: vi.fn() };
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(fakeBitmap));
    mockOpenAtPath({
      status: 'opened-image',
      fileName: 'holiday.png',
      filePath: '/Users/me/holiday.png',
      mimeType: 'image/png',
      data: new Uint8Array([1, 2, 3]),
    });

    const { result } = renderHook(() => useOpenAtPath());
    await result.current('/Users/me/holiday.png');

    await waitFor(() => expect(useDocumentStore.getState().document).not.toBeNull());
    const document = useDocumentStore.getState().document;
    expect(document?.filename).toBe('holiday.png');
    expect(document?.width).toBe(320);
    expect(document?.projectPath).toBeUndefined();
  });

  it('shows a friendly error when a dropped/opened image fails to decode', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode failed')));
    mockOpenAtPath({
      status: 'opened-image',
      fileName: 'corrupt.png',
      filePath: '/Users/me/corrupt.png',
      mimeType: 'image/png',
      data: new Uint8Array([1, 2, 3]),
    });

    const { result } = renderHook(() => useOpenAtPath());
    await result.current('/Users/me/corrupt.png');

    expect(useDocumentStore.getState().documentError).toBe(
      'The image could not be opened. The file may be damaged or use an unsupported format.',
    );
  });

  it('unpacks an opened project into a document', async () => {
    const fakeBitmap = { width: 400, height: 200, close: vi.fn() };
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(fakeBitmap));
    const bytes = await packProject(fakeDocument());
    mockOpenAtPath({
      status: 'opened-project',
      filePath: '/Users/me/holiday.imgedit',
      data: bytes,
    });

    const { result } = renderHook(() => useOpenAtPath());
    await result.current('/Users/me/holiday.imgedit');

    await waitFor(() => expect(useDocumentStore.getState().document).not.toBeNull());
    const document = useDocumentStore.getState().document;
    expect(document?.operations).toEqual([{ type: 'rotate', degrees: 90 }]);
    expect(document?.dirty).toBe(false);
    expect(document?.projectPath).toBe('/Users/me/holiday.imgedit');
  });

  it('records a friendly error when an opened project archive fails to unpack', async () => {
    mockOpenAtPath({
      status: 'opened-project',
      filePath: '/Users/me/corrupt.imgedit',
      data: new Uint8Array([1, 2, 3]), // not a valid zip
    });

    const { result } = renderHook(() => useOpenAtPath());
    await result.current('/Users/me/corrupt.imgedit');

    expect(useDocumentStore.getState().documentError).toBe(
      'This project file is damaged or is not a valid Image Editor project.',
    );
  });
});
