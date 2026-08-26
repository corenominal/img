import { act, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEditorMenuBridge } from './useEditorMenuBridge';
import { useDocumentStore } from '../stores/documentStore';
import { useResizeDialogStore } from '../stores/resizeDialogStore';
import { useExportDialogStore } from '../stores/exportDialogStore';
import type { ImageDocument } from '../editor/document/documentTypes';

function fakeDocument(): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.png',
    sourcePath: '/tmp/photo.png',
    width: 200,
    height: 100,
    source: { width: 200, height: 100, close: vi.fn() } as unknown as ImageBitmap,
    operations: [],
    dirty: false,
  };
}

function Harness(): null {
  useEditorMenuBridge();
  return null;
}

describe('useEditorMenuBridge', () => {
  afterEach(() => {
    useDocumentStore.setState({ document: null, history: null, documentError: null });
    useResizeDialogStore.setState({ isOpen: false });
    useExportDialogStore.setState({ isOpen: false });
  });

  it('reports no document and nothing to undo/redo initially', () => {
    render(<Harness />);
    expect(window.imageEditor.notifyEditorState).toHaveBeenLastCalledWith({
      hasDocument: false,
      undoLabel: null,
      redoLabel: null,
    });
  });

  it('reports the document and undo label after an operation is applied', () => {
    render(<Harness />);
    act(() => useDocumentStore.getState().setDocument(fakeDocument()));
    act(() => useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 }));

    expect(window.imageEditor.notifyEditorState).toHaveBeenLastCalledWith({
      hasDocument: true,
      undoLabel: 'Rotate Right',
      redoLabel: null,
    });
  });

  it('reports a redo label after an undo', () => {
    render(<Harness />);
    act(() => useDocumentStore.getState().setDocument(fakeDocument()));
    act(() => useDocumentStore.getState().applyOperation({ type: 'flip', axis: 'horizontal' }));
    act(() => useDocumentStore.getState().undo());

    expect(window.imageEditor.notifyEditorState).toHaveBeenLastCalledWith({
      hasDocument: true,
      undoLabel: null,
      redoLabel: 'Flip Horizontal',
    });
  });

  it('routes rotate-left menu actions to a 270° rotate operation', () => {
    render(<Harness />);
    act(() => useDocumentStore.getState().setDocument(fakeDocument()));

    const onImageActionRequested = window.imageEditor.onImageActionRequested as ReturnType<
      typeof vi.fn
    >;
    const handler = onImageActionRequested.mock.calls[0]?.[0] as (action: string) => void;
    act(() => handler('rotate-left'));

    expect(useDocumentStore.getState().document?.operations).toEqual([
      { type: 'rotate', degrees: 270 },
    ]);
  });

  it('routes a resize menu action to opening the resize dialog', () => {
    render(<Harness />);
    act(() => useDocumentStore.getState().setDocument(fakeDocument()));

    const onImageActionRequested = window.imageEditor.onImageActionRequested as ReturnType<
      typeof vi.fn
    >;
    const handler = onImageActionRequested.mock.calls[0]?.[0] as (action: string) => void;
    act(() => handler('resize'));

    expect(useResizeDialogStore.getState().isOpen).toBe(true);
  });

  it('routes an export menu request to opening the export dialog', () => {
    render(<Harness />);
    act(() => useDocumentStore.getState().setDocument(fakeDocument()));

    const onExportImageMenuRequested = window.imageEditor.onExportImageMenuRequested as ReturnType<
      typeof vi.fn
    >;
    const handler = onExportImageMenuRequested.mock.calls[0]?.[0] as () => void;
    act(() => handler());

    expect(useExportDialogStore.getState().isOpen).toBe(true);
  });

  it('routes an open-project menu request to the openProject IPC call', async () => {
    render(<Harness />);

    const onOpenProjectMenuRequested = window.imageEditor.onOpenProjectMenuRequested as ReturnType<
      typeof vi.fn
    >;
    const handler = onOpenProjectMenuRequested.mock.calls[0]?.[0] as () => void;
    await act(async () => handler());

    expect(window.imageEditor.openProject).toHaveBeenCalled();
  });

  it('routes a save-project menu request to the saveProject IPC call', async () => {
    render(<Harness />);
    act(() =>
      useDocumentStore.getState().setDocument({
        ...fakeDocument(),
        sourceData: new Uint8Array([1, 2, 3]),
        sourceMimeType: 'image/png',
      }),
    );

    const onSaveProjectMenuRequested = window.imageEditor.onSaveProjectMenuRequested as ReturnType<
      typeof vi.fn
    >;
    const handler = onSaveProjectMenuRequested.mock.calls[0]?.[0] as () => void;
    // Unlike openProject, saveProject first packs the document via JSZip
    // (a genuinely async, multi-tick operation) before it ever reaches the
    // IPC call, so the handler's fire-and-forget promise needs a moment.
    act(() => handler());
    await waitFor(() => expect(window.imageEditor.saveProject).toHaveBeenCalled());
  });

  it('routes history menu actions to undo/redo', () => {
    render(<Harness />);
    act(() => useDocumentStore.getState().setDocument(fakeDocument()));
    act(() => useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 }));

    const onHistoryActionRequested = window.imageEditor.onHistoryActionRequested as ReturnType<
      typeof vi.fn
    >;
    const handler = onHistoryActionRequested.mock.calls[0]?.[0] as (action: string) => void;
    act(() => handler('undo'));

    expect(useDocumentStore.getState().document?.operations).toEqual([]);
  });
});
