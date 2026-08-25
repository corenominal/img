import { create } from 'zustand';

// UI-only: whether the Export dialog is open. Export never touches
// document history or dirty state — it renders and writes a copy, it
// doesn't modify the document.
interface ExportDialogState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useExportDialogStore = create<ExportDialogState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
