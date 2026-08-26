import { create } from 'zustand';
import type { ImageDocument } from '../editor/document/documentTypes';
import type { ImageOperation } from '../editor/operations/ImageOperation';
import { applyOperationToSize } from '../editor/operations/ImageOperation';
import type { HistoryState } from '../editor/history/historyTypes';
import {
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from '../editor/history/HistoryManager';

interface DocumentState {
  document: ImageDocument | null;
  documentError: string | null;
  history: HistoryState<ImageDocument> | null;
  setDocument: (document: ImageDocument) => void;
  setDocumentError: (message: string | null) => void;
  applyOperation: (operation: ImageOperation) => void;
  undo: () => void;
  redo: () => void;
  markProjectSaved: (filePath: string) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  document: null,
  documentError: null,
  history: null,

  setDocument: (document) => {
    // Release the previous bitmap's underlying image data immediately
    // rather than waiting for garbage collection.
    get().document?.source.close();
    set({ document, documentError: null, history: createHistory(document) });
  },

  setDocumentError: (message) => set({ documentError: message }),

  applyOperation: (operation) => {
    const { document, history } = get();
    if (!document || !history) {
      return;
    }
    const size = applyOperationToSize(
      { width: document.width, height: document.height },
      operation,
    );
    const next: ImageDocument = {
      ...document,
      operations: [...document.operations, operation],
      width: size.width,
      height: size.height,
      dirty: true,
    };
    set({ document: next, history: pushHistory(history, next) });
  },

  undo: () => {
    const { history } = get();
    if (!history) {
      return;
    }
    const nextHistory = undoHistory(history);
    set({ history: nextHistory, document: nextHistory.present });
  },

  redo: () => {
    const { history } = get();
    if (!history) {
      return;
    }
    const nextHistory = redoHistory(history);
    set({ history: nextHistory, document: nextHistory.present });
  },

  // Records a successful save on the *current* snapshot only — not a new
  // history entry. Older/newer entries in past/future keep whatever dirty
  // value they already had, which stays correct: they genuinely differ
  // from what's now on disk, so they should still read as dirty if
  // undo/redo lands back on them.
  markProjectSaved: (filePath) => {
    const { document, history } = get();
    if (!document || !history) {
      return;
    }
    const saved: ImageDocument = { ...document, dirty: false, projectPath: filePath };
    set({ document: saved, history: { ...history, present: saved } });
  },
}));
