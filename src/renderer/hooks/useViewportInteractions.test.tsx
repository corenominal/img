import { useRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { useViewportInteractions } from './useViewportInteractions';
import { useViewportStore } from '../stores/viewportStore';
import type { ToolId } from '../stores/editorStore';

function Harness({ activeTool }: { activeTool: ToolId }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const { pointerHandlers } = useViewportInteractions({
    containerRef: ref,
    activeTool,
    devicePixelRatio: 1,
  });
  return <div ref={ref} data-testid="surface" {...pointerHandlers} />;
}

describe('useViewportInteractions', () => {
  beforeAll(() => {
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
    Element.prototype.hasPointerCapture = () => false;
  });

  afterEach(() => {
    useViewportStore.setState({ zoom: 1, offsetX: 0, offsetY: 0 });
  });

  it('zooms in on scroll-up and out on scroll-down', () => {
    render(<Harness activeTool="crop" />);
    const surface = screen.getByTestId('surface');

    fireEvent.wheel(surface, { deltaY: -100, clientX: 50, clientY: 50 });
    expect(useViewportStore.getState().zoom).toBeGreaterThan(1);

    useViewportStore.setState({ zoom: 1, offsetX: 0, offsetY: 0 });
    fireEvent.wheel(surface, { deltaY: 100, clientX: 50, clientY: 50 });
    expect(useViewportStore.getState().zoom).toBeLessThan(1);
  });

  it('pans on left-drag when the move tool is active', () => {
    render(<Harness activeTool="move" />);
    const surface = screen.getByTestId('surface');

    fireEvent.pointerDown(surface, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(surface, { clientX: 130, clientY: 80, pointerId: 1 });
    fireEvent.pointerUp(surface, { clientX: 130, clientY: 80, pointerId: 1 });

    expect(useViewportStore.getState().offsetX).toBe(30);
    expect(useViewportStore.getState().offsetY).toBe(-20);
  });

  it('does not pan on left-drag when the crop tool is active', () => {
    render(<Harness activeTool="crop" />);
    const surface = screen.getByTestId('surface');

    fireEvent.pointerDown(surface, { button: 0, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(surface, { clientX: 130, clientY: 80, pointerId: 1 });
    fireEvent.pointerUp(surface, { clientX: 130, clientY: 80, pointerId: 1 });

    expect(useViewportStore.getState().offsetX).toBe(0);
    expect(useViewportStore.getState().offsetY).toBe(0);
  });

  it('pans on middle-mouse drag regardless of the active tool', () => {
    render(<Harness activeTool="crop" />);
    const surface = screen.getByTestId('surface');

    fireEvent.pointerDown(surface, { button: 1, clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(surface, { clientX: 90, clientY: 105, pointerId: 1 });
    fireEvent.pointerUp(surface, { clientX: 90, clientY: 105, pointerId: 1 });

    expect(useViewportStore.getState().offsetX).toBe(-10);
    expect(useViewportStore.getState().offsetY).toBe(5);
  });
});
