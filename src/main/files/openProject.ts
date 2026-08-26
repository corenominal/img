import { dialog } from 'electron';
import type { BrowserWindow } from 'electron';
import { readFile } from 'node:fs/promises';
import type { OpenProjectResult } from '../../shared/types/imageEditorApi';

// Raw bytes only — validating the archive/manifest and decoding the
// embedded source image happen in the renderer (see
// editor/project/unpackProject.ts), matching the split already used for
// openImage.ts/exportImage.ts.
export async function openProject(window: BrowserWindow): Promise<OpenProjectResult> {
  const dialogResult = await dialog.showOpenDialog(window, {
    title: 'Open Project',
    properties: ['openFile'],
    filters: [{ name: 'Image Editor Project', extensions: ['imgedit'] }],
  });

  const filePath = dialogResult.filePaths[0];
  if (dialogResult.canceled || !filePath) {
    return { status: 'cancelled' };
  }

  try {
    const buffer = await readFile(filePath);
    return { status: 'opened', filePath, data: new Uint8Array(buffer) };
  } catch (error) {
    console.error('[project:open] Failed to read file', filePath, error);
    return {
      status: 'error',
      message:
        'The project could not be opened. The file may be damaged, moved, or you may not have permission to read it.',
    };
  }
}
