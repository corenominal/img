import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDocumentStore } from './documentStore';
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

describe('documentStore', () => {
  afterEach(() => {
    useDocumentStore.setState({ document: null, documentError: null, history: null });
  });

  it('sets the document and clears any open error', () => {
    useDocumentStore.setState({ documentError: 'previous error' });
    const document = fakeDocument();

    useDocumentStore.getState().setDocument(document);

    expect(useDocumentStore.getState().document).toBe(document);
    expect(useDocumentStore.getState().documentError).toBeNull();
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
    useDocumentStore.getState().setDocumentError('Something went wrong');
    expect(useDocumentStore.getState().documentError).toBe('Something went wrong');
  });

  it('starts a fresh history baseline when a document is opened', () => {
    const document = fakeDocument();
    useDocumentStore.getState().setDocument(document);

    const { history } = useDocumentStore.getState();
    expect(history).toEqual({ past: [], present: document, future: [] });
  });

  describe('applyOperation', () => {
    it('appends the operation, marks the document dirty, and updates dimensions', () => {
      useDocumentStore.getState().setDocument(fakeDocument());

      useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 });

      const { document } = useDocumentStore.getState();
      expect(document?.operations).toEqual([{ type: 'rotate', degrees: 90 }]);
      expect(document?.dirty).toBe(true);
      // 200x100 rotated 90° becomes 100x200.
      expect(document?.width).toBe(100);
      expect(document?.height).toBe(200);
    });

    it('does nothing when no document is open', () => {
      useDocumentStore.getState().applyOperation({ type: 'flip', axis: 'horizontal' });
      expect(useDocumentStore.getState().document).toBeNull();
    });

    it('is a no-op if called again on a plain rotate+rotate that returns to original dimensions', () => {
      useDocumentStore.getState().setDocument(fakeDocument());
      useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 });
      useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 });

      const { document } = useDocumentStore.getState();
      expect(document?.width).toBe(200);
      expect(document?.height).toBe(100);
      expect(document?.operations).toHaveLength(2);
    });

    it('sets dimensions directly from a crop operation, independent of the prior size', () => {
      useDocumentStore.getState().setDocument(fakeDocument());
      useDocumentStore
        .getState()
        .applyOperation({ type: 'crop', x: 20, y: 10, width: 60, height: 45 });

      const { document } = useDocumentStore.getState();
      expect(document?.width).toBe(60);
      expect(document?.height).toBe(45);
      expect(document?.dirty).toBe(true);
    });
  });

  describe('undo/redo', () => {
    it('restores the previous document state, including its dirty flag and dimensions', () => {
      const original = fakeDocument();
      useDocumentStore.getState().setDocument(original);

      useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 });
      expect(useDocumentStore.getState().document?.dirty).toBe(true);

      useDocumentStore.getState().undo();

      const { document } = useDocumentStore.getState();
      expect(document).toEqual(original);
      expect(document?.dirty).toBe(false);
      expect(document?.width).toBe(200);
      expect(document?.height).toBe(100);
    });

    it('redo reapplies the undone operation', () => {
      useDocumentStore.getState().setDocument(fakeDocument());
      useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 });
      const afterRotate = useDocumentStore.getState().document;

      useDocumentStore.getState().undo();
      useDocumentStore.getState().redo();

      expect(useDocumentStore.getState().document).toEqual(afterRotate);
    });

    it('clears the redo branch once a new operation is applied after an undo', () => {
      useDocumentStore.getState().setDocument(fakeDocument());
      useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 });
      useDocumentStore.getState().undo();
      expect(useDocumentStore.getState().history?.future).toHaveLength(1);

      useDocumentStore.getState().applyOperation({ type: 'flip', axis: 'vertical' });

      expect(useDocumentStore.getState().history?.future).toHaveLength(0);
    });

    it('undo/redo are no-ops when there is nothing to undo or redo', () => {
      const document = fakeDocument();
      useDocumentStore.getState().setDocument(document);

      useDocumentStore.getState().undo();
      expect(useDocumentStore.getState().document).toEqual(document);

      useDocumentStore.getState().redo();
      expect(useDocumentStore.getState().document).toEqual(document);
    });

    it('supports repeated undo/redo across a chain of operations without corrupting history', () => {
      const original = fakeDocument();
      useDocumentStore.getState().setDocument(original);

      useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 }); // 100x200
      useDocumentStore.getState().applyOperation({ type: 'flip', axis: 'horizontal' }); // 100x200
      useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 }); // 200x100
      const afterThree = useDocumentStore.getState().document;
      expect(afterThree?.operations).toHaveLength(3);

      const { undo, redo } = useDocumentStore.getState();
      undo();
      undo();
      undo();
      expect(useDocumentStore.getState().document).toEqual(original);

      // Undoing past the beginning is a safe no-op.
      undo();
      expect(useDocumentStore.getState().document).toEqual(original);

      redo();
      redo();
      redo();
      expect(useDocumentStore.getState().document).toEqual(afterThree);

      // Redoing past the end is a safe no-op.
      redo();
      expect(useDocumentStore.getState().document).toEqual(afterThree);
    });

    it('an undo followed by a different operation replaces the redo branch, not just the present', () => {
      useDocumentStore.getState().setDocument(fakeDocument());
      useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 });
      useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 });
      useDocumentStore.getState().undo();

      useDocumentStore.getState().applyOperation({ type: 'flip', axis: 'vertical' });

      const { document, history } = useDocumentStore.getState();
      expect(document?.operations).toEqual([
        { type: 'rotate', degrees: 90 },
        { type: 'flip', axis: 'vertical' },
      ]);
      expect(history?.future).toHaveLength(0);

      // The old redo target (the second rotate) is gone, not reachable.
      useDocumentStore.getState().redo();
      expect(useDocumentStore.getState().document).toBe(document);
    });
  });

  describe('markProjectSaved', () => {
    it('clears dirty and records the project path on the current document', () => {
      useDocumentStore.getState().setDocument(fakeDocument());
      useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 });
      expect(useDocumentStore.getState().document?.dirty).toBe(true);

      useDocumentStore.getState().markProjectSaved('/tmp/photo.imgedit');

      const { document, history } = useDocumentStore.getState();
      expect(document?.dirty).toBe(false);
      expect(document?.projectPath).toBe('/tmp/photo.imgedit');
      expect(history?.present).toBe(document);
    });

    it('does not create a new history entry', () => {
      useDocumentStore.getState().setDocument(fakeDocument());
      useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 });
      const pastLength = useDocumentStore.getState().history?.past.length;

      useDocumentStore.getState().markProjectSaved('/tmp/photo.imgedit');

      expect(useDocumentStore.getState().history?.past.length).toBe(pastLength);
    });

    it('a later edit is dirty again, but undoing back to the saved snapshot reads clean', () => {
      useDocumentStore.getState().setDocument(fakeDocument());
      useDocumentStore.getState().applyOperation({ type: 'rotate', degrees: 90 });
      useDocumentStore.getState().markProjectSaved('/tmp/photo.imgedit');

      useDocumentStore.getState().applyOperation({ type: 'flip', axis: 'horizontal' });
      expect(useDocumentStore.getState().document?.dirty).toBe(true);

      useDocumentStore.getState().undo();
      expect(useDocumentStore.getState().document?.dirty).toBe(false);
    });

    it('does nothing when no document is open', () => {
      useDocumentStore.getState().markProjectSaved('/tmp/photo.imgedit');
      expect(useDocumentStore.getState().document).toBeNull();
    });
  });
});
