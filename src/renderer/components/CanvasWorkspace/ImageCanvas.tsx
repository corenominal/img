import { useEffect, useMemo, useRef } from 'react';
import type { ImageDocument } from '../../editor/document/documentTypes';
import type { AdjustmentKind } from '../../editor/operations/AdjustmentOperation';
import { getAdjustmentTotal } from '../../editor/operations/adjustmentTotals';
import type { ImageOperation } from '../../editor/operations/ImageOperation';
import { renderToCanvas } from '../../editor/rendering/CanvasRenderer';
import { flattenOperations } from '../../editor/rendering/flattenOperations';
import { ZOOM_STEP_FACTOR } from '../../editor/viewport/viewportMath';
import { useResizeObserver } from '../../hooks/useResizeObserver';
import { useViewportInteractions } from '../../hooks/useViewportInteractions';
import { useAdjustmentStore } from '../../stores/adjustmentStore';
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
  }, [
    activeDocument.id,
    activeDocument.width,
    activeDocument.height,
    containerSize,
    fitToContainer,
    centerImage,
  ]);

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

  // While a slider gesture is in progress, the adjustment store holds the
  // absolute value it's currently showing, which hasn't been committed to
  // document history yet (see useAdjustmentActions.ts). The delta between
  // that and the committed total is what actually needs previewing on top
  // of the flattened document, at the cost of re-flattening on every
  // slider tick — acceptable for now per plan.md §13 (profile before
  // optimising).
  const activeAdjustments = useAdjustmentStore((state) => state.active);
  const previewOperations = useMemo(() => {
    const ops: ImageOperation[] = [];
    for (const kind of Object.keys(activeAdjustments) as AdjustmentKind[]) {
      const targetValue = activeAdjustments[kind];
      if (targetValue === undefined) {
        continue;
      }
      const delta = targetValue - getAdjustmentTotal(activeDocument.operations, kind);
      if (delta !== 0) {
        ops.push({ type: kind, value: delta });
      }
    }
    return ops;
  }, [activeAdjustments, activeDocument.operations]);

  const flattenedSource = useMemo(
    () =>
      flattenOperations(activeDocument.source, [
        ...activeDocument.operations,
        ...previewOperations,
      ]),
    [activeDocument.source, activeDocument.operations, previewOperations],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && containerSize.width > 0 && containerSize.height > 0) {
      renderToCanvas(
        canvas,
        flattenedSource,
        { zoom, offsetX, offsetY },
        containerSize,
        getDevicePixelRatio(),
      );
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
