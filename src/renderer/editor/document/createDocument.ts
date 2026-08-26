import type { ImageDocument } from './documentTypes';

interface CreateDocumentInput {
  filename: string;
  sourcePath: string;
  source: ImageBitmap;
  sourceData: Uint8Array;
  sourceMimeType: string;
}

export function createDocument({
  filename,
  sourcePath,
  source,
  sourceData,
  sourceMimeType,
}: CreateDocumentInput): ImageDocument {
  return {
    id: crypto.randomUUID(),
    filename,
    sourcePath,
    width: source.width,
    height: source.height,
    source,
    operations: [],
    dirty: false,
    sourceData,
    sourceMimeType,
  };
}
