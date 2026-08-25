import type { Size } from '../viewport/viewportTypes';

export function aspectRatioOf(size: Size): number {
  return size.width / size.height;
}

export function heightForWidth(width: number, aspectRatio: number): number {
  return Math.round(width / aspectRatio);
}

export function widthForHeight(height: number, aspectRatio: number): number {
  return Math.round(height * aspectRatio);
}
