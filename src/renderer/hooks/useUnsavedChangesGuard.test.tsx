import { act, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';
import { useDocumentStore } from '../stores/documentStore';
import type { ImageDocument } from '../editor/document/documentTypes';

function fakeDocument(overrides: Partial<ImageDocument> = {}): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.jpg',
    sourcePath: '/tmp/photo.jpg',
    width: 400,
    height: 200,
    source: { width: 400, height: 200, close: vi.fn() } as unknown as ImageBitmap,
    operations: [],
    dirty: true,
    sourceData: new Uint8Array([1, 2, 3, 4]),
    sourceMimeType: 'image/jpeg',
    ...overrides,
  };
}

function Harness(): null {
  useUnsavedChangesGuard();
  return null;
}

function getCloseHandler(): () => void {
  const onWindowCloseRequested = window.imageEditor.onWindowCloseRequested as ReturnType<
    typeof vi.fn
  >;
  return onWindowCloseRequested.mock.calls[0]?.[0] as () => void;
}

describe('useUnsavedChangesGuard', () => {
  afterEach(() => {
    useDocumentStore.setState({ document: null, documentError: null, history: null });
  });

  it('allows closing immediately when no document is open', async () => {
    render(<Harness />);

    act(() => getCloseHandler()());

    await waitFor(() => expect(window.imageEditor.respondToWindowClose).toHaveBeenCalledWith(true));
    expect(window.imageEditor.confirmDiscardChanges).not.toHaveBeenCalled();
  });

  it('allows closing immediately when the document is clean', async () => {
    useDocumentStore.getState().setDocument(fakeDocument({ dirty: false }));
    render(<Harness />);

    act(() => getCloseHandler()());

    await waitFor(() => expect(window.imageEditor.respondToWindowClose).toHaveBeenCalledWith(true));
    expect(window.imageEditor.confirmDiscardChanges).not.toHaveBeenCalled();
  });

  it('asks for confirmation, naming the document, when it is dirty', async () => {
    useDocumentStore.getState().setDocument(fakeDocument({ filename: 'photo.jpg', dirty: true }));
    window.imageEditor.confirmDiscardChanges = vi.fn().mockResolvedValue('cancel');
    render(<Harness />);

    act(() => getCloseHandler()());

    await waitFor(() =>
      expect(window.imageEditor.confirmDiscardChanges).toHaveBeenCalledWith('photo.jpg'),
    );
  });

  it('names the document by its project filename once it has one', async () => {
    useDocumentStore
      .getState()
      .setDocument(fakeDocument({ dirty: true, projectPath: '/tmp/holiday.imgedit' }));
    window.imageEditor.confirmDiscardChanges = vi.fn().mockResolvedValue('cancel');
    render(<Harness />);

    act(() => getCloseHandler()());

    await waitFor(() =>
      expect(window.imageEditor.confirmDiscardChanges).toHaveBeenCalledWith('holiday.imgedit'),
    );
  });

  it('does not close when the user cancels', async () => {
    useDocumentStore.getState().setDocument(fakeDocument({ dirty: true }));
    window.imageEditor.confirmDiscardChanges = vi.fn().mockResolvedValue('cancel');
    render(<Harness />);

    act(() => getCloseHandler()());

    await waitFor(() =>
      expect(window.imageEditor.respondToWindowClose).toHaveBeenCalledWith(false),
    );
  });

  it('closes without saving when the user chooses to discard', async () => {
    useDocumentStore.getState().setDocument(fakeDocument({ dirty: true }));
    window.imageEditor.confirmDiscardChanges = vi.fn().mockResolvedValue('discard');
    render(<Harness />);

    act(() => getCloseHandler()());

    await waitFor(() => expect(window.imageEditor.respondToWindowClose).toHaveBeenCalledWith(true));
    expect(window.imageEditor.saveProject).not.toHaveBeenCalled();
  });

  it('saves then closes when the user chooses to save and the save succeeds', async () => {
    useDocumentStore.getState().setDocument(fakeDocument({ dirty: true }));
    window.imageEditor.confirmDiscardChanges = vi.fn().mockResolvedValue('save');
    window.imageEditor.saveProject = vi
      .fn()
      .mockResolvedValue({ status: 'saved', filePath: '/tmp/photo.imgedit' });
    render(<Harness />);

    act(() => getCloseHandler()());

    await waitFor(() => expect(window.imageEditor.respondToWindowClose).toHaveBeenCalledWith(true));
    expect(useDocumentStore.getState().document?.dirty).toBe(false);
  });

  it('does not close when the user chooses to save but the save dialog is cancelled', async () => {
    useDocumentStore.getState().setDocument(fakeDocument({ dirty: true }));
    window.imageEditor.confirmDiscardChanges = vi.fn().mockResolvedValue('save');
    window.imageEditor.saveProject = vi.fn().mockResolvedValue({ status: 'cancelled' });
    render(<Harness />);

    act(() => getCloseHandler()());

    await waitFor(() =>
      expect(window.imageEditor.respondToWindowClose).toHaveBeenCalledWith(false),
    );
  });
});
