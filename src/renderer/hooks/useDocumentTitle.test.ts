import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDocumentTitle } from './useDocumentTitle';
import { useDocumentStore } from '../stores/documentStore';
import type { ImageDocument } from '../editor/document/documentTypes';

function fakeDocument(overrides: Partial<ImageDocument> = {}): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.png',
    sourcePath: '/tmp/photo.png',
    width: 200,
    height: 100,
    source: { width: 200, height: 100, close: vi.fn() } as unknown as ImageBitmap,
    operations: [],
    dirty: false,
    ...overrides,
  };
}

describe('useDocumentTitle', () => {
  afterEach(() => {
    useDocumentStore.setState({ document: null, documentError: null, history: null });
    window.document.title = '';
  });

  it('shows just the app name with no document open', () => {
    renderHook(() => useDocumentTitle());
    expect(window.document.title).toBe('Image Editor');
  });

  it('shows the image filename with no dirty marker for a clean, unsaved-as-project document', () => {
    act(() =>
      useDocumentStore
        .getState()
        .setDocument(fakeDocument({ filename: 'photo.png', dirty: false })),
    );
    renderHook(() => useDocumentTitle());

    expect(window.document.title).toBe('photo.png — Image Editor');
  });

  it('adds a dirty marker after the filename when the document has unsaved changes', () => {
    act(() =>
      useDocumentStore.getState().setDocument(fakeDocument({ filename: 'photo.png', dirty: true })),
    );
    renderHook(() => useDocumentTitle());

    expect(window.document.title).toBe('photo.png • — Image Editor');
  });

  it('shows the project filename (basename), not the original image filename, once a project path is set', () => {
    act(() =>
      useDocumentStore.getState().setDocument(
        fakeDocument({
          filename: 'photo.png',
          projectPath: '/Users/me/Documents/holiday.imgedit',
          dirty: false,
        }),
      ),
    );
    renderHook(() => useDocumentTitle());

    expect(window.document.title).toBe('holiday.imgedit — Image Editor');
  });

  it('updates live as the document changes', () => {
    renderHook(() => useDocumentTitle());
    expect(window.document.title).toBe('Image Editor');

    act(() => useDocumentStore.getState().setDocument(fakeDocument({ filename: 'a.png' })));
    expect(window.document.title).toBe('a.png — Image Editor');

    act(() => useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 }));
    expect(window.document.title).toBe('a.png • — Image Editor');
  });
});
