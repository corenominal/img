export interface ImageEditorApi {
  getVersions: () => {
    chrome: string;
    node: string;
    electron: string;
  };
}
