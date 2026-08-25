export interface OpenImageSuccess {
  status: 'opened';
  fileName: string;
  filePath: string;
  mimeType: string;
  data: Uint8Array;
}

export interface OpenImageCancelled {
  status: 'cancelled';
}

export interface OpenImageError {
  status: 'error';
  message: string;
}

export type OpenImageResult = OpenImageSuccess | OpenImageCancelled | OpenImageError;

export interface ImageEditorApi {
  getVersions: () => {
    chrome: string;
    node: string;
    electron: string;
  };
  openImage: () => Promise<OpenImageResult>;
  onOpenImageMenuRequested: (callback: () => void) => () => void;
}
