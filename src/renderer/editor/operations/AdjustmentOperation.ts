import type { Size } from '../viewport/viewportTypes';

export type AdjustmentKind = 'brightness' | 'contrast' | 'saturation';

// A single slider gesture's delta, in the range -100..100. Like Rotate,
// this is relative rather than absolute: committing a second brightness
// gesture stacks another delta onto the operation list rather than
// replacing the first, so undo removes exactly one gesture at a time.
export interface AdjustmentOperation {
  type: AdjustmentKind;
  value: number;
}

export function adjustmentSize(size: Size): Size {
  return size;
}

export function isAdjustmentOperation(operation: {
  type: string;
}): operation is AdjustmentOperation {
  return (
    operation.type === 'brightness' ||
    operation.type === 'contrast' ||
    operation.type === 'saturation'
  );
}

// -100..100 maps onto the CSS filter functions' 0..2 multiplier range,
// centred on 1 (no change).
function filterMultiplier(value: number): number {
  return 1 + value / 100;
}

export function applyAdjustmentFilter(
  context: CanvasRenderingContext2D,
  operation: AdjustmentOperation,
): void {
  const multiplier = filterMultiplier(operation.value);
  switch (operation.type) {
    case 'brightness':
      context.filter = `brightness(${multiplier})`;
      return;
    case 'contrast':
      context.filter = `contrast(${multiplier})`;
      return;
    case 'saturation':
      context.filter = `saturate(${multiplier})`;
      return;
  }
}
