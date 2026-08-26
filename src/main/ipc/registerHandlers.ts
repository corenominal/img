import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc/channels';
import type {
  ExportImageResult,
  OpenImageResult,
  OpenProjectResult,
  SaveProjectResult,
} from '../../shared/types/imageEditorApi';
import { openImage } from '../files/openImage';
import { exportImage, isExportImageRequest } from '../files/exportImage';
import { saveProject, isSaveProjectRequest } from '../files/saveProject';
import { openProject } from '../files/openProject';
import { isEditorMenuState, updateEditorMenuState } from '../menu/editorMenuState';

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.openImage, async (event): Promise<OpenImageResult> => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      return { status: 'error', message: 'The application window is not available.' };
    }
    return openImage(window);
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
      return saveProject(window, request);
    },
  );

  ipcMain.handle(IPC_CHANNELS.openProject, async (event): Promise<OpenProjectResult> => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      return { status: 'error', message: 'The application window is not available.' };
    }
    return openProject(window);
  });

  ipcMain.on(IPC_CHANNELS.editorStateChanged, (_event, state: unknown) => {
    if (isEditorMenuState(state)) {
      updateEditorMenuState(state);
    }
  });
}
