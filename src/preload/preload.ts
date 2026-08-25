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
  onOpenImageMenuRequested: (callback) => {
    const listener = (): void => callback();
    ipcRenderer.on(IPC_CHANNELS.menuOpenImageRequested, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.menuOpenImageRequested, listener);
    };
  },
};

contextBridge.exposeInMainWorld('imageEditor', imageEditorApi);
