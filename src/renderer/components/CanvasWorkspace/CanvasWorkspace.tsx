import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { useOpenImage } from '../../hooks/useOpenImage';
import { ImageCanvas } from './ImageCanvas';
import { CropOverlay } from './CropOverlay';
import './CanvasWorkspace.css';

export function CanvasWorkspace(): React.JSX.Element {
  const activeDocument = useDocumentStore((state) => state.document);
  const openError = useDocumentStore((state) => state.openError);
  const setOpenError = useDocumentStore((state) => state.setOpenError);
  const activeTool = useEditorStore((state) => state.activeTool);
  const openImage = useOpenImage();

  return (
    <div className="canvas-workspace">
      {openError && (
        <div role="alert" className="canvas-workspace__error">
          <p>{openError}</p>
          <button
            type="button"
            className="canvas-workspace__error-dismiss"
            aria-label="Dismiss error"
            onClick={() => setOpenError(null)}
          >
            ×
          </button>
        </div>
      )}
      {activeDocument ? (
        <>
          <ImageCanvas document={activeDocument} />
          {activeTool === 'crop' && (
            <CropOverlay imageSize={{ width: activeDocument.width, height: activeDocument.height }} />
          )}
        </>
      ) : (
        <div className="canvas-workspace__empty">
          <p className="canvas-workspace__title">No image open</p>
          <button
            type="button"
            className="canvas-workspace__open-button"
            onClick={() => void openImage()}
          >
            Open Image
          </button>
        </div>
      )}
    </div>
  );
}
