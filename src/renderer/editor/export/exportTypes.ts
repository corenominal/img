export type ExportFormat = 'jpeg' | 'png' | 'webp';

export interface ExportOptions {
  format: ExportFormat;
  // 0..1. Ignored for png (lossless — the browser encoder ignores it too).
  quality: number;
  // Only meaningful for png: jpeg has no alpha channel so is always
  // flattened, and canvas' webp encoder always keeps alpha as-is.
  preserveTransparency: boolean;
}
