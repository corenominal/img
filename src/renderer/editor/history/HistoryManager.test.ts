import { describe, expect, it } from 'vitest';
import { canRedo, canUndo, createHistory, pushHistory, redoHistory, undoHistory } from './HistoryManager';

describe('HistoryManager', () => {
  it('starts with no past or future', () => {
    const history = createHistory('a');
    expect(history).toEqual({ past: [], present: 'a', future: [] });
    expect(canUndo(history)).toBe(false);
    expect(canRedo(history)).toBe(false);
  });

  it('pushes the previous present onto past and clears future', () => {
    let history = createHistory('a');
    history = pushHistory(history, 'b');
    expect(history).toEqual({ past: ['a'], present: 'b', future: [] });

    history = pushHistory(history, 'c');
    expect(history).toEqual({ past: ['a', 'b'], present: 'c', future: [] });
  });

  it('undo moves present into future and restores the last past state', () => {
    let history = createHistory('a');
    history = pushHistory(history, 'b');
    history = pushHistory(history, 'c');

    history = undoHistory(history);
    expect(history).toEqual({ past: ['a'], present: 'b', future: ['c'] });

    history = undoHistory(history);
    expect(history).toEqual({ past: [], present: 'a', future: ['b', 'c'] });
  });

  it('undo on an empty past is a no-op', () => {
    const history = createHistory('a');
    expect(undoHistory(history)).toEqual(history);
  });

  it('redo moves the next future state back into present', () => {
    let history = createHistory('a');
    history = pushHistory(history, 'b');
    history = undoHistory(history);

    history = redoHistory(history);
    expect(history).toEqual({ past: ['a'], present: 'b', future: [] });
  });

  it('redo on an empty future is a no-op', () => {
    const history = createHistory('a');
    expect(redoHistory(history)).toEqual(history);
  });

  it('a new push after an undo discards the redo branch', () => {
    let history = createHistory('a');
    history = pushHistory(history, 'b');
    history = undoHistory(history);
    expect(canRedo(history)).toBe(true);

    history = pushHistory(history, 'c');
    expect(history).toEqual({ past: ['a'], present: 'c', future: [] });
    expect(canRedo(history)).toBe(false);
  });
});
