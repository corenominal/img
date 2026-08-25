import type { HistoryState } from '../history/historyTypes';
import { canRedo, canUndo } from '../history/HistoryManager';
import { getOperationLabel } from '../operations/operationLabels';
import type { ImageDocument } from './documentTypes';

// The operation stack only ever grows by one entry per history step (undo/
// redo just navigate between already-computed snapshots), so the operation
// that would be undone is the last one in the present document, and the one
// that would be redone is the next one in the following future snapshot.

export function getUndoLabel(history: HistoryState<ImageDocument>): string | null {
  if (!canUndo(history)) {
    return null;
  }
  const operations = history.present.operations;
  const last = operations[operations.length - 1];
  return last ? getOperationLabel(last) : null;
}

export function getRedoLabel(history: HistoryState<ImageDocument>): string | null {
  if (!canRedo(history)) {
    return null;
  }
  const next = history.future[0];
  const operation = next?.operations[history.present.operations.length];
  return operation ? getOperationLabel(operation) : null;
}
