import { useEffect, useRef } from 'react';
import type { ImageDocument } from '../../editor/document/documentTypes';
import { renderDocumentToCanvas } from '../../editor/rendering/CanvasRenderer';

interface ImageCanvasProps {
  document: ImageDocument;
}

export function ImageCanvas({ document: activeDocument }: ImageCanvasProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderDocumentToCanvas(canvasRef.current, activeDocument);
    }
  }, [activeDocument]);

  return (
    <canvas
      ref={canvasRef}
      className="image-canvas"
      role="img"
      aria-label={`${activeDocument.filename}, ${activeDocument.width} by ${activeDocument.height} pixels`}
    />
  );
}
