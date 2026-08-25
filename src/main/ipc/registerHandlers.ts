import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc/channels';
import type { OpenImageResult } from '../../shared/types/imageEditorApi';
import { openImage } from '../files/openImage';
import { isEditorMenuState, updateEditorMenuState } from '../menu/editorMenuState';

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.openImage, async (event): Promise<OpenImageResult> => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) {
      return { status: 'error', message: 'The application window is not available.' };
    }
    return openImage(window);
  });

  ipcMain.on(IPC_CHANNELS.editorStateChanged, (_event, state: unknown) => {
    if (isEditorMenuState(state)) {
      updateEditorMenuState(state);
    }
  });
}
