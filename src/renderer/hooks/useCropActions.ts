import { useCallback } from 'react';
import { useCropStore } from '../stores/cropStore';
import { useDocumentStore } from '../stores/documentStore';
import { useEditorStore } from '../stores/editorStore';

interface CropActions {
  commit: () => void;
  cancel: () => void;
}

export function useCropActions(): CropActions {
  const applyOperation = useDocumentStore((state) => state.applyOperation);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const resetCrop = useCropStore((state) => state.reset);

  const commit = useCallback(() => {
    const { rect } = useCropStore.getState();
    if (!rect) {
      return;
    }
    applyOperation({
      type: 'crop',
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
    resetCrop();
    setActiveTool('move');
  }, [applyOperation, resetCrop, setActiveTool]);

  const cancel = useCallback(() => {
    resetCrop();
    setActiveTool('move');
  }, [resetCrop, setActiveTool]);

  return { commit, cancel };
}
