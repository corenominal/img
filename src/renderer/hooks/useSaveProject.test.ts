import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSaveProject, useSaveProjectAs } from './useSaveProject';
import { useDocumentStore } from '../stores/documentStore';
import type { ImageDocument } from '../editor/document/documentTypes';

function mockSaveProject(result: Awaited<ReturnType<typeof window.imageEditor.saveProject>>): void {
  window.imageEditor.saveProject = vi.fn().mockResolvedValue(result);
}

function mockSaveProjectAtPath(
  result: Awaited<ReturnType<typeof window.imageEditor.saveProjectAtPath>>,
): void {
  window.imageEditor.saveProjectAtPath = vi.fn().mockResolvedValue(result);
}

function fakeDocument(overrides: Partial<ImageDocument> = {}): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'holiday-photo.jpg',
    sourcePath: '/tmp/holiday-photo.jpg',
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

describe('useSaveProject ("Save")', () => {
  afterEach(() => {
    useDocumentStore.setState({ document: null, documentError: null, history: null });
  });

  it('does nothing when no document is open', async () => {
    mockSaveProject({ status: 'cancelled' });
    const { result } = renderHook(() => useSaveProject());

    await result.current();

    expect(window.imageEditor.saveProject).not.toHaveBeenCalled();
  });

  it('without a known project path, prompts via the dialog (Save As-like) and requests a filename without the extension', async () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    mockSaveProject({ status: 'saved', filePath: '/tmp/holiday-photo.imgedit' });

    const { result } = renderHook(() => useSaveProject());
    await result.current();

    expect(window.imageEditor.saveProject).toHaveBeenCalledWith(
      expect.objectContaining({ suggestedFileName: 'holiday-photo' }),
    );
    expect(window.imageEditor.saveProjectAtPath).not.toHaveBeenCalled();
    const [request] = vi.mocked(window.imageEditor.saveProject).mock.calls[0]!;
    expect(request.data).toBeInstanceOf(Uint8Array);
    expect(request.data.length).toBeGreaterThan(0);
  });

  it('with a known project path, saves quietly to that path instead of opening the dialog', async () => {
    useDocumentStore
      .getState()
      .setDocument(fakeDocument({ projectPath: '/tmp/holiday-photo.imgedit' }));
    mockSaveProjectAtPath({ status: 'saved', filePath: '/tmp/holiday-photo.imgedit' });

    const { result } = renderHook(() => useSaveProject());
    await result.current();

    expect(window.imageEditor.saveProjectAtPath).toHaveBeenCalledWith(
      expect.objectContaining({ filePath: '/tmp/holiday-photo.imgedit' }),
    );
    expect(window.imageEditor.saveProject).not.toHaveBeenCalled();
  });

  it('clears dirty and records the project path when the save succeeds', async () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    mockSaveProject({ status: 'saved', filePath: '/tmp/holiday-photo.imgedit' });

    const { result } = renderHook(() => useSaveProject());
    await result.current();

    const document = useDocumentStore.getState().document;
    expect(document?.dirty).toBe(false);
    expect(document?.projectPath).toBe('/tmp/holiday-photo.imgedit');
  });

  it('leaves the document untouched when the native save dialog is cancelled', async () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    mockSaveProject({ status: 'cancelled' });

    const { result } = renderHook(() => useSaveProject());
    await result.current();

    const document = useDocumentStore.getState().document;
    expect(document?.dirty).toBe(true);
    expect(document?.projectPath).toBeUndefined();
    expect(useDocumentStore.getState().documentError).toBeNull();
  });

  it('records a friendly error when the main process reports one', async () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    mockSaveProject({ status: 'error', message: 'Disk is full.' });

    const { result } = renderHook(() => useSaveProject());
    await result.current();

    expect(useDocumentStore.getState().documentError).toBe('Disk is full.');
  });

  it('records a friendly error when a quiet save to a known path fails', async () => {
    useDocumentStore
      .getState()
      .setDocument(fakeDocument({ projectPath: '/tmp/holiday-photo.imgedit' }));
    mockSaveProjectAtPath({ status: 'error', message: 'Disk is full.' });

    const { result } = renderHook(() => useSaveProject());
    await result.current();

    expect(useDocumentStore.getState().documentError).toBe('Disk is full.');
  });

  it('records a friendly error when the document cannot be packed (no source data)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useDocumentStore
      .getState()
      .setDocument(fakeDocument({ sourceData: undefined, sourceMimeType: undefined }));

    const { result } = renderHook(() => useSaveProject());
    await result.current();

    expect(useDocumentStore.getState().documentError).toBe('The project could not be saved.');
    expect(window.imageEditor.saveProject).not.toHaveBeenCalled();
  });
});

describe('useSaveProjectAs ("Save As")', () => {
  afterEach(() => {
    useDocumentStore.setState({ document: null, documentError: null, history: null });
  });

  it('does nothing when no document is open', async () => {
    const { result } = renderHook(() => useSaveProjectAs());

    await result.current();

    expect(window.imageEditor.saveProject).not.toHaveBeenCalled();
  });

  it('always opens the dialog, even when the document already has a known project path', async () => {
    useDocumentStore
      .getState()
      .setDocument(fakeDocument({ projectPath: '/tmp/holiday-photo.imgedit' }));
    mockSaveProject({ status: 'saved', filePath: '/tmp/holiday-photo-copy.imgedit' });

    const { result } = renderHook(() => useSaveProjectAs());
    await result.current();

    expect(window.imageEditor.saveProject).toHaveBeenCalled();
    expect(window.imageEditor.saveProjectAtPath).not.toHaveBeenCalled();
  });

  it('retargets the project path to wherever the user just saved', async () => {
    useDocumentStore
      .getState()
      .setDocument(fakeDocument({ projectPath: '/tmp/holiday-photo.imgedit' }));
    mockSaveProject({ status: 'saved', filePath: '/tmp/holiday-photo-copy.imgedit' });

    const { result } = renderHook(() => useSaveProjectAs());
    await result.current();

    const document = useDocumentStore.getState().document;
    expect(document?.projectPath).toBe('/tmp/holiday-photo-copy.imgedit');
    expect(document?.dirty).toBe(false);
  });

  it('records a friendly error when the main process reports one', async () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    mockSaveProject({ status: 'error', message: 'Disk is full.' });

    const { result } = renderHook(() => useSaveProjectAs());
    await result.current();

    expect(useDocumentStore.getState().documentError).toBe('Disk is full.');
  });
});
