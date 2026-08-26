import { dialog } from 'electron';
import type { BrowserWindow } from 'electron';
import { writeFile } from 'node:fs/promises';
import type { SaveProjectRequest, SaveProjectResult } from '../../shared/types/imageEditorApi';

// Guards the IPC boundary: the renderer packs the archive itself, so this
// only needs to reject a malformed payload before it reaches the
// filesystem.
export function isSaveProjectRequest(value: unknown): value is SaveProjectRequest {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return candidate.data instanceof Uint8Array && typeof candidate.suggestedFileName === 'string';
}

export async function saveProject(
  window: BrowserWindow,
  request: SaveProjectRequest,
): Promise<SaveProjectResult> {
  // showSaveDialog's native panel already asks the user to confirm
  // replacing a file they pick that already exists, so no extra overwrite
  // prompt is needed here.
  const dialogResult = await dialog.showSaveDialog(window, {
    title: 'Save Project',
    defaultPath: `${request.suggestedFileName || 'untitled'}.imgedit`,
    filters: [{ name: 'Image Editor Project', extensions: ['imgedit'] }],
  });

  const filePath = dialogResult.filePath;
  if (dialogResult.canceled || !filePath) {
    return { status: 'cancelled' };
  }

  try {
    await writeFile(filePath, request.data);
    return { status: 'saved', filePath };
  } catch (error) {
    console.error('[project:save] Failed to write file', filePath, error);
    return {
      status: 'error',
      message:
        'The project could not be saved. You may not have permission to write to this location, or the disk may be full.',
    };
  }
}
