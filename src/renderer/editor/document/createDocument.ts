import type { ImageDocument } from './documentTypes';

interface CreateDocumentInput {
  filename: string;
  sourcePath: string;
  source: ImageBitmap;
}

export function createDocument({ filename, sourcePath, source }: CreateDocumentInput): ImageDocument {
  return {
    id: crypto.randomUUID(),
    filename,
    sourcePath,
    width: source.width,
    height: source.height,
    source,
    operations: [],
    dirty: false,
  };
}
