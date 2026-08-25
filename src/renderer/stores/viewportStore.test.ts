import { afterEach, describe, expect, it } from 'vitest';
import { useViewportStore } from './viewportStore';
import { MAX_ZOOM, MIN_ZOOM } from '../editor/viewport/viewportMath';

describe('viewportStore', () => {
  afterEach(() => {
    useViewportStore.setState({ zoom: 1, offsetX: 0, offsetY: 0 });
  });

  it('fits the image to the container', () => {
    useViewportStore.getState().fitToContainer({ width: 4000, height: 2000 }, { width: 1000, height: 1000 }, 1);
    const { zoom } = useViewportStore.getState();
    expect(zoom).toBeGreaterThan(0);
    expect(zoom).toBeLessThanOrEqual(MAX_ZOOM);
  });

  it('zooms in and out around an anchor by the given factor, clamped to range', () => {
    useViewportStore.setState({ zoom: 1, offsetX: 0, offsetY: 0 });

    useViewportStore.getState().zoomBy(2, { x: 0, y: 0 }, 1);
    expect(useViewportStore.getState().zoom).toBe(2);

    useViewportStore.getState().zoomBy(0.0001, { x: 0, y: 0 }, 1);
    expect(useViewportStore.getState().zoom).toBe(MIN_ZOOM);
  });

  it('sets zoom to exactly 1 (actual size) regardless of devicePixelRatio', () => {
    useViewportStore.setState({ zoom: 3, offsetX: 5, offsetY: 5 });
    useViewportStore.getState().actualSize({ x: 100, y: 100 }, 2);
    expect(useViewportStore.getState().zoom).toBe(1);
  });

  it('pans by adding the delta to the current offset', () => {
    useViewportStore.setState({ zoom: 1, offsetX: 10, offsetY: 10 });
    useViewportStore.getState().panBy(5, -3);
    expect(useViewportStore.getState().offsetX).toBe(15);
    expect(useViewportStore.getState().offsetY).toBe(7);
  });

  it('centers the image at the current zoom without changing zoom', () => {
    useViewportStore.setState({ zoom: 2, offsetX: 999, offsetY: 999 });
    useViewportStore.getState().centerImage({ width: 100, height: 100 }, { width: 400, height: 300 }, 1);
    const state = useViewportStore.getState();
    expect(state.zoom).toBe(2);
    expect(state.offsetX).toBeCloseTo((400 - 100 * 2) / 2);
  });
});
