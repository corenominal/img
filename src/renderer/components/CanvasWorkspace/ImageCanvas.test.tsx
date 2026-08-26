import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ImageCanvas } from './ImageCanvas';
import * as flattenOperationsModule from '../../editor/rendering/flattenOperations';
import type { ImageDocument } from '../../editor/document/documentTypes';
import { useAdjustmentStore } from '../../stores/adjustmentStore';
import { useEditorStore } from '../../stores/editorStore';
import { useViewportStore } from '../../stores/viewportStore';

// A stub that synchronously reports a non-zero size, so ImageCanvas's
// containerSize-gated effects (fit-to-container, the render effect) don't
// bail out the way they would under tests/setup.ts's inert default stub.
class ImmediateResizeObserver {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(): void {
    const entry = {
      contentBoxSize: [{ inlineSize: 200, blockSize: 100 }],
    } as unknown as ResizeObserverEntry;
    this.callback([entry], this as unknown as ResizeObserver);
  }

  unobserve(): void {}
  disconnect(): void {}
}

function fakeContext(width: number, height: number): CanvasRenderingContext2D {
  return {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
    })),
    putImageData: vi.fn(),
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    filter: 'none',
    imageSmoothingEnabled: true,
  } as unknown as CanvasRenderingContext2D;
}

function fakeDocument(overrides: Partial<ImageDocument> = {}): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.png',
    sourcePath: '/tmp/photo.png',
    width: 4,
    height: 3,
    source: { width: 4, height: 3, close: vi.fn() } as unknown as ImageBitmap,
    operations: [],
    dirty: false,
    ...overrides,
  };
}

describe('ImageCanvas live-preview caching (plan.md §13)', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ImmediateResizeObserver);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
      this: HTMLCanvasElement,
    ) {
      return fakeContext(this.width || 1, this.height || 1);
    });
  });

  afterEach(() => {
    // Unmount while the getContext mock is still installed: tests/setup.ts's
    // global `afterEach(() => cleanup())` runs after this file-local hook
    // (outer hooks fire after inner ones), so restoring mocks first would
    // leave the real jsdom canvas (which has no getContext support) to
    // handle whatever the unmount flush touches.
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    useAdjustmentStore.setState({ active: {} });
    useEditorStore.setState({ activeTool: 'move' });
    useViewportStore.setState({ zoom: 1, offsetX: 0, offsetY: 0 });
  });

  it('re-flattens the committed operation stack from source only once, no matter how many slider ticks follow', () => {
    const flattenSpy = vi.spyOn(flattenOperationsModule, 'flattenOperations');
    const document = fakeDocument({ operations: [{ type: 'exposure', value: 20 }] });

    render(<ImageCanvas document={document} />);

    act(() => {
      useAdjustmentStore.getState().setActive('exposure', 30);
    });
    act(() => {
      useAdjustmentStore.getState().setActive('exposure', 45);
    });
    act(() => {
      useAdjustmentStore.getState().setActive('exposure', 60);
    });

    // The committed stack ([exposure: 20]) is only ever folded from the
    // document's original source bitmap once, on mount — every subsequent
    // slider tick reuses that cached canvas as the *input* to a fresh
    // flattenOperations call rather than replaying the committed stack
    // again. Without the cache, this would grow by one call per tick.
    const callsFromOriginalSource = flattenSpy.mock.calls.filter(
      (call) => call[0] === document.source,
    );
    expect(callsFromOriginalSource).toHaveLength(1);
    expect(callsFromOriginalSource[0]?.[1]).toEqual([{ type: 'exposure', value: 20 }]);

    // Each tick still produces its own small preview-delta flatten, layered
    // on top of the cached committed canvas (not the original source).
    const callsFromCachedCanvas = flattenSpy.mock.calls.filter(
      (call) => call[0] !== document.source,
    );
    expect(callsFromCachedCanvas.length).toBeGreaterThanOrEqual(4);
    for (const call of callsFromCachedCanvas) {
      expect(call[1].length).toBeLessThanOrEqual(1);
    }
  });

  it('does not re-flatten the committed stack when an unrelated adjustment kind is dragged', () => {
    const flattenSpy = vi.spyOn(flattenOperationsModule, 'flattenOperations');
    const document = fakeDocument({
      operations: [
        { type: 'exposure', value: 20 },
        { type: 'temperature', value: -10 },
      ],
    });

    render(<ImageCanvas document={document} />);
    flattenSpy.mockClear();

    act(() => {
      useAdjustmentStore.getState().setActive('temperature', -25);
    });

    const callsFromOriginalSource = flattenSpy.mock.calls.filter(
      (call) => call[0] === document.source,
    );
    expect(callsFromOriginalSource).toHaveLength(0);
  });
});
