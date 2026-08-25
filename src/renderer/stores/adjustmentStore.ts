import { create } from 'zustand';
import type { AdjustmentKind } from '../editor/operations/AdjustmentOperation';

// Absolute slider positions (-100..100) while a gesture is in progress, one
// entry per kind currently being dragged/typed into. A kind with no entry
// here means "not being edited right now" — display its committed total
// instead (see adjustmentTotals.ts). This never touches document history
// directly: only useAdjustmentActions.commit() turns it into an operation.
export type ActiveAdjustmentValues = Partial<Record<AdjustmentKind, number>>;

interface AdjustmentState {
  active: ActiveAdjustmentValues;
  setActive: (kind: AdjustmentKind, value: number) => void;
  clearActive: (kind: AdjustmentKind) => void;
}

export const useAdjustmentStore = create<AdjustmentState>((set) => ({
  active: {},

  setActive: (kind, value) => set((state) => ({ active: { ...state.active, [kind]: value } })),

  clearActive: (kind) =>
    set((state) => {
      if (!(kind in state.active)) {
        return state;
      }
      const next = { ...state.active };
      delete next[kind];
      return { active: next };
    }),
}));
