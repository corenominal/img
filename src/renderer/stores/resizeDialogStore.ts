import { create } from 'zustand';

// UI-only: whether the Resize dialog is open. Never touches document
// history — only committing a resize inside the dialog does that.
interface ResizeDialogState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useResizeDialogStore = create<ResizeDialogState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
