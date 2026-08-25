import type { Size } from '../viewport/viewportTypes';
import type { RotateOperation } from './RotateOperation';
import { applyRotateTransform, rotateSize } from './RotateOperation';
import type { FlipOperation } from './FlipOperation';
import { applyFlipTransform, flipSize } from './FlipOperation';
import type { CropOperation } from './CropOperation';
import { cropSize } from './CropOperation';
import type { AdjustmentOperation } from './AdjustmentOperation';
import { adjustmentSize } from './AdjustmentOperation';
import type { ResizeOperation } from './ResizeOperation';
import { resizeSize } from './ResizeOperation';

export type { RotateOperation } from './RotateOperation';
export type { FlipOperation } from './FlipOperation';
export type { CropOperation } from './CropOperation';
export type { AdjustmentOperation, AdjustmentKind } from './AdjustmentOperation';
export type { ResizeOperation, ResamplingMethod } from './ResizeOperation';

export type ImageOperation =
  RotateOperation | FlipOperation | CropOperation | AdjustmentOperation | ResizeOperation;

export function assertExhaustive(value: never): never {
  throw new Error(`Unhandled image operation: ${JSON.stringify(value)}`);
}

export function applyOperationToSize(size: Size, operation: ImageOperation): Size {
  switch (operation.type) {
    case 'rotate':
      return rotateSize(size, operation.degrees);
    case 'flip':
      return flipSize(size);
    case 'crop':
      return cropSize(operation);
    case 'brightness':
    case 'contrast':
    case 'saturation':
      return adjustmentSize(size);
    case 'resize':
      return resizeSize(operation);
    default:
      return assertExhaustive(operation);
  }
}

// Rotate/flip are pure canvas transforms applied to a full drawImage(source,
// 0, 0) call. Crop, the colour adjustments, and resize are deliberately
// excluded: crop needs to control the drawImage call itself (a cropping
// source-rect) rather than pre-apply a transform, adjustments apply a
// canvas `filter` instead of a transform, and resize scales the
// destination rect of drawImage — see flattenOperations.ts.
export function applyGeometricTransform(
  context: CanvasRenderingContext2D,
  operation: RotateOperation | FlipOperation,
  sizeBefore: Size,
): void {
  switch (operation.type) {
    case 'rotate':
      applyRotateTransform(context, operation.degrees, sizeBefore);
      return;
    case 'flip':
      applyFlipTransform(context, operation.axis, sizeBefore);
      return;
    default:
      assertExhaustive(operation);
  }
}
