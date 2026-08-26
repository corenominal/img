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
import type { ExposureOperation } from './ExposureOperation';
import { exposureSize } from './ExposureOperation';
import type { HighlightsOperation } from './HighlightsOperation';
import { highlightsSize } from './HighlightsOperation';
import type { ShadowsOperation } from './ShadowsOperation';
import { shadowsSize } from './ShadowsOperation';

export type { RotateOperation } from './RotateOperation';
export type { FlipOperation } from './FlipOperation';
export type { CropOperation } from './CropOperation';
export type { AdjustmentOperation, AdjustmentKind } from './AdjustmentOperation';
export type { ResizeOperation, ResamplingMethod } from './ResizeOperation';
export type { ExposureOperation } from './ExposureOperation';
export type { HighlightsOperation } from './HighlightsOperation';
export type { ShadowsOperation } from './ShadowsOperation';

export type ImageOperation =
  | RotateOperation
  | FlipOperation
  | CropOperation
  | AdjustmentOperation
  | ResizeOperation
  | ExposureOperation
  | HighlightsOperation
  | ShadowsOperation;

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
    case 'exposure':
      return exposureSize(size);
    case 'highlights':
      return highlightsSize(size);
    case 'shadows':
      return shadowsSize(size);
    default:
      return assertExhaustive(operation);
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// Gate for anything reconstructed from untrusted, on-disk JSON (a loaded
// project's document.json — see editor/project/). Deliberately mirrors
// the ImageOperation union case-by-case rather than trusting the caller.
export function isImageOperation(value: unknown): value is ImageOperation {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  switch (candidate.type) {
    case 'rotate':
      return candidate.degrees === 90 || candidate.degrees === 180 || candidate.degrees === 270;
    case 'flip':
      return candidate.axis === 'horizontal' || candidate.axis === 'vertical';
    case 'crop':
      return (
        isFiniteNumber(candidate.x) &&
        isFiniteNumber(candidate.y) &&
        isFiniteNumber(candidate.width) &&
        isFiniteNumber(candidate.height)
      );
    case 'brightness':
    case 'contrast':
    case 'saturation':
      return isFiniteNumber(candidate.value);
    case 'resize':
      return (
        isFiniteNumber(candidate.width) &&
        isFiniteNumber(candidate.height) &&
        (candidate.resampling === 'smooth' || candidate.resampling === 'pixelated')
      );
    case 'exposure':
    case 'highlights':
    case 'shadows':
      return isFiniteNumber(candidate.value);
    default:
      return false;
  }
}

// Rotate/flip are pure canvas transforms applied to a full drawImage(source,
// 0, 0) call. Crop, the colour adjustments, resize, exposure, highlights
// and shadows are deliberately excluded: crop needs to control the
// drawImage call itself (a cropping source-rect) rather than pre-apply a
// transform, adjustments apply a canvas `filter` instead of a transform,
// resize scales the destination rect of drawImage, and exposure/
// highlights/shadows rewrite pixels directly (no canvas-native filter or
// transform covers a luminance-dependent adjustment) — see
// flattenOperations.ts.
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
