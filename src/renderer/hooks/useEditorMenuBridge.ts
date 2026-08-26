import { useEffect } from 'react';
import { useOpenImage } from './useOpenImage';
import { useOpenProject } from './useOpenProject';
import { useSaveProject } from './useSaveProject';
import { useDocumentStore } from '../stores/documentStore';
import { useResizeDialogStore } from '../stores/resizeDialogStore';
import { useExportDialogStore } from '../stores/exportDialogStore';
import { getRedoLabel, getUndoLabel } from '../editor/document/documentHistoryLabels';

// Bridges the native menu (main process) and the document/history store:
// incoming menu-triggered actions call store actions, and outgoing document/
// history state keeps the menu's enabled state in sync.
export function useEditorMenuBridge(): void {
  const openImage = useOpenImage();
  const openProject = useOpenProject();
  const saveProject = useSaveProject();
  const document = useDocumentStore((state) => state.document);
  const history = useDocumentStore((state) => state.history);

  useEffect(() => {
    return window.imageEditor.onOpenImageMenuRequested(() => {
      void openImage();
    });
  }, [openImage]);

  useEffect(() => {
    return window.imageEditor.onOpenProjectMenuRequested(() => {
      void openProject();
    });
  }, [openProject]);

  useEffect(() => {
    return window.imageEditor.onSaveProjectMenuRequested(() => {
      void saveProject();
    });
  }, [saveProject]);

  useEffect(() => {
    return window.imageEditor.onExportImageMenuRequested(() => {
      useExportDialogStore.getState().open();
    });
  }, []);

  useEffect(() => {
    return window.imageEditor.onImageActionRequested((action) => {
      const { applyOperation } = useDocumentStore.getState();
      switch (action) {
        case 'rotate-left':
          applyOperation({ type: 'rotate', degrees: 270 });
          break;
        case 'rotate-right':
          applyOperation({ type: 'rotate', degrees: 90 });
          break;
        case 'flip-horizontal':
          applyOperation({ type: 'flip', axis: 'horizontal' });
          break;
        case 'flip-vertical':
          applyOperation({ type: 'flip', axis: 'vertical' });
          break;
        case 'resize':
          useResizeDialogStore.getState().open();
          break;
      }
    });
  }, []);

  useEffect(() => {
    return window.imageEditor.onHistoryActionRequested((action) => {
      const state = useDocumentStore.getState();
      if (action === 'undo') {
        state.undo();
      } else {
        state.redo();
      }
    });
  }, []);

  useEffect(() => {
    window.imageEditor.notifyEditorState({
      hasDocument: document !== null,
      undoLabel: history ? getUndoLabel(history) : null,
      redoLabel: history ? getRedoLabel(history) : null,
    });
  }, [document, history]);
}
