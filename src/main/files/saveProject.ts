import { dialog } from 'electron';
import type { BrowserWindow } from 'electron';
import { writeFile } from 'node:fs/promises';
import type {
  SaveProjectAtPathRequest,
  SaveProjectAtPathResult,
  SaveProjectRequest,
  SaveProjectResult,
} from '../../shared/types/imageEditorApi';

const WRITE_ERROR_MESSAGE =
  'The project could not be saved. You may not have permission to write to this location, or the disk may be full.';

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

export function isSaveProjectAtPathRequest(value: unknown): value is SaveProjectAtPathRequest {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return candidate.data instanceof Uint8Array && typeof candidate.filePath === 'string';
}

async function writeProjectFile(
  filePath: string,
  data: Uint8Array,
): Promise<{ status: 'saved'; filePath: string } | { status: 'error'; message: string }> {
  try {
    await writeFile(filePath, data);
    return { status: 'saved', filePath };
  } catch (error) {
    console.error('[project:save] Failed to write file', filePath, error);
    return { status: 'error', message: WRITE_ERROR_MESSAGE };
  }
}

// "Save As": always shows the native panel. showSaveDialog's panel already
// asks the user to confirm replacing a file they pick that already
// exists, so no extra overwrite prompt is needed here.
export async function saveProject(
  window: BrowserWindow,
  request: SaveProjectRequest,
): Promise<SaveProjectResult> {
  const dialogResult = await dialog.showSaveDialog(window, {
    title: 'Save Project',
    defaultPath: `${request.suggestedFileName || 'untitled'}.imgedit`,
    filters: [{ name: 'Image Editor Project', extensions: ['imgedit'] }],
  });

  const filePath = dialogResult.filePath;
  if (dialogResult.canceled || !filePath) {
    return { status: 'cancelled' };
  }

  return writeProjectFile(filePath, request.data);
}

// "Save": writes straight back to an already-known project path, no
// dialog — used once a document has been saved to or opened from a
// project file (see documentTypes.ts's `projectPath`).
export function saveProjectAtPath(
  request: SaveProjectAtPathRequest,
): Promise<SaveProjectAtPathResult> {
  return writeProjectFile(request.filePath, request.data);
}
