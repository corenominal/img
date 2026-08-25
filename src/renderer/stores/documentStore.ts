import { create } from 'zustand';
import type { ImageDocument } from '../editor/document/documentTypes';

interface DocumentState {
  document: ImageDocument | null;
  openError: string | null;
  setDocument: (document: ImageDocument) => void;
  setOpenError: (message: string | null) => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  document: null,
  openError: null,
  setDocument: (document) => {
    // Release the previous bitmap's underlying image data immediately
    // rather than waiting for garbage collection.
    get().document?.source.close();
    set({ document, openError: null });
  },
  setOpenError: (message) => set({ openError: message }),
}));
