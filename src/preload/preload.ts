import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type { ImageEditorApi } from '../shared/types/imageEditorApi';
import { IPC_CHANNELS } from '../shared/ipc/channels';

// Narrow, typed API exposed to the renderer. Do not expose ipcRenderer,
// Node APIs, or arbitrary IPC forwarding here.
const imageEditorApi: ImageEditorApi = {
  getVersions: () => ({
    chrome: process.versions.chrome,
    node: process.versions.node,
    electron: process.versions.electron,
  }),
  openImage: () => ipcRenderer.invoke(IPC_CHANNELS.openImage),
  exportImage: (request) => ipcRenderer.invoke(IPC_CHANNELS.exportImage, request),
  saveProject: (request) => ipcRenderer.invoke(IPC_CHANNELS.saveProject, request),
  saveProjectAtPath: (request) => ipcRenderer.invoke(IPC_CHANNELS.saveProjectAtPath, request),
  openProject: () => ipcRenderer.invoke(IPC_CHANNELS.openProject),
  openAtPath: (filePath) => ipcRenderer.invoke(IPC_CHANNELS.openAtPath, filePath),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  confirmDiscardChanges: (filename) =>
    ipcRenderer.invoke(IPC_CHANNELS.confirmDiscardChanges, filename),
  respondToWindowClose: (canClose) => {
    ipcRenderer.send(IPC_CHANNELS.windowCloseResponse, canClose);
  },
  onOpenImageMenuRequested: (callback) => {
    const listener = (): void => callback();
    ipcRenderer.on(IPC_CHANNELS.menuOpenImageRequested, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.menuOpenImageRequested, listener);
    };
  },
  onExportImageMenuRequested: (callback) => {
    const listener = (): void => callback();
    ipcRenderer.on(IPC_CHANNELS.menuExportImageRequested, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.menuExportImageRequested, listener);
    };
  },
  onSaveProjectMenuRequested: (callback) => {
    const listener = (): void => callback();
    ipcRenderer.on(IPC_CHANNELS.menuSaveProjectRequested, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.menuSaveProjectRequested, listener);
    };
  },
  onSaveProjectAsMenuRequested: (callback) => {
    const listener = (): void => callback();
    ipcRenderer.on(IPC_CHANNELS.menuSaveProjectAsRequested, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.menuSaveProjectAsRequested, listener);
    };
  },
  onOpenProjectMenuRequested: (callback) => {
    const listener = (): void => callback();
    ipcRenderer.on(IPC_CHANNELS.menuOpenProjectRequested, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.menuOpenProjectRequested, listener);
    };
  },
  onFileOpenRequested: (callback) => {
    const listener = (_event: unknown, filePath: string): void => callback(filePath);
    ipcRenderer.on(IPC_CHANNELS.fileOpenRequested, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.fileOpenRequested, listener);
    };
  },
  onWindowCloseRequested: (callback) => {
    const listener = (): void => callback();
    ipcRenderer.on(IPC_CHANNELS.windowCloseRequested, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.windowCloseRequested, listener);
    };
  },
  onViewportActionRequested: (callback) => {
    const listener = (_event: unknown, action: Parameters<typeof callback>[0]): void =>
      callback(action);
    ipcRenderer.on(IPC_CHANNELS.menuViewportAction, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.menuViewportAction, listener);
    };
  },
  onImageActionRequested: (callback) => {
    const listener = (_event: unknown, action: Parameters<typeof callback>[0]): void =>
      callback(action);
    ipcRenderer.on(IPC_CHANNELS.menuImageAction, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.menuImageAction, listener);
    };
  },
  onHistoryActionRequested: (callback) => {
    const listener = (_event: unknown, action: Parameters<typeof callback>[0]): void =>
      callback(action);
    ipcRenderer.on(IPC_CHANNELS.menuHistoryAction, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.menuHistoryAction, listener);
    };
  },
  notifyEditorState: (state) => {
    ipcRenderer.send(IPC_CHANNELS.editorStateChanged, state);
  },
};

contextBridge.exposeInMainWorld('imageEditor', imageEditorApi);
