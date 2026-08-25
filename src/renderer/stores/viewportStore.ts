import { create } from 'zustand';
import { centerViewport, clampZoom, computeFitViewport, zoomAtPoint } from '../editor/viewport/viewportMath';
import type { Point, Size, ViewportState } from '../editor/viewport/viewportTypes';

// Pan/zoom are view-only concerns: they never touch the document and never
// enter undo history.
interface ViewportStoreState extends ViewportState {
  fitToContainer: (imageSize: Size, containerSize: Size, devicePixelRatio: number) => void;
  centerImage: (imageSize: Size, containerSize: Size, devicePixelRatio: number) => void;
  actualSize: (anchor: Point, devicePixelRatio: number) => void;
  zoomBy: (factor: number, anchor: Point, devicePixelRatio: number) => void;
  zoomAt: (anchor: Point, nextZoom: number, devicePixelRatio: number) => void;
  panBy: (dx: number, dy: number) => void;
}

export const useViewportStore = create<ViewportStoreState>((set, get) => ({
  zoom: 1,
  offsetX: 0,
  offsetY: 0,

  fitToContainer: (imageSize, containerSize, devicePixelRatio) => {
    set(computeFitViewport(imageSize, containerSize, devicePixelRatio));
  },

  centerImage: (imageSize, containerSize, devicePixelRatio) => {
    set((state) => centerViewport(imageSize, containerSize, state.zoom, devicePixelRatio));
  },

  actualSize: (anchor, devicePixelRatio) => {
    set((state) => zoomAtPoint(state, anchor, 1, devicePixelRatio));
  },

  zoomBy: (factor, anchor, devicePixelRatio) => {
    const nextZoom = clampZoom(get().zoom * factor);
    set((state) => zoomAtPoint(state, anchor, nextZoom, devicePixelRatio));
  },

  zoomAt: (anchor, nextZoom, devicePixelRatio) => {
    set((state) => zoomAtPoint(state, anchor, nextZoom, devicePixelRatio));
  },

  panBy: (dx, dy) => {
    set((state) => ({ offsetX: state.offsetX + dx, offsetY: state.offsetY + dy }));
  },
}));
