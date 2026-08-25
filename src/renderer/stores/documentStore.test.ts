import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDocumentStore } from './documentStore';
import type { ImageDocument } from '../editor/document/documentTypes';

function fakeDocument(overrides: Partial<ImageDocument> = {}): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.png',
    sourcePath: '/tmp/photo.png',
    width: 100,
    height: 100,
    source: { width: 100, height: 100, close: vi.fn() } as unknown as ImageBitmap,
    operations: [],
    dirty: false,
    ...overrides,
  };
}

describe('documentStore', () => {
  afterEach(() => {
    useDocumentStore.setState({ document: null, openError: null });
  });

  it('sets the document and clears any open error', () => {
    useDocumentStore.setState({ openError: 'previous error' });
    const document = fakeDocument();

    useDocumentStore.getState().setDocument(document);

    expect(useDocumentStore.getState().document).toBe(document);
    expect(useDocumentStore.getState().openError).toBeNull();
  });

  it('closes the previous bitmap when replaced by a new document', () => {
    const first = fakeDocument({ id: 'doc-1' });
    const second = fakeDocument({ id: 'doc-2' });

    useDocumentStore.getState().setDocument(first);
    useDocumentStore.getState().setDocument(second);

    expect(first.source.close).toHaveBeenCalledOnce();
    expect(useDocumentStore.getState().document).toBe(second);
  });

  it('records an open error message', () => {
    useDocumentStore.getState().setOpenError('Something went wrong');
    expect(useDocumentStore.getState().openError).toBe('Something went wrong');
  });
});
