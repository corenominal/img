import { useCallback } from 'react';
import type { AdjustmentSliderKind } from '../editor/operations/adjustmentTotals';
import { getAdjustmentTotal } from '../editor/operations/adjustmentTotals';
import type { ImageOperation } from '../editor/operations/ImageOperation';
import { useAdjustmentStore } from '../stores/adjustmentStore';
import { useDocumentStore } from '../stores/documentStore';

interface AdjustmentActions {
  commit: (kind: AdjustmentSliderKind) => void;
  reset: (kind: AdjustmentSliderKind) => void;
}

// The slider shows and is dragged as an absolute value, but committed
// operations store relative deltas (see AdjustmentOperation.ts), so commit
// converts "where the user left the slider" into "the delta needed to get
// there from the current committed total" before pushing one history
// entry. Once committed, the committed total equals the slider's resting
// position again, so the control does not visually move.
export function useAdjustmentActions(): AdjustmentActions {
  const applyOperation = useDocumentStore((state) => state.applyOperation);
  const clearActive = useAdjustmentStore((state) => state.clearActive);

  const commit = useCallback(
    (kind: AdjustmentSliderKind) => {
      const targetValue = useAdjustmentStore.getState().active[kind];
      if (targetValue === undefined) {
        return;
      }
      const { document } = useDocumentStore.getState();
      const committedTotal = document ? getAdjustmentTotal(document.operations, kind) : 0;
      const delta = targetValue - committedTotal;
      if (delta !== 0) {
        // AdjustmentSliderKind spans multiple ImageOperation members
        // (AdjustmentOperation | ExposureOperation), so TS can't verify
        // this generic `{ type, value }` shape against the discriminated
        // union on its own — the pairing is guaranteed by construction.
        applyOperation({ type: kind, value: delta } as ImageOperation);
      }
      clearActive(kind);
    },
    [applyOperation, clearActive],
  );

  const reset = useCallback(
    (kind: AdjustmentSliderKind) => {
      const { document } = useDocumentStore.getState();
      const committedTotal = document ? getAdjustmentTotal(document.operations, kind) : 0;
      if (committedTotal !== 0) {
        applyOperation({ type: kind, value: -committedTotal } as ImageOperation);
      }
      clearActive(kind);
    },
    [applyOperation, clearActive],
  );

  return { commit, reset };
}
