import { contextBridge } from 'electron';
import type { ImageEditorApi } from '../shared/types/imageEditorApi';

// Narrow, typed API exposed to the renderer. Do not expose ipcRenderer,
// Node APIs, or arbitrary IPC forwarding here.
const imageEditorApi: ImageEditorApi = {
  getVersions: () => ({
    chrome: process.versions.chrome,
    node: process.versions.node,
    electron: process.versions.electron,
  }),
};

contextBridge.exposeInMainWorld('imageEditor', imageEditorApi);
