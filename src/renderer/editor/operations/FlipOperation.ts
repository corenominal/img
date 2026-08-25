import type { Size } from '../viewport/viewportTypes';

export interface FlipOperation {
  type: 'flip';
  axis: 'horizontal' | 'vertical';
}

export function flipSize(size: Size): Size {
  return size;
}

export function applyFlipTransform(
  context: CanvasRenderingContext2D,
  axis: FlipOperation['axis'],
  sizeBefore: Size,
): void {
  if (axis === 'horizontal') {
    context.translate(sizeBefore.width, 0);
    context.scale(-1, 1);
  } else {
    context.translate(0, sizeBefore.height);
    context.scale(1, -1);
  }
}
