import type { ImageEditorApi } from './imageEditorApi';

declare global {
  interface Window {
    imageEditor: ImageEditorApi;
  }
}

export {};
