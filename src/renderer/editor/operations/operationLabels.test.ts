import { describe, expect, it } from 'vitest';
import { getOperationLabel } from './operationLabels';

describe('getOperationLabel', () => {
  it('labels a 90° rotation as Rotate Right', () => {
    expect(getOperationLabel({ type: 'rotate', degrees: 90 })).toBe('Rotate Right');
  });

  it('labels a 270° rotation as Rotate Left', () => {
    expect(getOperationLabel({ type: 'rotate', degrees: 270 })).toBe('Rotate Left');
  });

  it('labels a 180° rotation distinctly', () => {
    expect(getOperationLabel({ type: 'rotate', degrees: 180 })).toBe('Rotate 180°');
  });

  it('labels a horizontal flip', () => {
    expect(getOperationLabel({ type: 'flip', axis: 'horizontal' })).toBe('Flip Horizontal');
  });

  it('labels a vertical flip', () => {
    expect(getOperationLabel({ type: 'flip', axis: 'vertical' })).toBe('Flip Vertical');
  });

  it('labels a crop', () => {
    expect(getOperationLabel({ type: 'crop', x: 0, y: 0, width: 10, height: 10 })).toBe('Crop');
  });

  it('labels a brightness adjustment', () => {
    expect(getOperationLabel({ type: 'brightness', value: 20 })).toBe('Brightness');
  });

  it('labels a contrast adjustment', () => {
    expect(getOperationLabel({ type: 'contrast', value: -10 })).toBe('Contrast');
  });

  it('labels a saturation adjustment', () => {
    expect(getOperationLabel({ type: 'saturation', value: 5 })).toBe('Saturation');
  });

  it('labels a resize', () => {
    expect(
      getOperationLabel({ type: 'resize', width: 400, height: 300, resampling: 'smooth' }),
    ).toBe('Resize');
  });

  it('labels an exposure adjustment', () => {
    expect(getOperationLabel({ type: 'exposure', value: 40 })).toBe('Exposure');
  });

  it('labels a highlights adjustment', () => {
    expect(getOperationLabel({ type: 'highlights', value: -30 })).toBe('Highlights');
  });

  it('labels a shadows adjustment', () => {
    expect(getOperationLabel({ type: 'shadows', value: 30 })).toBe('Shadows');
  });
});
