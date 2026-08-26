import { useEffect } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { documentDisplayName } from '../editor/document/documentDisplayName';

const APP_NAME = 'Image Editor';

// Reflects the open document's name and dirty state in the native window
// title bar (Electron syncs the OS title to `document.title` unless
// overridden) — per plan.md §24: "photo.imgedit — Image Editor" /
// "photo.imgedit • — Image Editor" while dirty.
export function useDocumentTitle(): void {
  const activeDocument = useDocumentStore((state) => state.document);

  useEffect(() => {
    if (!activeDocument) {
      window.document.title = APP_NAME;
      return;
    }
    const name = documentDisplayName(activeDocument);
    const dirtyMarker = activeDocument.dirty ? ' •' : '';
    window.document.title = `${name}${dirtyMarker} — ${APP_NAME}`;
  }, [activeDocument]);
}
