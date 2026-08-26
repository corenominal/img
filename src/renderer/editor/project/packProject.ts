import JSZip from 'jszip';
import type { ImageDocument } from '../document/documentTypes';
import { PROJECT_FORMAT_VERSION } from './projectFileSchema';
import type { ProjectDocumentV1 } from './projectFileSchema';

const SOURCE_FILE_NAME_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'original.jpg',
  'image/png': 'original.png',
  'image/webp': 'original.webp',
};

function sourceFileName(mimeType: string): string {
  return SOURCE_FILE_NAME_BY_MIME_TYPE[mimeType] ?? 'original.bin';
}

// Bundles the document's editable metadata alongside the untouched
// original source bytes — not a re-encode of the decoded bitmap — so
// reopening a project never loses quality or format-specific detail from
// the original image (plan.md §23: "Preserve original source assets").
export function packProject(document: ImageDocument): Promise<Uint8Array> {
  if (!document.sourceData || !document.sourceMimeType) {
    return Promise.reject(new Error('This document has no original source data to save.'));
  }

  const manifest: ProjectDocumentV1 = {
    formatVersion: PROJECT_FORMAT_VERSION,
    width: document.width,
    height: document.height,
    filename: document.filename,
    sourceFileName: sourceFileName(document.sourceMimeType),
    sourceMimeType: document.sourceMimeType,
    operations: document.operations,
  };

  const zip = new JSZip();
  zip.file('document.json', JSON.stringify(manifest, null, 2));
  zip.file(`source/${manifest.sourceFileName}`, document.sourceData);

  return zip.generateAsync({ type: 'uint8array' });
}
