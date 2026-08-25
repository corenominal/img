import { dialog } from 'electron';
import type { BrowserWindow } from 'electron';
import { writeFile } from 'node:fs/promises';
import type {
  ExportFormat,
  ExportImageRequest,
  ExportImageResult,
} from '../../shared/types/imageEditorApi';

const EXTENSION_BY_FORMAT: Record<ExportFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

const FILTER_NAME_BY_FORMAT: Record<ExportFormat, string> = {
  jpeg: 'JPEG Image',
  png: 'PNG Image',
  webp: 'WebP Image',
};

const EXPORT_FORMATS: ExportFormat[] = ['jpeg', 'png', 'webp'];

// Guards the IPC boundary: the renderer chooses `format` and encodes
// `data` itself, so this only needs to reject a malformed payload before
// it reaches the filesystem.
export function isExportImageRequest(value: unknown): value is ExportImageRequest {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.format === 'string' &&
    EXPORT_FORMATS.includes(candidate.format as ExportFormat) &&
    candidate.data instanceof Uint8Array &&
    typeof candidate.suggestedFileName === 'string'
  );
}

export async function exportImage(
  window: BrowserWindow,
  request: ExportImageRequest,
): Promise<ExportImageResult> {
  const extension = EXTENSION_BY_FORMAT[request.format];

  // showSaveDialog's native panel already asks the user to confirm
  // replacing a file they pick that already exists (macOS and Windows
  // both do this out of the box), so no extra overwrite prompt is needed.
  const dialogResult = await dialog.showSaveDialog(window, {
    title: 'Export Image',
    defaultPath: `${request.suggestedFileName || 'export'}.${extension}`,
    filters: [{ name: FILTER_NAME_BY_FORMAT[request.format], extensions: [extension] }],
  });

  const filePath = dialogResult.filePath;
  if (dialogResult.canceled || !filePath) {
    return { status: 'cancelled' };
  }

  try {
    await writeFile(filePath, request.data);
    return { status: 'exported', filePath };
  } catch (error) {
    console.error('[image:export] Failed to write file', filePath, error);
    return {
      status: 'error',
      message:
        'The image could not be exported. You may not have permission to write to this location, or the disk may be full.',
    };
  }
}
