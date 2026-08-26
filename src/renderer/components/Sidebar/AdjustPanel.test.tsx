import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdjustPanel } from './AdjustPanel';
import { useAdjustmentStore } from '../../stores/adjustmentStore';
import { useDocumentStore } from '../../stores/documentStore';
import type { ImageDocument } from '../../editor/document/documentTypes';

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

describe('AdjustPanel', () => {
  afterEach(() => {
    useAdjustmentStore.setState({ active: {} });
    useDocumentStore.setState({ document: null, history: null, documentError: null });
  });

  it('starts every control at a neutral value with reset disabled', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    render(<AdjustPanel />);

    expect(screen.getByRole('slider', { name: 'Brightness' })).toHaveValue('0');
    expect(screen.getByRole('button', { name: 'Reset Brightness' })).toBeDisabled();
  });

  it('reflects an already-committed total on mount, not zero', () => {
    useDocumentStore
      .getState()
      .setDocument(fakeDocument({ operations: [{ type: 'contrast', value: 25 }] }));
    render(<AdjustPanel />);

    expect(screen.getByRole('slider', { name: 'Contrast' })).toHaveValue('25');
    expect(screen.getByRole('button', { name: 'Reset Contrast' })).toBeEnabled();
  });

  it('dragging the slider previews live without touching document history', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    render(<AdjustPanel />);

    fireEvent.change(screen.getByRole('slider', { name: 'Contrast' }), { target: { value: '25' } });

    expect(useAdjustmentStore.getState().active.contrast).toBe(25);
    expect(useDocumentStore.getState().document?.operations).toEqual([]);
    expect(screen.getByRole('button', { name: 'Reset Contrast' })).toBeEnabled();
  });

  it('releasing the slider commits a single operation and the control holds its position', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    render(<AdjustPanel />);

    const slider = screen.getByRole('slider', { name: 'Saturation' });
    fireEvent.change(slider, { target: { value: '-30' } });
    fireEvent.pointerUp(slider);

    expect(useDocumentStore.getState().document?.operations).toEqual([
      { type: 'saturation', value: -30 },
    ]);
    expect(useAdjustmentStore.getState().active).toEqual({});
    expect(screen.getByRole('slider', { name: 'Saturation' })).toHaveValue('-30');
  });

  it('dragging further from an already-committed value only commits the additional delta', () => {
    useDocumentStore
      .getState()
      .setDocument(fakeDocument({ operations: [{ type: 'brightness', value: 20 }] }));
    render(<AdjustPanel />);

    const slider = screen.getByRole('slider', { name: 'Brightness' });
    fireEvent.change(slider, { target: { value: '35' } });
    fireEvent.pointerUp(slider);

    expect(useDocumentStore.getState().document?.operations).toEqual([
      { type: 'brightness', value: 20 },
      { type: 'brightness', value: 15 },
    ]);
    expect(screen.getByRole('slider', { name: 'Brightness' })).toHaveValue('35');
  });

  it('the reset button zeroes an already-committed adjustment', () => {
    useDocumentStore
      .getState()
      .setDocument(fakeDocument({ operations: [{ type: 'brightness', value: 40 }] }));
    render(<AdjustPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset Brightness' }));

    expect(useDocumentStore.getState().document?.operations).toEqual([
      { type: 'brightness', value: 40 },
      { type: 'brightness', value: -40 },
    ]);
    expect(screen.getByRole('slider', { name: 'Brightness' })).toHaveValue('0');
  });

  it('the reset button discards a pending, uncommitted drag without creating a history entry', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    render(<AdjustPanel />);

    const slider = screen.getByRole('slider', { name: 'Brightness' });
    fireEvent.change(slider, { target: { value: '40' } });

    fireEvent.click(screen.getByRole('button', { name: 'Reset Brightness' }));

    expect(useAdjustmentStore.getState().active).toEqual({});
    expect(useDocumentStore.getState().document?.operations).toEqual([]);
  });
});
