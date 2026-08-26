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

export type ExportFormat = 'jpeg' | 'png' | 'webp';

export interface ExportImageRequest {
  format: ExportFormat;
  // Already-encoded image bytes, produced in the renderer (see
  // renderExport.ts) — the main process only writes them to disk.
  data: Uint8Array;
  // Filename without an extension; the main process appends the one
  // matching `format`.
  suggestedFileName: string;
}

export interface ExportImageSuccess {
  status: 'exported';
  filePath: string;
}

export interface ExportImageCancelled {
  status: 'cancelled';
}

export interface ExportImageError {
  status: 'error';
  message: string;
}

export type ExportImageResult = ExportImageSuccess | ExportImageCancelled | ExportImageError;

export interface SaveProjectRequest {
  // Already-packed .imgedit archive bytes, produced in the renderer (see
  // editor/project/packProject.ts) — the main process only writes them to
  // disk.
  data: Uint8Array;
  // Filename without an extension; the main process appends .imgedit.
  suggestedFileName: string;
}

export interface SaveProjectSuccess {
  status: 'saved';
  filePath: string;
}

export interface SaveProjectCancelled {
  status: 'cancelled';
}

export interface SaveProjectError {
  status: 'error';
  message: string;
}

export type SaveProjectResult = SaveProjectSuccess | SaveProjectCancelled | SaveProjectError;

export interface OpenProjectSuccess {
  status: 'opened';
  filePath: string;
  data: Uint8Array;
}

export interface OpenProjectCancelled {
  status: 'cancelled';
}

export interface OpenProjectError {
  status: 'error';
  message: string;
}

export type OpenProjectResult = OpenProjectSuccess | OpenProjectCancelled | OpenProjectError;

export type ViewportMenuAction = 'zoom-in' | 'zoom-out' | 'actual-size' | 'fit-to-window';

export type ImageMenuAction =
  'rotate-left' | 'rotate-right' | 'flip-horizontal' | 'flip-vertical' | 'resize';

export type HistoryMenuAction = 'undo' | 'redo';

export interface EditorMenuState {
  hasDocument: boolean;
  // The label of the operation that would be undone/redone (e.g. "Rotate
  // Right"), or null when there is nothing to undo/redo.
  undoLabel: string | null;
  redoLabel: string | null;
}

export interface ImageEditorApi {
  getVersions: () => {
    chrome: string;
    node: string;
    electron: string;
  };
  openImage: () => Promise<OpenImageResult>;
  exportImage: (request: ExportImageRequest) => Promise<ExportImageResult>;
  saveProject: (request: SaveProjectRequest) => Promise<SaveProjectResult>;
  openProject: () => Promise<OpenProjectResult>;
  onOpenImageMenuRequested: (callback: () => void) => () => void;
  onExportImageMenuRequested: (callback: () => void) => () => void;
  onSaveProjectMenuRequested: (callback: () => void) => () => void;
  onOpenProjectMenuRequested: (callback: () => void) => () => void;
  onViewportActionRequested: (callback: (action: ViewportMenuAction) => void) => () => void;
  onImageActionRequested: (callback: (action: ImageMenuAction) => void) => () => void;
  onHistoryActionRequested: (callback: (action: HistoryMenuAction) => void) => () => void;
  notifyEditorState: (state: EditorMenuState) => void;
}
