import { describe, expect, it } from 'vitest';
import {
  centerViewport,
  clampZoom,
  computeFitViewport,
  MAX_ZOOM,
  MIN_ZOOM,
  zoomAtPoint,
} from './viewportMath';
import { viewportToImage } from './transforms';

describe('clampZoom', () => {
  it('clamps below the minimum', () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM);
  });

  it('clamps above the maximum', () => {
    expect(clampZoom(1000)).toBe(MAX_ZOOM);
  });

  it('leaves in-range values untouched', () => {
    expect(clampZoom(2)).toBe(2);
  });
});

describe('centerViewport', () => {
  it('centres the scaled image within the container', () => {
    // 100x100 image at zoom=1 (dpr=1 => cssScale=1) inside a 300x200 container.
    const result = centerViewport({ width: 100, height: 100 }, { width: 300, height: 200 }, 1, 1);
    expect(result).toEqual({ zoom: 1, offsetX: 100, offsetY: 50 });
  });
});

describe('computeFitViewport', () => {
  it('picks the limiting dimension so the whole image fits with margin', () => {
    // Wide image, container is wider still relative to image aspect ratio.
    const result = computeFitViewport({ width: 4000, height: 1000 }, { width: 1000, height: 1000 }, 1);
    // available width/height = 1000 - 48 = 952; width is the limiting factor: 952/4000
    expect(result.zoom).toBeCloseTo(952 / 4000);
  });

  it('centres the image after fitting', () => {
    const imageSize = { width: 200, height: 100 };
    const containerSize = { width: 1000, height: 1000 };
    const result = computeFitViewport(imageSize, containerSize, 1);

    const scale = result.zoom;
    expect(result.offsetX).toBeCloseTo((containerSize.width - imageSize.width * scale) / 2);
    expect(result.offsetY).toBeCloseTo((containerSize.height - imageSize.height * scale) / 2);
  });

  it('accounts for devicePixelRatio so 100% still means one image pixel per physical pixel', () => {
    // A tiny image in a huge container would want to fit at a zoom capped by MAX_ZOOM.
    const result = computeFitViewport({ width: 10, height: 10 }, { width: 10000, height: 10000 }, 2);
    expect(result.zoom).toBeLessThanOrEqual(MAX_ZOOM);
  });
});

describe('zoomAtPoint', () => {
  it('keeps the image point under the anchor fixed after zooming', () => {
    const viewport = { zoom: 1, offsetX: 0, offsetY: 0 };
    const dpr = 2;
    const anchor = { x: 120, y: 80 };
    const imagePointBefore = viewportToImage(anchor, viewport, dpr);

    const next = zoomAtPoint(viewport, anchor, 4, dpr);
    const imagePointAfter = viewportToImage(anchor, next, dpr);

    expect(imagePointAfter.x).toBeCloseTo(imagePointBefore.x);
    expect(imagePointAfter.y).toBeCloseTo(imagePointBefore.y);
    expect(next.zoom).toBe(4);
  });

  it('clamps the requested zoom', () => {
    const result = zoomAtPoint({ zoom: 1, offsetX: 0, offsetY: 0 }, { x: 0, y: 0 }, 9999, 1);
    expect(result.zoom).toBe(MAX_ZOOM);
  });
});
