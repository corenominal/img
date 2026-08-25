import { describe, expect, it, vi } from 'vitest';
import { getRedoLabel, getUndoLabel } from './documentHistoryLabels';
import { createHistory, pushHistory, undoHistory } from '../history/HistoryManager';
import type { ImageDocument } from './documentTypes';

function fakeDocument(operations: ImageDocument['operations']): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.png',
    sourcePath: '/tmp/photo.png',
    width: 100,
    height: 100,
    source: { width: 100, height: 100, close: vi.fn() } as unknown as ImageBitmap,
    operations,
    dirty: operations.length > 0,
  };
}

describe('getUndoLabel', () => {
  it('is null with a fresh document', () => {
    const history = createHistory(fakeDocument([]));
    expect(getUndoLabel(history)).toBeNull();
  });

  it('labels the most recently applied operation', () => {
    let history = createHistory(fakeDocument([]));
    history = pushHistory(history, fakeDocument([{ type: 'rotate', degrees: 90 }]));
    expect(getUndoLabel(history)).toBe('Rotate Right');

    history = pushHistory(
      history,
      fakeDocument([
        { type: 'rotate', degrees: 90 },
        { type: 'flip', axis: 'vertical' },
      ]),
    );
    expect(getUndoLabel(history)).toBe('Flip Vertical');
  });
});

describe('getRedoLabel', () => {
  it('is null with nothing undone', () => {
    const history = createHistory(fakeDocument([]));
    expect(getRedoLabel(history)).toBeNull();
  });

  it('labels the operation that would be reapplied', () => {
    let history = createHistory(fakeDocument([]));
    history = pushHistory(history, fakeDocument([{ type: 'rotate', degrees: 270 }]));
    history = undoHistory(history);

    expect(getRedoLabel(history)).toBe('Rotate Left');
  });
});
