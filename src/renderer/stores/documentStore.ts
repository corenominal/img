import { create } from 'zustand';
import type { ImageDocument } from '../editor/document/documentTypes';
import type { ImageOperation } from '../editor/operations/ImageOperation';
import { applyOperationToSize } from '../editor/operations/ImageOperation';
import type { HistoryState } from '../editor/history/historyTypes';
import { createHistory, pushHistory, redoHistory, undoHistory } from '../editor/history/HistoryManager';

interface DocumentState {
  document: ImageDocument | null;
  openError: string | null;
  history: HistoryState<ImageDocument> | null;
  setDocument: (document: ImageDocument) => void;
  setOpenError: (message: string | null) => void;
  applyOperation: (operation: ImageOperation) => void;
  undo: () => void;
  redo: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  document: null,
  openError: null,
  history: null,

  setDocument: (document) => {
    // Release the previous bitmap's underlying image data immediately
    // rather than waiting for garbage collection.
    get().document?.source.close();
    set({ document, openError: null, history: createHistory(document) });
  },

  setOpenError: (message) => set({ openError: message }),

  applyOperation: (operation) => {
    const { document, history } = get();
    if (!document || !history) {
      return;
    }
    const size = applyOperationToSize({ width: document.width, height: document.height }, operation);
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
}));
