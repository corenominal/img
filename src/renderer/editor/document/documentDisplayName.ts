import type { ImageDocument } from './documentTypes';

// Once a document has been saved to/opened from a project file, its
// project filename takes over from the raw image's — shared by the
// window title (useDocumentTitle.ts) and the unsaved-changes confirmation
// (useUnsavedChangesGuard.ts) so both name the document the same way.
export function documentDisplayName(
  document: Pick<ImageDocument, 'filename' | 'projectPath'>,
): string {
  if (!document.projectPath) {
    return document.filename;
  }
  return document.projectPath.split(/[\\/]/).pop() || document.projectPath;
}
