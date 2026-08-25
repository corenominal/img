import type { Size } from '../viewport/viewportTypes';

// Canvas 2D has no true nearest-neighbour scaler; disabling smoothing is
// the closest browser-native equivalent, which is enough for v0.1 per
// plan.md §21 ("avoid implementing complex resampling algorithms
// prematurely").
export type ResamplingMethod = 'smooth' | 'pixelated';

export interface ResizeOperation {
  type: 'resize';
  width: number;
  height: number;
  resampling: ResamplingMethod;
}

// Unlike rotate/flip, the target size is stored directly on the operation
// (like crop), not derived from the size that preceded it.
export function resizeSize(operation: ResizeOperation): Size {
  return { width: operation.width, height: operation.height };
}

export function applyResizeScale(
  context: CanvasRenderingContext2D,
  operation: ResizeOperation,
): void {
  context.imageSmoothingEnabled = operation.resampling === 'smooth';
  context.imageSmoothingQuality = 'high';
}
