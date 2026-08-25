import type { Size } from '../viewport/viewportTypes';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CropHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const MIN_CROP_SIZE = 8;

export function fullImageCropRect(imageSize: Size): CropRect {
  return { x: 0, y: 0, width: imageSize.width, height: imageSize.height };
}

// Moves the whole rect by (deltaX, deltaY), image-space units, clamped so it
// stays fully within bounds.
export function moveCropRect(rect: CropRect, deltaX: number, deltaY: number, bounds: Size): CropRect {
  const x = Math.min(Math.max(rect.x + deltaX, 0), bounds.width - rect.width);
  const y = Math.min(Math.max(rect.y + deltaY, 0), bounds.height - rect.height);
  return { ...rect, x, y };
}

// Free-form resize: each edge implied by `handle` moves independently,
// clamped so the rect never shrinks below MIN_CROP_SIZE or moves outside
// bounds.
export function resizeCropRect(
  rect: CropRect,
  handle: CropHandle,
  deltaX: number,
  deltaY: number,
  bounds: Size,
  minSize: number = MIN_CROP_SIZE,
): CropRect {
  let { x, y, width, height } = rect;

  if (handle.includes('w')) {
    const maxDeltaX = width - minSize;
    const clampedDeltaX = Math.max(-x, Math.min(deltaX, maxDeltaX));
    x += clampedDeltaX;
    width -= clampedDeltaX;
  }
  if (handle.includes('e')) {
    const maxWidth = bounds.width - x;
    width = Math.max(minSize, Math.min(width + deltaX, maxWidth));
  }
  if (handle.includes('n')) {
    const maxDeltaY = height - minSize;
    const clampedDeltaY = Math.max(-y, Math.min(deltaY, maxDeltaY));
    y += clampedDeltaY;
    height -= clampedDeltaY;
  }
  if (handle.includes('s')) {
    const maxHeight = bounds.height - y;
    height = Math.max(minSize, Math.min(height + deltaY, maxHeight));
  }

  return { x, y, width, height };
}

// Corner resize with a locked aspect ratio (width / height). The opposite
// corner stays fixed as an anchor; the dominant drag axis (converted to
// consistent "width" units via the ratio) drives the new size, which is
// then clamped so the rect fits within bounds from the anchor.
export function resizeCropRectWithRatio(
  rect: CropRect,
  handle: 'ne' | 'nw' | 'se' | 'sw',
  deltaX: number,
  deltaY: number,
  bounds: Size,
  ratio: number,
  minSize: number = MIN_CROP_SIZE,
): CropRect {
  const anchorX = handle.includes('w') ? rect.x + rect.width : rect.x;
  const anchorY = handle.includes('n') ? rect.y + rect.height : rect.y;

  const widthDelta = handle.includes('w') ? -deltaX : deltaX;
  const heightDelta = handle.includes('n') ? -deltaY : deltaY;
  const driveByWidth = Math.abs(widthDelta) >= Math.abs(heightDelta) * ratio;

  let width = driveByWidth ? rect.width + widthDelta : (rect.height + heightDelta) * ratio;

  const maxWidthFromAnchor = handle.includes('w') ? anchorX : bounds.width - anchorX;
  const maxHeightFromAnchor = handle.includes('n') ? anchorY : bounds.height - anchorY;
  width = Math.min(width, maxWidthFromAnchor, maxHeightFromAnchor * ratio);
  width = Math.max(minSize, width);

  const height = width / ratio;
  const x = handle.includes('w') ? anchorX - width : anchorX;
  const y = handle.includes('n') ? anchorY - height : anchorY;

  return { x, y, width, height };
}

export function clampRatioToRect(rect: CropRect, bounds: Size, ratio: number, minSize: number = MIN_CROP_SIZE): CropRect {
  // Keep the current top-left corner as the anchor and shrink to fit the
  // ratio, e.g. when switching from Free to a fixed ratio.
  let width = Math.min(rect.width, bounds.width - rect.x);
  let height = width / ratio;
  const maxHeight = bounds.height - rect.y;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }
  width = Math.max(minSize, width);
  height = Math.max(minSize, height);
  return { x: rect.x, y: rect.y, width, height };
}
