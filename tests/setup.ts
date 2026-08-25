import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import type { OpenImageResult } from '../src/shared/types/imageEditorApi';

beforeEach(() => {
  window.imageEditor = {
    getVersions: vi.fn(() => ({ chrome: '0', node: '0', electron: '0' })),
    openImage: vi.fn(async (): Promise<OpenImageResult> => ({ status: 'cancelled' })),
    onOpenImageMenuRequested: vi.fn(() => () => {}),
  };
});

afterEach(() => {
  cleanup();
});
