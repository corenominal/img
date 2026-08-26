import { BrowserWindow, dialog, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc/channels';
import type {
  DiscardChangesChoice,
  ExportImageResult,
  OpenAtPathResult,
  OpenImageResult,
  OpenProjectResult,
  SaveProjectAtPathResult,
  SaveProjectResult,
} from '../../shared/types/imageEditorApi';
import { openImage } from '../files/openImage';
import { exportImage, isExportImageRequest } from '../files/exportImage';
import {
  saveProject,
  saveProjectAtPath,
  isSaveProjectRequest,
  isSaveProjectAtPathRequest,
} from '../files/saveProject';
import { openProject } from '../files/openProject';
import { openAtPath } from '../files/openAtPath';
import { addRecentFile } from '../files/recentFiles';
import { isEditorMenuState } from '../menu/editorMenuState';
import { refreshRecentFilesMenu, setEditorMenuState } from '../menu/menuController';

const DISCARD_CHANGES_CHOICES: readonly DiscardChangesChoice[] = ['save', 'discard', 'cancel'];

// A successful open/save is exactly when a path becomes worth
// remembering — feeds both the "Open Recent" submenu and the OS-level
// recent-documents list (see recentFiles.ts).
async function rememberRecentFile(filePath: string): Promise<void> {
  await addRecentFile(filePath);
  await refreshRecentFilesMenu();
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.openImage, async (event): Promise<OpenImageResult> => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      return { status: 'error', message: 'The application window is not available.' };
    }
    const result = await openImage(window);
    if (result.status === 'opened') {
      await rememberRecentFile(result.filePath);
    }
    return result;
  });

  ipcMain.handle(
    IPC_CHANNELS.exportImage,
    async (event, request: unknown): Promise<ExportImageResult> => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        return { status: 'error', message: 'The application window is not available.' };
      }
      if (!isExportImageRequest(request)) {
        return { status: 'error', message: 'The export request was invalid.' };
      }
      return exportImage(window, request);
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.saveProject,
    async (event, request: unknown): Promise<SaveProjectResult> => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        return { status: 'error', message: 'The application window is not available.' };
      }
      if (!isSaveProjectRequest(request)) {
        return { status: 'error', message: 'The save request was invalid.' };
      }
      const result = await saveProject(window, request);
      if (result.status === 'saved') {
        await rememberRecentFile(result.filePath);
      }
      return result;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.saveProjectAtPath,
    async (_event, request: unknown): Promise<SaveProjectAtPathResult> => {
      if (!isSaveProjectAtPathRequest(request)) {
        return { status: 'error', message: 'The save request was invalid.' };
      }
      const result = await saveProjectAtPath(request);
      if (result.status === 'saved') {
        await rememberRecentFile(result.filePath);
      }
      return result;
    },
  );

  ipcMain.handle(IPC_CHANNELS.openProject, async (event): Promise<OpenProjectResult> => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      return { status: 'error', message: 'The application window is not available.' };
    }
    const result = await openProject(window);
    if (result.status === 'opened') {
      await rememberRecentFile(result.filePath);
    }
    return result;
  });

  ipcMain.handle(
    IPC_CHANNELS.openAtPath,
    async (_event, filePath: unknown): Promise<OpenAtPathResult> => {
      if (typeof filePath !== 'string') {
        return { status: 'error', message: 'The file path was invalid.' };
      }
      const result = await openAtPath(filePath);
      if (result.status === 'opened-image' || result.status === 'opened-project') {
        await rememberRecentFile(result.filePath);
      }
      return result;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.confirmDiscardChanges,
    async (event, filename: unknown): Promise<DiscardChangesChoice> => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        return 'cancel';
      }
      const name = typeof filename === 'string' && filename ? filename : 'this document';
      const { response } = await dialog.showMessageBox(window, {
        type: 'warning',
        buttons: ['Save', "Don't Save", 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        message: `Do you want to save the changes you made to "${name}"?`,
        detail: "Your changes will be lost if you don't save them.",
      });
      return DISCARD_CHANGES_CHOICES[response] ?? 'cancel';
    },
  );

  ipcMain.on(IPC_CHANNELS.editorStateChanged, (_event, state: unknown) => {
    if (isEditorMenuState(state)) {
      setEditorMenuState(state);
    }
  });
}
