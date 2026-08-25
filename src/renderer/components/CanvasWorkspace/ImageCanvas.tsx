import { useEffect, useMemo, useRef } from 'react';
import type { ImageDocument } from '../../editor/document/documentTypes';
import { renderToCanvas } from '../../editor/rendering/CanvasRenderer';
import { flattenOperations } from '../../editor/rendering/flattenOperations';
import { ZOOM_STEP_FACTOR } from '../../editor/viewport/viewportMath';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { useViewportInteractions } from '../../hooks/useViewportInteractions';
import { useEditorStore } from '../../stores/editorStore';
import { useViewportStore } from '../../stores/viewportStore';

interface ImageCanvasProps {
  document: ImageDocument;
}

function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

export function ImageCanvas({ document: activeDocument }: ImageCanvasProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerSize = useResizeObserver(canvasRef);
  const activeTool = useEditorStore((state) => state.activeTool);

  const zoom = useViewportStore((state) => state.zoom);
  const offsetX = useViewportStore((state) => state.offsetX);
  const offsetY = useViewportStore((state) => state.offsetY);
  const fitToContainer = useViewportStore((state) => state.fitToContainer);
  const centerImage = useViewportStore((state) => state.centerImage);
  const actualSize = useViewportStore((state) => state.actualSize);
  const zoomBy = useViewportStore((state) => state.zoomBy);

  const { isPanning, canPan, pointerHandlers } = useViewportInteractions({
    containerRef: canvasRef,
    activeTool,
    devicePixelRatio: getDevicePixelRatio(),
  });

  const lastFitted = useRef<{ id: string; width: number; height: number } | null>(null);

  // Fit newly opened documents to the available space. Resizing the window
  // afterwards intentionally leaves zoom/pan untouched; an operation that
  // changes the document's effective dimensions (e.g. a 90° rotation) only
  // re-centres the image at the current zoom, so it doesn't scroll out of
  // view without changing how "zoomed in" the user feels they are.
  useEffect(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return;
    }
    const imageSize = { width: activeDocument.width, height: activeDocument.height };
    const devicePixelRatio = getDevicePixelRatio();
    const previous = lastFitted.current;

    if (!previous || previous.id !== activeDocument.id) {
      fitToContainer(imageSize, containerSize, devicePixelRatio);
    } else if (previous.width !== imageSize.width || previous.height !== imageSize.height) {
      centerImage(imageSize, containerSize, devicePixelRatio);
    }

    lastFitted.current = { id: activeDocument.id, ...imageSize };
  }, [activeDocument.id, activeDocument.width, activeDocument.height, containerSize, fitToContainer, centerImage]);

  useEffect(() => {
    return window.imageEditor.onViewportActionRequested((action) => {
      if (containerSize.width === 0 || containerSize.height === 0) {
        return;
      }
      const devicePixelRatio = getDevicePixelRatio();
      const center = { x: containerSize.width / 2, y: containerSize.height / 2 };
      const imageSize = { width: activeDocument.width, height: activeDocument.height };

      switch (action) {
        case 'zoom-in':
          zoomBy(ZOOM_STEP_FACTOR, center, devicePixelRatio);
          break;
        case 'zoom-out':
          zoomBy(1 / ZOOM_STEP_FACTOR, center, devicePixelRatio);
          break;
        case 'actual-size':
          actualSize(center, devicePixelRatio);
          break;
        case 'fit-to-window':
          fitToContainer(imageSize, containerSize, devicePixelRatio);
          break;
      }
    });
  }, [
    containerSize,
    zoomBy,
    actualSize,
    fitToContainer,
    activeDocument.width,
    activeDocument.height,
  ]);

  // Only re-flatten when the source bitmap or operation stack actually
  // change (not on every pan/zoom re-render, which would redo this work on
  // every pointermove frame).
  const flattenedSource = useMemo(
    () => flattenOperations(activeDocument.source, activeDocument.operations),
    [activeDocument.source, activeDocument.operations],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && containerSize.width > 0 && containerSize.height > 0) {
      renderToCanvas(canvas, flattenedSource, { zoom, offsetX, offsetY }, containerSize, getDevicePixelRatio());
    }
  }, [flattenedSource, zoom, offsetX, offsetY, containerSize]);

  const cursorClass = isPanning ? 'image-canvas--panning' : canPan ? 'image-canvas--pan-ready' : '';

  return (
    <canvas
      ref={canvasRef}
      className={`image-canvas ${cursorClass}`.trim()}
      role="img"
      aria-label={`${activeDocument.filename}, ${activeDocument.width} by ${activeDocument.height} pixels`}
      {...pointerHandlers}
    />
  );
}
