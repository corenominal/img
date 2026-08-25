import { afterEach, describe, expect, it } from 'vitest';
import { useCropStore } from './cropStore';

describe('cropStore', () => {
  afterEach(() => {
    useCropStore.setState({ rect: null, aspectRatio: 'free' });
  });

  it('starts a crop covering the full image', () => {
    useCropStore.getState().startCrop({ width: 200, height: 100 });
    expect(useCropStore.getState().rect).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });

  it('sets an arbitrary rect', () => {
    useCropStore.getState().setRect({ x: 5, y: 5, width: 50, height: 50 });
    expect(useCropStore.getState().rect).toEqual({ x: 5, y: 5, width: 50, height: 50 });
  });

  it('resets to no pending crop', () => {
    useCropStore.getState().startCrop({ width: 200, height: 100 });
    useCropStore.getState().reset();
    expect(useCropStore.getState().rect).toBeNull();
  });

  it('re-shapes the current rect to match a newly selected aspect ratio', () => {
    useCropStore.getState().setRect({ x: 0, y: 0, width: 100, height: 100 });
    useCropStore.getState().setAspectRatio('16:9', { width: 400, height: 300 });

    const { rect, aspectRatio } = useCropStore.getState();
    expect(aspectRatio).toBe('16:9');
    expect(rect?.width).toBeCloseTo(100);
    expect(rect && rect.width / rect.height).toBeCloseTo(16 / 9);
  });

  it('leaves the rect untouched when switching to Free', () => {
    useCropStore.getState().setRect({ x: 0, y: 0, width: 100, height: 50 });
    useCropStore.getState().setAspectRatio('free', { width: 400, height: 300 });

    expect(useCropStore.getState().rect).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it('does nothing to a null rect when changing aspect ratio', () => {
    useCropStore.getState().setAspectRatio('1:1', { width: 400, height: 300 });
    expect(useCropStore.getState().rect).toBeNull();
  });
});
