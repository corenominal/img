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
});
