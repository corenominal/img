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

  // The original opened image's still-encoded bytes and MIME type. Kept
  // alongside the decoded `source` so a saved project can embed the exact
  // original asset (see editor/project/) instead of re-encoding the
  // decoded bitmap, which would lose quality/format fidelity. Optional so
  // documents built directly in tests don't all need to supply it —
  // production documents always populate it via createDocument().
  sourceData?: Uint8Array;
  sourceMimeType?: string;

  // Set once this document has been saved to or opened from a native
  // .imgedit project file. Undefined for a document that only exists as a
  // freshly opened raster image.
  projectPath?: string;
}
