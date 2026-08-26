import type { ImageOperation } from './ImageOperation';
import type { AdjustmentKind } from './AdjustmentOperation';

// Every operation kind driven by the generic delta-slider UI in
// AdjustPanel.tsx: `AdjustmentKind` (brightness/contrast/saturation,
// rendered via a CSS `filter`) plus any other kind that follows the same
// "one gesture, one relative delta" convention but renders differently
// (exposure/highlights/shadows/temperature/tint/vibrance/gamma/blackPoint
// rewrite pixels directly — see ExposureOperation.ts/HighlightsOperation.ts/
// ShadowsOperation.ts/TemperatureOperation.ts/TintOperation.ts/
// VibranceOperation.ts/GammaOperation.ts/BlackPointOperation.ts). Add new
// kinds here as Phase 12's remaining adjustments land.
export type AdjustmentSliderKind =
  | AdjustmentKind
  | 'exposure'
  | 'highlights'
  | 'shadows'
  | 'temperature'
  | 'tint'
  | 'vibrance'
  | 'gamma'
  | 'blackPoint';

// Each committed operation only stores the delta applied by one gesture
// (see AdjustmentOperation.ts), so the adjustment's current absolute value
// — what the slider should actually display — is the sum of every
// committed delta of that kind.
export function getAdjustmentTotal(
  operations: ImageOperation[],
  kind: AdjustmentSliderKind,
): number {
  return operations.reduce(
    (total, operation) => (operation.type === kind ? total + operation.value : total),
    0,
  );
}
