import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { useViewportStore } from '../stores/viewportStore';
import type { ToolId } from '../stores/editorStore';
import type { Point } from '../editor/viewport/viewportTypes';
import { isEditableElement } from '../utils/dom';

const WHEEL_ZOOM_SENSITIVITY = 0.0015;

function useSpaceHeld(): boolean {
  const [spaceHeld, setSpaceHeld] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.code === 'Space' && !isEditableElement(event.target)) {
        setSpaceHeld(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent): void => {
      if (event.code === 'Space') {
        setSpaceHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return spaceHeld;
}

function pointerPositionInContainer(event: { clientX: number; clientY: number }, container: Element): Point {
  const rect = container.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

interface UseViewportInteractionsOptions {
  containerRef: RefObject<HTMLElement | null>;
  activeTool: ToolId;
  devicePixelRatio: number;
}

interface ViewportPointerHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
}

interface UseViewportInteractionsResult {
  isPanning: boolean;
  canPan: boolean;
  pointerHandlers: ViewportPointerHandlers;
}

export function useViewportInteractions({
  containerRef,
  activeTool,
  devicePixelRatio,
}: UseViewportInteractionsOptions): UseViewportInteractionsResult {
  const zoomBy = useViewportStore((state) => state.zoomBy);
  const panBy = useViewportStore((state) => state.panBy);
  const spaceHeld = useSpaceHeld();
  const [isPanning, setIsPanning] = useState(false);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const canPan = spaceHeld || activeTool === 'move';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleWheel = (event: WheelEvent): void => {
      event.preventDefault();
      const anchor = pointerPositionInContainer(event, container);
      const factor = Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY);
      zoomBy(factor, anchor, devicePixelRatio);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [containerRef, zoomBy, devicePixelRatio]);

  const pointerHandlers: ViewportPointerHandlers = {
    onPointerDown: (event) => {
      const shouldPan = event.button === 1 || (event.button === 0 && canPan);
      if (!shouldPan) {
        return;
      }
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragStart.current = { x: event.clientX, y: event.clientY };
      setIsPanning(true);
    },
    onPointerMove: (event) => {
      if (!dragStart.current) {
        return;
      }
      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;
      dragStart.current = { x: event.clientX, y: event.clientY };
      panBy(dx, dy);
    },
    onPointerUp: (event) => {
      if (!dragStart.current) {
        return;
      }
      dragStart.current = null;
      setIsPanning(false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
  };

  return { isPanning, canPan, pointerHandlers };
}
