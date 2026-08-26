import { useEffect } from 'react';
import { useDocumentStore } from '../stores/documentStore';
import { useSaveProject } from './useSaveProject';
import { documentDisplayName } from '../editor/document/documentDisplayName';

// The main process intercepts the window's close and asks (via
// onWindowCloseRequested) whether it's safe to proceed — see
// main.ts's 'close' handler. This is the renderer's half: it owns the
// document's dirty state, so it decides, and tells main via
// respondToWindowClose().
export function useUnsavedChangesGuard(): void {
  const saveProject = useSaveProject();

  useEffect(() => {
    return window.imageEditor.onWindowCloseRequested(() => {
      void (async () => {
        const { document } = useDocumentStore.getState();
        if (!document?.dirty) {
          window.imageEditor.respondToWindowClose(true);
          return;
        }

        const choice = await window.imageEditor.confirmDiscardChanges(
          documentDisplayName(document),
        );

        if (choice === 'discard') {
          window.imageEditor.respondToWindowClose(true);
          return;
        }
        if (choice === 'cancel') {
          window.imageEditor.respondToWindowClose(false);
          return;
        }

        // 'save': if it's still dirty afterwards (e.g. the save dialog was
        // itself cancelled, or the save failed), don't close — the user
        // would otherwise lose the changes they just asked to keep.
        await saveProject();
        const stillDirty = useDocumentStore.getState().document?.dirty;
        window.imageEditor.respondToWindowClose(stillDirty !== true);
      })();
    });
  }, [saveProject]);
}
