import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCropStore } from '../../stores/cropStore';
import { useViewportStore } from '../../stores/viewportStore';
import { useCropActions } from '../../hooks/useCropActions';
import { imageToViewport } from '../../editor/viewport/transforms';
import type { Size } from '../../editor/viewport/viewportTypes';
import { aspectRatioValue } from '../../editor/crop/cropAspectRatios';
import type { CropHandle, CropRect } from '../../editor/crop/cropGeometry';
import { moveCropRect, resizeCropRect, resizeCropRectWithRatio } from '../../editor/crop/cropGeometry';
import { isEditableElement } from '../../utils/dom';
import './CropOverlay.css';

interface CropOverlayProps {
  imageSize: Size;
}

const HANDLES: CropHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const CORNER_HANDLES: ReadonlySet<CropHandle> = new Set(['nw', 'ne', 'se', 'sw']);

function isCornerHandle(handle: CropHandle): handle is 'nw' | 'ne' | 'se' | 'sw' {
  return CORNER_HANDLES.has(handle);
}

function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

interface DragState {
  pointerX: number;
  pointerY: number;
  rect: CropRect;
  handle: 'move' | CropHandle;
}

export function CropOverlay({ imageSize }: CropOverlayProps): React.JSX.Element | null {
  const rect = useCropStore((state) => state.rect);
  const aspectRatio = useCropStore((state) => state.aspectRatio);
  const startCrop = useCropStore((state) => state.startCrop);
  const setRect = useCropStore((state) => state.setRect);
  const zoom = useViewportStore((state) => state.zoom);
  const offsetX = useViewportStore((state) => state.offsetX);
  const offsetY = useViewportStore((state) => state.offsetY);
  const { commit, cancel } = useCropActions();

  const dragState = useRef<DragState | null>(null);

  useEffect(() => {
    startCrop(imageSize);
    // Depending on the primitive width/height (not the imageSize object,
    // which is a new reference every parent render) so this only re-runs
    // when the actual dimensions change, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSize.width, imageSize.height, startCrop]);

  // Abandon an in-progress crop if the tool changes away without a commit.
  useEffect(() => {
    return () => useCropStore.getState().reset();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (isEditableElement(event.target)) {
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        commit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        cancel();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commit, cancel]);

  if (!rect) {
    return null;
  }

  const devicePixelRatio = getDevicePixelRatio();
  const viewport = { zoom, offsetX, offsetY };
  const topLeft = imageToViewport({ x: rect.x, y: rect.y }, viewport, devicePixelRatio);
  const bottomRight = imageToViewport(
    { x: rect.x + rect.width, y: rect.y + rect.height },
    viewport,
    devicePixelRatio,
  );
  const rectStyle = {
    left: topLeft.x,
    top: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>, handle: DragState['handle']): void => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = { pointerX: event.clientX, pointerY: event.clientY, rect, handle };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = dragState.current;
    if (!drag) {
      return;
    }
    const scale = zoom / devicePixelRatio;
    const deltaX = (event.clientX - drag.pointerX) / scale;
    const deltaY = (event.clientY - drag.pointerY) / scale;

    if (drag.handle === 'move') {
      setRect(moveCropRect(drag.rect, deltaX, deltaY, imageSize));
      return;
    }

    const ratio = aspectRatioValue(aspectRatio, imageSize);
    if (ratio !== null && isCornerHandle(drag.handle)) {
      setRect(resizeCropRectWithRatio(drag.rect, drag.handle, deltaX, deltaY, imageSize, ratio));
    } else {
      setRect(resizeCropRect(drag.rect, drag.handle, deltaX, deltaY, imageSize));
    }
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    dragState.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const isRatioLocked = aspectRatio !== 'free';

  return (
    <div className="crop-overlay" aria-hidden="true">
      <div
        className="crop-overlay__rect"
        style={rectStyle}
        onPointerDown={(event) => beginDrag(event, 'move')}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
      >
        {HANDLES.filter((handle) => !isRatioLocked || isCornerHandle(handle)).map((handle) => (
          <div
            key={handle}
            className={`crop-overlay__handle crop-overlay__handle--${handle}`}
            onPointerDown={(event) => beginDrag(event, handle)}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
          />
        ))}
      </div>
    </div>
  );
}
