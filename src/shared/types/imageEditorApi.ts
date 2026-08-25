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

export type ViewportMenuAction = 'zoom-in' | 'zoom-out' | 'actual-size' | 'fit-to-window';

export type ImageMenuAction = 'rotate-left' | 'rotate-right' | 'flip-horizontal' | 'flip-vertical';

export type HistoryMenuAction = 'undo' | 'redo';

export interface EditorMenuState {
  hasDocument: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

export interface ImageEditorApi {
  getVersions: () => {
    chrome: string;
    node: string;
    electron: string;
  };
  openImage: () => Promise<OpenImageResult>;
  onOpenImageMenuRequested: (callback: () => void) => () => void;
  onViewportActionRequested: (callback: (action: ViewportMenuAction) => void) => () => void;
  onImageActionRequested: (callback: (action: ImageMenuAction) => void) => () => void;
  onHistoryActionRequested: (callback: (action: HistoryMenuAction) => void) => () => void;
  notifyEditorState: (state: EditorMenuState) => void;
}
