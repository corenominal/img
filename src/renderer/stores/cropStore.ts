import { create } from 'zustand';
import type { CropAspectRatio } from '../editor/crop/cropAspectRatios';
import { aspectRatioValue } from '../editor/crop/cropAspectRatios';
import type { CropRect } from '../editor/crop/cropGeometry';
import { clampRatioToRect, fullImageCropRect } from '../editor/crop/cropGeometry';
import type { Size } from '../editor/viewport/viewportTypes';

// Crop is UI-only, transient state: it never touches the document (or
// history) until the user commits it.
interface CropState {
  rect: CropRect | null;
  aspectRatio: CropAspectRatio;
  startCrop: (imageSize: Size) => void;
  setRect: (rect: CropRect) => void;
  setAspectRatio: (aspectRatio: CropAspectRatio, imageSize: Size) => void;
  reset: () => void;
}

export const useCropStore = create<CropState>((set, get) => ({
  rect: null,
  aspectRatio: 'free',

  startCrop: (imageSize) => set({ rect: fullImageCropRect(imageSize) }),

  setRect: (rect) => set({ rect }),

  setAspectRatio: (aspectRatio, imageSize) => {
    const { rect } = get();
    const ratio = aspectRatioValue(aspectRatio, imageSize);
    set({
      aspectRatio,
      rect: rect && ratio ? clampRatioToRect(rect, imageSize, ratio) : rect,
    });
  },

  reset: () => set({ rect: null }),
}));
