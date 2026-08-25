import { viewportToImage } from './transforms';
import type { Point, Size, ViewportState } from './viewportTypes';

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 32;
export const ZOOM_STEP_FACTOR = 1.25;
const FIT_PADDING = 24;

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

// Offset that centres an image of the given size within a container at a
// fixed zoom level.
export function centerViewport(imageSize: Size, containerSize: Size, zoom: number, devicePixelRatio: number): ViewportState {
  const scale = zoom / devicePixelRatio;
  return {
    zoom,
    offsetX: (containerSize.width - imageSize.width * scale) / 2,
    offsetY: (containerSize.height - imageSize.height * scale) / 2,
  };
}

// Zoom level (and centred offset) that fits the whole image within the
// container, with a small margin.
export function computeFitViewport(imageSize: Size, containerSize: Size, devicePixelRatio: number): ViewportState {
  const availableWidth = Math.max(containerSize.width - FIT_PADDING * 2, 1);
  const availableHeight = Math.max(containerSize.height - FIT_PADDING * 2, 1);
  const cssScale = Math.min(availableWidth / imageSize.width, availableHeight / imageSize.height);
  const zoom = clampZoom(cssScale * devicePixelRatio);
  return centerViewport(imageSize, containerSize, zoom, devicePixelRatio);
}

// Recomputes zoom/offset so the image point currently under `anchor`
// (viewport-space, CSS pixels) stays under that same point after zooming.
export function zoomAtPoint(
  viewport: ViewportState,
  anchor: Point,
  nextZoom: number,
  devicePixelRatio: number,
): ViewportState {
  const zoom = clampZoom(nextZoom);
  const imagePoint = viewportToImage(anchor, viewport, devicePixelRatio);
  const scale = zoom / devicePixelRatio;
  return {
    zoom,
    offsetX: anchor.x - imagePoint.x * scale,
    offsetY: anchor.y - imagePoint.y * scale,
  };
}
