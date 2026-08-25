import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import type { OpenImageResult } from '../src/shared/types/imageEditorApi';

// jsdom does not implement ResizeObserver.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

// jsdom does not implement PointerEvent either, so fireEvent.pointerDown/etc
// would otherwise drop button/clientX/clientY/pointerId entirely.
if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    public pointerId?: number;
    public pointerType?: string;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId;
      this.pointerType = params.pointerType;
    }
  }
  globalThis.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

beforeEach(() => {
  window.imageEditor = {
    getVersions: vi.fn(() => ({ chrome: '0', node: '0', electron: '0' })),
    openImage: vi.fn(async (): Promise<OpenImageResult> => ({ status: 'cancelled' })),
    onOpenImageMenuRequested: vi.fn(() => () => {}),
    onViewportActionRequested: vi.fn(() => () => {}),
    onImageActionRequested: vi.fn(() => () => {}),
    onHistoryActionRequested: vi.fn(() => () => {}),
    notifyEditorState: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
});
