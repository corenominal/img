import { Menu } from 'electron';
import type { EditorMenuState } from '../../shared/types/imageEditorApi';
import { buildApplicationMenu } from './applicationMenu';
import { updateEditorMenuState } from './editorMenuState';
import { clearRecentFiles, getRecentFiles } from '../files/recentFiles';

// Owns the two pieces of state the native menu depends on but that only
// the renderer/filesystem know about: the undo/redo/hasDocument state
// (frequent, cheap to apply — see editorMenuState.ts) and the recent
// files list (infrequent, requires a full menu rebuild since the "Open
// Recent" submenu's items themselves change, not just their enabled
// state/labels).
let recentFiles: string[] = [];
let editorState: EditorMenuState = { hasDocument: false, undoLabel: null, redoLabel: null };

function installMenu(): void {
  Menu.setApplicationMenu(buildApplicationMenu(recentFiles, () => void clearRecentFilesMenu()));
  updateEditorMenuState(editorState);
}

export async function initializeMenu(): Promise<void> {
  recentFiles = await getRecentFiles();
  installMenu();
}

export async function refreshRecentFilesMenu(): Promise<void> {
  recentFiles = await getRecentFiles();
  installMenu();
}

async function clearRecentFilesMenu(): Promise<void> {
  await clearRecentFiles();
  await refreshRecentFilesMenu();
}

export function setEditorMenuState(state: EditorMenuState): void {
  editorState = state;
  updateEditorMenuState(state);
}
