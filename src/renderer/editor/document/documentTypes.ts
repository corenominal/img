import type { ImageOperation } from '../operations/ImageOperation';

export interface ImageDocument {
  id: string;
  filename: string;
  sourcePath: string;
  width: number;
  height: number;
  source: ImageBitmap;
  operations: ImageOperation[];
  dirty: boolean;
}
