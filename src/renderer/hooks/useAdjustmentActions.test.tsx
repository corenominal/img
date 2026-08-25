import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAdjustmentActions } from './useAdjustmentActions';
import { useAdjustmentStore } from '../stores/adjustmentStore';
import { useDocumentStore } from '../stores/documentStore';
import type { ImageDocument } from '../editor/document/documentTypes';

function fakeDocument(overrides: Partial<ImageDocument> = {}): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.png',
    sourcePath: '/tmp/photo.png',
    width: 200,
    height: 100,
    source: { width: 200, height: 100, close: vi.fn() } as unknown as ImageBitmap,
    operations: [],
    dirty: false,
    ...overrides,
  };
}

describe('useAdjustmentActions', () => {
  afterEach(() => {
    useAdjustmentStore.setState({ active: {} });
    useDocumentStore.setState({ document: null, history: null, openError: null });
  });

  it('commit pushes the value as one operation (from a zero committed total) and clears the active slot', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useAdjustmentStore.getState().setActive('brightness', 30);

    const { result } = renderHook(() => useAdjustmentActions());
    result.current.commit('brightness');

    expect(useDocumentStore.getState().document?.operations).toEqual([
      { type: 'brightness', value: 30 },
    ]);
    expect(useAdjustmentStore.getState().active).toEqual({});
  });

  it('commit pushes only the delta from the existing committed total, not the raw slider value', () => {
    useDocumentStore
      .getState()
      .setDocument(fakeDocument({ operations: [{ type: 'brightness', value: 20 }] }));
    useAdjustmentStore.getState().setActive('brightness', 50);

    const { result } = renderHook(() => useAdjustmentActions());
    result.current.commit('brightness');

    expect(useDocumentStore.getState().document?.operations).toEqual([
      { type: 'brightness', value: 20 },
      { type: 'brightness', value: 30 },
    ]);
  });

  it('commit does nothing when the kind was never actively edited', () => {
    useDocumentStore.getState().setDocument(fakeDocument());

    const { result } = renderHook(() => useAdjustmentActions());
    result.current.commit('contrast');

    expect(useDocumentStore.getState().document?.operations).toEqual([]);
  });

  it('commit is a no-op when the slider is released back at the already-committed total', () => {
    useDocumentStore
      .getState()
      .setDocument(fakeDocument({ operations: [{ type: 'contrast', value: 10 }] }));
    useAdjustmentStore.getState().setActive('contrast', 10);

    const { result } = renderHook(() => useAdjustmentActions());
    result.current.commit('contrast');

    expect(useDocumentStore.getState().document?.operations).toEqual([
      { type: 'contrast', value: 10 },
    ]);
  });

  it('leaves other adjustment kinds untouched when committing one', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useAdjustmentStore.getState().setActive('brightness', 30);
    useAdjustmentStore.getState().setActive('saturation', -10);

    const { result } = renderHook(() => useAdjustmentActions());
    result.current.commit('brightness');

    expect(useAdjustmentStore.getState().active).toEqual({ saturation: -10 });
  });

  it('reset pushes a nulling delta so the total returns to neutral, and clears the active slot', () => {
    useDocumentStore
      .getState()
      .setDocument(fakeDocument({ operations: [{ type: 'saturation', value: 60 }] }));
    useAdjustmentStore.getState().setActive('saturation', 60);

    const { result } = renderHook(() => useAdjustmentActions());
    result.current.reset('saturation');

    expect(useDocumentStore.getState().document?.operations).toEqual([
      { type: 'saturation', value: 60 },
      { type: 'saturation', value: -60 },
    ]);
    expect(useAdjustmentStore.getState().active).toEqual({});
  });

  it('reset does nothing to history when the committed total is already neutral', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useAdjustmentStore.getState().setActive('brightness', 40);

    const { result } = renderHook(() => useAdjustmentActions());
    result.current.reset('brightness');

    expect(useDocumentStore.getState().document?.operations).toEqual([]);
    expect(useAdjustmentStore.getState().active).toEqual({});
  });
});
