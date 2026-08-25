import type { Size } from '../viewport/viewportTypes';

export interface RotateOperation {
  type: 'rotate';
  degrees: 90 | 180 | 270;
}

export function rotateSize(size: Size, degrees: RotateOperation['degrees']): Size {
  return degrees === 180 ? size : { width: size.height, height: size.width };
}

// Rotation is clockwise; "rotate left" is represented as a 270° operation
// rather than -90°, keeping the stored degrees always in [90, 180, 270].
export function applyRotateTransform(
  context: CanvasRenderingContext2D,
  degrees: RotateOperation['degrees'],
  sizeBefore: Size,
): void {
  const sizeAfter = rotateSize(sizeBefore, degrees);
  context.translate(sizeAfter.width / 2, sizeAfter.height / 2);
  context.rotate((degrees * Math.PI) / 180);
  context.translate(-sizeBefore.width / 2, -sizeBefore.height / 2);
}
