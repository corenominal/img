import { contextBridge, ipcRenderer } from 'electron';
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
