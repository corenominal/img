import type { Size } from '../viewport/viewportTypes';

export interface CropOperation {
  type: 'crop';
  x: number;
  y: number;
  width: number;
  height: number;
}

export function cropSize(operation: CropOperation): Size {
  return { width: operation.width, height: operation.height };
}
