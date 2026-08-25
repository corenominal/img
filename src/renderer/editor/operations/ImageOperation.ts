import type { Size } from '../viewport/viewportTypes';
import type { RotateOperation } from './RotateOperation';
import { applyRotateTransform, rotateSize } from './RotateOperation';
import type { FlipOperation } from './FlipOperation';
import { applyFlipTransform, flipSize } from './FlipOperation';
import type { CropOperation } from './CropOperation';
import { cropSize } from './CropOperation';
import type { AdjustmentOperation } from './AdjustmentOperation';
import { adjustmentSize } from './AdjustmentOperation';

export type { RotateOperation } from './RotateOperation';
export type { FlipOperation } from './FlipOperation';
export type { CropOperation } from './CropOperation';
export type { AdjustmentOperation, AdjustmentKind } from './AdjustmentOperation';

export type ImageOperation = RotateOperation | FlipOperation | CropOperation | AdjustmentOperation;

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
    default:
      return assertExhaustive(operation);
  }
}

// Rotate/flip are pure canvas transforms applied to a full drawImage(source,
// 0, 0) call. Crop and the colour adjustments are deliberately excluded:
// crop needs to control the drawImage call itself (a cropping source-rect)
// rather than pre-apply a transform, and adjustments apply a canvas
// `filter` instead of a transform — see flattenOperations.ts.
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
