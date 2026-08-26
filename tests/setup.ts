import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import type {
  DiscardChangesChoice,
  ExportImageResult,
  OpenAtPathResult,
  OpenImageResult,
  OpenProjectResult,
  SaveProjectAtPathResult,
  SaveProjectResult,
} from '../src/shared/types/imageEditorApi';

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
    exportImage: vi.fn(async (): Promise<ExportImageResult> => ({ status: 'cancelled' })),
    saveProject: vi.fn(async (): Promise<SaveProjectResult> => ({ status: 'cancelled' })),
    saveProjectAtPath: vi.fn(async (): Promise<SaveProjectAtPathResult> => ({
      status: 'error',
      message: 'not mocked',
    })),
    openProject: vi.fn(async (): Promise<OpenProjectResult> => ({ status: 'cancelled' })),
    openAtPath: vi.fn(async (): Promise<OpenAtPathResult> => ({
      status: 'error',
      message: 'not mocked',
    })),
    getPathForFile: vi.fn((file: File) => file.name),
    confirmDiscardChanges: vi.fn(async (): Promise<DiscardChangesChoice> => 'cancel'),
    respondToWindowClose: vi.fn(),
    onOpenImageMenuRequested: vi.fn(() => () => {}),
    onExportImageMenuRequested: vi.fn(() => () => {}),
    onSaveProjectMenuRequested: vi.fn(() => () => {}),
    onSaveProjectAsMenuRequested: vi.fn(() => () => {}),
    onOpenProjectMenuRequested: vi.fn(() => () => {}),
    onFileOpenRequested: vi.fn(() => () => {}),
    onWindowCloseRequested: vi.fn(() => () => {}),
    onViewportActionRequested: vi.fn(() => () => {}),
    onImageActionRequested: vi.fn(() => () => {}),
    onHistoryActionRequested: vi.fn(() => () => {}),
    notifyEditorState: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
});
