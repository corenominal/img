import { useEffect } from 'react';
import { useOpenImage } from './useOpenImage';
import { useDocumentStore } from '../stores/documentStore';
import { canRedo, canUndo } from '../editor/history/HistoryManager';

// Bridges the native menu (main process) and the document/history store:
// incoming menu-triggered actions call store actions, and outgoing document/
// history state keeps the menu's enabled state in sync.
export function useEditorMenuBridge(): void {
  const openImage = useOpenImage();
  const document = useDocumentStore((state) => state.document);
  const history = useDocumentStore((state) => state.history);

  useEffect(() => {
    return window.imageEditor.onOpenImageMenuRequested(() => {
      void openImage();
    });
  }, [openImage]);

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
      canUndo: history !== null && canUndo(history),
      canRedo: history !== null && canRedo(history),
    });
  }, [document, history]);
}
