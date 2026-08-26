import { dialog } from 'electron';
import type { BrowserWindow } from 'electron';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  OpenImageError,
  OpenImageResult,
  OpenImageSuccess,
} from '../../shared/types/imageEditorApi';

export const SUPPORTED_IMAGE_EXTENSIONS: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

// Shared with openAtPath.ts (drag-and-drop, "Open Recent", OS file
// associations) so there is exactly one place that knows how to turn an
// image path into an OpenImageResult. Narrower than OpenImageResult: a
// direct file read has nothing for the user to cancel.
export async function readImageAtPath(
  filePath: string,
): Promise<OpenImageSuccess | OpenImageError> {
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = SUPPORTED_IMAGE_EXTENSIONS[extension];
  if (!mimeType) {
    return {
      status: 'error',
      message: 'The selected file type is not supported. Please choose a JPEG, PNG or WebP image.',
    };
  }

  try {
    const buffer = await readFile(filePath);
    return {
      status: 'opened',
      fileName: path.basename(filePath),
      filePath,
      mimeType,
      // Sent as a plain Uint8Array so it survives structured-clone across
      // the context-isolated IPC boundary reliably.
      data: new Uint8Array(buffer),
    };
  } catch (error) {
    console.error('[image:open] Failed to read file', filePath, error);
    return {
      status: 'error',
      message:
        'The image could not be opened. The file may be damaged, moved, or you may not have permission to read it.',
    };
  }
}

export async function openImage(window: BrowserWindow): Promise<OpenImageResult> {
  const dialogResult = await dialog.showOpenDialog(window, {
    title: 'Open Image',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
  });

  const filePath = dialogResult.filePaths[0];
  if (dialogResult.canceled || !filePath) {
    return { status: 'cancelled' };
  }

  return readImageAtPath(filePath);
}
