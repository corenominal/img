import type { ImageOperation } from '../operations/ImageOperation';
import { applyGeometricTransform, applyOperationToSize } from '../operations/ImageOperation';
import { applyAdjustmentFilter, isAdjustmentOperation } from '../operations/AdjustmentOperation';
import { applyResizeScale } from '../operations/ResizeOperation';
import type { ExposureOperation } from '../operations/ExposureOperation';
import { applyExposure } from '../operations/ExposureOperation';
import type { HighlightsOperation } from '../operations/HighlightsOperation';
import { applyHighlights } from '../operations/HighlightsOperation';
import type { ShadowsOperation } from '../operations/ShadowsOperation';
import { applyShadows } from '../operations/ShadowsOperation';
import type { TemperatureOperation } from '../operations/TemperatureOperation';
import { applyTemperature } from '../operations/TemperatureOperation';
import type { TintOperation } from '../operations/TintOperation';
import { applyTint } from '../operations/TintOperation';
import type { VibranceOperation } from '../operations/VibranceOperation';
import { applyVibrance } from '../operations/VibranceOperation';
import type { Size } from '../viewport/viewportTypes';

export type RenderableSource = ImageBitmap | HTMLCanvasElement;

// None of these have a CSS-filter or transform equivalent — each needs a
// per-pixel read/rewrite, whether luminance-dependent (exposure/
// highlights/shadows), a flat per-channel shift (temperature/tint), or
// saturation-dependent (vibrance) — so they share the same "draw, then
// rewrite pixels in place" render step below.
type PixelOperation =
  | ExposureOperation
  | HighlightsOperation
  | ShadowsOperation
  | TemperatureOperation
  | TintOperation
  | VibranceOperation;

function isPixelOperation(operation: ImageOperation): operation is PixelOperation {
  return (
    operation.type === 'exposure' ||
    operation.type === 'highlights' ||
    operation.type === 'shadows' ||
    operation.type === 'temperature' ||
    operation.type === 'tint' ||
    operation.type === 'vibrance'
  );
}

function applyPixelOperation(
  context: CanvasRenderingContext2D,
  size: Size,
  operation: PixelOperation,
): void {
  switch (operation.type) {
    case 'exposure':
      applyExposure(context, size, operation);
      return;
    case 'highlights':
      applyHighlights(context, size, operation);
      return;
    case 'shadows':
      applyShadows(context, size, operation);
      return;
    case 'temperature':
      applyTemperature(context, size, operation);
      return;
    case 'tint':
      applyTint(context, size, operation);
      return;
    case 'vibrance':
      applyVibrance(context, size, operation);
      return;
  }
}

function createCanvas(size: Size): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  return canvas;
}

function get2dContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('2D canvas context is not available');
  }
  return context;
}

// Bakes the document's operation stack into a single drawable source by
// replaying each operation onto a fresh canvas in turn, rather than
// composing every operation into one shared canvas transform.
//
// This matters once crop is in the mix: a crop's clip region freezes in
// device space the moment clip() is called and is *not* affected by any
// further transform() calls, so a crop that isn't the last operation in the
// stack would end up misaligned with whatever geometric transform comes
// after it if composed into one shared transform. Rendering step-by-step
// onto isolated canvases sidesteps that entirely, and also gives export
// (a later phase) the same single source of truth for "what does the
// current document actually look like".
export function flattenOperations(
  source: ImageBitmap,
  operations: ImageOperation[],
): RenderableSource {
  let current: RenderableSource = source;
  let currentSize: Size = { width: source.width, height: source.height };

  for (const operation of operations) {
    const nextSize = applyOperationToSize(currentSize, operation);
    const canvas = createCanvas(nextSize);
    const context = get2dContext(canvas);

    if (operation.type === 'crop') {
      context.drawImage(
        current,
        operation.x,
        operation.y,
        operation.width,
        operation.height,
        0,
        0,
        operation.width,
        operation.height,
      );
    } else if (isAdjustmentOperation(operation)) {
      applyAdjustmentFilter(context, operation);
      context.drawImage(current, 0, 0);
    } else if (operation.type === 'resize') {
      applyResizeScale(context, operation);
      context.drawImage(current, 0, 0, nextSize.width, nextSize.height);
    } else if (isPixelOperation(operation)) {
      context.drawImage(current, 0, 0);
      applyPixelOperation(context, nextSize, operation);
    } else {
      applyGeometricTransform(context, operation, currentSize);
      context.drawImage(current, 0, 0);
    }

    current = canvas;
    currentSize = nextSize;
  }

  return current;
}
