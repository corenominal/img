import { create } from 'zustand';

// Minimal placeholder shape for Phase 1's empty-document state. The full
// ImageDocument model (source bitmap, operations, history) is introduced
// when Phase 2 adds document creation.
interface DocumentSummary {
  filename?: string;
  width: number;
  height: number;
}

interface DocumentState {
  document: DocumentSummary | null;
}

export const useDocumentStore = create<DocumentState>(() => ({
  document: null,
}));
