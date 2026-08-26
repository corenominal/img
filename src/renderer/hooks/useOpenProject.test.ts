import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useOpenProject } from './useOpenProject';
import { useDocumentStore } from '../stores/documentStore';
import { packProject } from '../editor/project/packProject';
import type { ImageDocument } from '../editor/document/documentTypes';

function mockOpenProject(result: Awaited<ReturnType<typeof window.imageEditor.openProject>>): void {
  window.imageEditor.openProject = vi.fn().mockResolvedValue(result);
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

describe('useOpenProject', () => {
  afterEach(() => {
    useDocumentStore.setState({ document: null, documentError: null, history: null });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does nothing when the dialog is cancelled', async () => {
    mockOpenProject({ status: 'cancelled' });
    const { result } = renderHook(() => useOpenProject());

    await result.current();

    expect(useDocumentStore.getState().document).toBeNull();
    expect(useDocumentStore.getState().documentError).toBeNull();
  });

  it('records a friendly error when the main process reports one', async () => {
    mockOpenProject({ status: 'error', message: 'The project could not be opened.' });
    const { result } = renderHook(() => useOpenProject());

    await result.current();

    expect(useDocumentStore.getState().documentError).toBe('The project could not be opened.');
  });

  it('records a friendly error when the project archive fails to unpack', async () => {
    mockOpenProject({
      status: 'opened',
      filePath: '/tmp/photo.imgedit',
      data: new Uint8Array([1, 2, 3]), // not a valid zip
    });
    const { result } = renderHook(() => useOpenProject());

    await result.current();

    expect(useDocumentStore.getState().documentError).toBe(
      'This project file is damaged or is not a valid Image Editor project.',
    );
  });

  it('loads a document from a successfully opened and unpacked project', async () => {
    const fakeBitmap = { width: 400, height: 200, close: vi.fn() };
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(fakeBitmap));

    const bytes = await packProject(fakeDocument());
    mockOpenProject({ status: 'opened', filePath: '/tmp/photo.imgedit', data: bytes });

    const { result } = renderHook(() => useOpenProject());
    await result.current();

    await waitFor(() => {
      expect(useDocumentStore.getState().document).not.toBeNull();
    });
    const document = useDocumentStore.getState().document;
    expect(document?.filename).toBe('photo.jpg');
    expect(document?.operations).toEqual([{ type: 'rotate', degrees: 90 }]);
    expect(document?.dirty).toBe(false);
    expect(document?.projectPath).toBe('/tmp/photo.imgedit');
  });
});
