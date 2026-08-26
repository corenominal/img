import { createDocument } from './createDocument';
import type { ImageDocument } from './documentTypes';

export interface OpenedImageBytes {
  fileName: string;
  filePath: string;
  mimeType: string;
  data: Uint8Array;
}

// Shared by useOpenImage.ts (native Open dialog) and useOpenAtPath.ts
// (drag-and-drop, "Open Recent", OS file associations) — every path that
// ends with raw opened-image bytes decodes them the same way.
export async function decodeOpenedImage(result: OpenedImageBytes): Promise<ImageDocument> {
  const bytes = new Uint8Array(result.data);
  const blob = new Blob([bytes], { type: result.mimeType });
  const source = await createImageBitmap(blob);
  return createDocument({
    filename: result.fileName,
    sourcePath: result.filePath,
    source,
    sourceData: bytes,
    sourceMimeType: result.mimeType,
  });
}
