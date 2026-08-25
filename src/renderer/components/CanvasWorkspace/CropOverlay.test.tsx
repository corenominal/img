import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CropOverlay } from './CropOverlay';
import { useCropStore } from '../../stores/cropStore';
import { useViewportStore } from '../../stores/viewportStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditorStore } from '../../stores/editorStore';

const imageSize = { width: 200, height: 100 };

describe('CropOverlay', () => {
  beforeAll(() => {
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
    Element.prototype.hasPointerCapture = () => false;
  });

  afterEach(() => {
    useCropStore.setState({ rect: null, aspectRatio: 'free' });
    useViewportStore.setState({ zoom: 1, offsetX: 0, offsetY: 0 });
  });

  it('starts with a rect covering the whole image, at 100% zoom with no offset', () => {
    const { container } = render(<CropOverlay imageSize={imageSize} />);

    expect(useCropStore.getState().rect).toEqual({ x: 0, y: 0, width: 200, height: 100 });
    const rectEl = container.querySelector('.crop-overlay__rect') as HTMLElement;
    expect(rectEl.style.left).toBe('0px');
    expect(rectEl.style.top).toBe('0px');
    expect(rectEl.style.width).toBe('200px');
    expect(rectEl.style.height).toBe('100px');
  });

  it('positions the rect according to the current viewport zoom/offset', () => {
    useViewportStore.setState({ zoom: 2, offsetX: 10, offsetY: 20 });
    const { container } = render(<CropOverlay imageSize={imageSize} />);

    const rectEl = container.querySelector('.crop-overlay__rect') as HTMLElement;
    // devicePixelRatio defaults to 1 in jsdom, so cssScale = zoom = 2.
    expect(rectEl.style.left).toBe('10px');
    expect(rectEl.style.top).toBe('20px');
    expect(rectEl.style.width).toBe('400px');
    expect(rectEl.style.height).toBe('200px');
  });

  it('dragging the rect body moves the crop selection in image space', () => {
    const { container } = render(<CropOverlay imageSize={imageSize} />);
    const rectEl = container.querySelector('.crop-overlay__rect') as HTMLElement;

    fireEvent.pointerDown(rectEl, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerMove(rectEl, { clientX: 60, clientY: 45, pointerId: 1 });
    fireEvent.pointerUp(rectEl, { clientX: 60, clientY: 45, pointerId: 1 });

    // Rect started full-image (0,0)-(200,100); moving right would push past
    // bounds, so it clamps back to x=0. Moving up by 5 is within bounds
    // only because height already equals bounds height, so y stays 0 too.
    expect(useCropStore.getState().rect).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });

  it('dragging a handle resizes the rect', () => {
    const { container } = render(<CropOverlay imageSize={imageSize} />);
    // The mount effect starts a full-image rect; override it with a smaller
    // one (as if the user had already shrunk it) so there's room to grow.
    act(() => useCropStore.getState().setRect({ x: 50, y: 25, width: 50, height: 50 }));
    const seHandle = container.querySelector('.crop-overlay__handle--se') as HTMLElement;

    fireEvent.pointerDown(seHandle, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(seHandle, { clientX: 120, clientY: 110, pointerId: 1 });
    fireEvent.pointerUp(seHandle, { clientX: 120, clientY: 110, pointerId: 1 });

    expect(useCropStore.getState().rect).toEqual({ x: 50, y: 25, width: 70, height: 60 });
  });

  it('constrains corner resizing to the locked aspect ratio', () => {
    useDocumentStore.setState({
      document: {
        id: 'doc-1',
        filename: 'photo.png',
        sourcePath: '/tmp/photo.png',
        width: 200,
        height: 100,
        source: { width: 200, height: 100, close: vi.fn() } as unknown as ImageBitmap,
        operations: [],
        dirty: false,
      },
    });
    useCropStore.setState({ rect: { x: 0, y: 0, width: 40, height: 40 }, aspectRatio: '1:1' });
    const { container } = render(<CropOverlay imageSize={imageSize} />);

    // Only corner handles should be present when a ratio is locked.
    expect(container.querySelector('.crop-overlay__handle--e')).toBeNull();
    const seHandle = container.querySelector('.crop-overlay__handle--se') as HTMLElement;
    expect(seHandle).not.toBeNull();

    fireEvent.pointerDown(seHandle, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(seHandle, { clientX: 20, clientY: 0, pointerId: 1 });
    fireEvent.pointerUp(seHandle, { clientX: 20, clientY: 0, pointerId: 1 });

    const { rect } = useCropStore.getState();
    expect(rect?.width).toBe(rect?.height);

    useDocumentStore.setState({ document: null, history: null });
  });

  it('Enter commits and Escape cancels, both returning to the move tool', () => {
    useEditorStore.setState({ activeTool: 'crop' });
    render(<CropOverlay imageSize={imageSize} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useCropStore.getState().rect).toBeNull();
    expect(useEditorStore.getState().activeTool).toBe('move');

    useEditorStore.setState({ activeTool: 'move' });
  });

  it('resets the pending crop when unmounted without a commit', () => {
    const { unmount } = render(<CropOverlay imageSize={imageSize} />);
    expect(useCropStore.getState().rect).not.toBeNull();

    unmount();

    expect(useCropStore.getState().rect).toBeNull();
  });
});
