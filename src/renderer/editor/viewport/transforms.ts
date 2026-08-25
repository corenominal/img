import type { Point, ViewportState } from './viewportTypes';

// Centralised image-space <-> viewport-space conversions. Viewport-space
// here means CSS pixels relative to the canvas container, matching pointer
// event coordinates. `devicePixelRatio` converts the physical-pixel `zoom`
// value into a CSS-pixel scale factor.
export function imageToViewport(point: Point, viewport: ViewportState, devicePixelRatio: number): Point {
  const scale = viewport.zoom / devicePixelRatio;
  return {
    x: point.x * scale + viewport.offsetX,
    y: point.y * scale + viewport.offsetY,
  };
}

export function viewportToImage(point: Point, viewport: ViewportState, devicePixelRatio: number): Point {
  const scale = viewport.zoom / devicePixelRatio;
  return {
    x: (point.x - viewport.offsetX) / scale,
    y: (point.y - viewport.offsetY) / scale,
  };
}
