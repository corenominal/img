import type { ImageDocument } from '../document/documentTypes';
import { flattenOperations } from '../rendering/flattenOperations';
import type { ExportFormat, ExportOptions } from './exportTypes';

const MIME_TYPE_BY_FORMAT: Record<ExportFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function shouldFlattenBackground(options: ExportOptions): boolean {
  return options.format === 'jpeg' || (options.format === 'png' && !options.preserveTransparency);
}

// The renderer's half of export (plan.md §5's editor/export/): rendering
// belongs here, not in the main process, since encoding needs the DOM
// Canvas API. main/files/exportImage.ts only ever sees the resulting
// bytes and a native save dialog.
//
// Deliberately built from `document.source` + `document.operations` via
// flattenOperations — the same full-resolution pipeline the on-screen
// canvas uses before viewport scaling is applied — so export is
// independent of the current zoom/pan by construction, not by convention.
export function renderDocumentToBlob(
  document: ImageDocument,
  options: ExportOptions,
): Promise<Blob> {
  const flattened = flattenOperations(document.source, document.operations);

  // `window.document`, not the bare global: the `document` parameter above
  // shadows it.
  const canvas = window.document.createElement('canvas');
  canvas.width = document.width;
  canvas.height = document.height;
  const context = canvas.getContext('2d');
  if (!context) {
    return Promise.reject(new Error('2D canvas context is not available'));
  }

  if (shouldFlattenBackground(options)) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(flattened, 0, 0);

  const mimeType = MIME_TYPE_BY_FORMAT[options.format];
  const quality = options.format === 'png' ? undefined : options.quality;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to encode the image.'));
        }
      },
      mimeType,
      quality,
    );
  });
}
