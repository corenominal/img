import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCropActions } from './useCropActions';
import { useCropStore } from '../stores/cropStore';
import { useDocumentStore } from '../stores/documentStore';
import { useEditorStore } from '../stores/editorStore';
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

describe('useCropActions', () => {
  afterEach(() => {
    useCropStore.setState({ rect: null, aspectRatio: 'free' });
    useDocumentStore.setState({ document: null, history: null, documentError: null });
    useEditorStore.setState({ activeTool: 'move' });
  });

  it('commit applies a rounded crop operation and returns to the move tool', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useCropStore.getState().setRect({ x: 10.4, y: 5.6, width: 100.2, height: 50.9 });
    useEditorStore.getState().setActiveTool('crop');

    const { result } = renderHook(() => useCropActions());
    result.current.commit();

    expect(useDocumentStore.getState().document?.operations).toEqual([
      { type: 'crop', x: 10, y: 6, width: 100, height: 51 },
    ]);
    expect(useCropStore.getState().rect).toBeNull();
    expect(useEditorStore.getState().activeTool).toBe('move');
  });

  it('commit does nothing when there is no pending rect', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    const { result } = renderHook(() => useCropActions());

    result.current.commit();

    expect(useDocumentStore.getState().document?.operations).toEqual([]);
  });

  it('cancel discards the pending rect without touching the document', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useCropStore.getState().setRect({ x: 0, y: 0, width: 50, height: 50 });
    useEditorStore.getState().setActiveTool('crop');

    const { result } = renderHook(() => useCropActions());
    result.current.cancel();

    expect(useCropStore.getState().rect).toBeNull();
    expect(useEditorStore.getState().activeTool).toBe('move');
    expect(useDocumentStore.getState().document?.operations).toEqual([]);
  });
});
