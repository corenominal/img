import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';
import { useOpenImage } from '../../hooks/useOpenImage';
import { ImageCanvas } from './ImageCanvas';
import { CropOverlay } from './CropOverlay';
import './CanvasWorkspace.css';

export function CanvasWorkspace(): React.JSX.Element {
  const activeDocument = useDocumentStore((state) => state.document);
  const documentError = useDocumentStore((state) => state.documentError);
  const setDocumentError = useDocumentStore((state) => state.setDocumentError);
  const activeTool = useEditorStore((state) => state.activeTool);
  const openImage = useOpenImage();

  return (
    <div className="canvas-workspace">
      {documentError && (
        <div role="alert" className="canvas-workspace__error">
          <p>{documentError}</p>
          <button
            type="button"
            className="canvas-workspace__error-dismiss"
            aria-label="Dismiss error"
            onClick={() => setDocumentError(null)}
          >
            ×
          </button>
        </div>
      )}
      {activeDocument ? (
        <>
          <ImageCanvas document={activeDocument} />
          {activeTool === 'crop' && (
            <CropOverlay
              imageSize={{ width: activeDocument.width, height: activeDocument.height }}
            />
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
