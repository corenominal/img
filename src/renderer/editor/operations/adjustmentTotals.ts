import type { ImageOperation } from './ImageOperation';
import type { AdjustmentKind } from './AdjustmentOperation';

// Each committed operation only stores the delta applied by one gesture
// (see AdjustmentOperation.ts), so the adjustment's current absolute value
// — what the slider should actually display — is the sum of every
// committed delta of that kind.
export function getAdjustmentTotal(operations: ImageOperation[], kind: AdjustmentKind): number {
  return operations.reduce(
    (total, operation) => (operation.type === kind ? total + operation.value : total),
    0,
  );
}
