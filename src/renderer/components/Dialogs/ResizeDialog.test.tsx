import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResizeDialog } from './ResizeDialog';
import { useDocumentStore } from '../../stores/documentStore';
import { useResizeDialogStore } from '../../stores/resizeDialogStore';
import type { ImageDocument } from '../../editor/document/documentTypes';

function fakeDocument(overrides: Partial<ImageDocument> = {}): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.png',
    sourcePath: '/tmp/photo.png',
    width: 400,
    height: 200,
    source: { width: 400, height: 200, close: vi.fn() } as unknown as ImageBitmap,
    operations: [],
    dirty: false,
    ...overrides,
  };
}

describe('ResizeDialog', () => {
  afterEach(() => {
    useResizeDialogStore.setState({ isOpen: false });
    useDocumentStore.setState({ document: null, history: null, documentError: null });
  });

  it('renders no form fields while closed', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    render(<ResizeDialog />);

    expect(screen.queryByLabelText('Width')).not.toBeInTheDocument();
  });

  it('prefills the current dimensions and defaults to a locked aspect ratio when opened', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useResizeDialogStore.getState().open();
    render(<ResizeDialog />);

    expect(screen.getByLabelText('Width')).toHaveValue(400);
    expect(screen.getByLabelText('Height')).toHaveValue(200);
    expect(screen.getByRole('checkbox', { name: 'Lock aspect ratio' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Resize' })).toBeDisabled();
  });

  it('changing width updates height proportionally while locked', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useResizeDialogStore.getState().open();
    render(<ResizeDialog />);

    fireEvent.change(screen.getByLabelText('Width'), { target: { value: '200' } });

    expect(screen.getByLabelText('Height')).toHaveValue(100);
  });

  it('changing width does not touch height once unlocked', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useResizeDialogStore.getState().open();
    render(<ResizeDialog />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Lock aspect ratio' }));
    fireEvent.change(screen.getByLabelText('Width'), { target: { value: '250' } });

    expect(screen.getByLabelText('Height')).toHaveValue(200);
  });

  it('rejects an invalid dimension: the Resize button is disabled and an error is shown', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useResizeDialogStore.getState().open();
    render(<ResizeDialog />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Lock aspect ratio' }));
    fireEvent.change(screen.getByLabelText('Width'), { target: { value: '0' } });

    expect(screen.getByRole('button', { name: 'Resize' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('at least 1 pixel');
  });

  it('submitting valid new dimensions applies a resize operation and closes the dialog', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useResizeDialogStore.getState().open();
    render(<ResizeDialog />);

    fireEvent.change(screen.getByLabelText('Width'), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resize' }));

    expect(useDocumentStore.getState().document?.operations).toEqual([
      { type: 'resize', width: 200, height: 100, resampling: 'smooth' },
    ]);
    expect(useResizeDialogStore.getState().isOpen).toBe(false);
  });

  it('Cancel closes the dialog without applying any operation', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useResizeDialogStore.getState().open();
    render(<ResizeDialog />);

    fireEvent.change(screen.getByLabelText('Width'), { target: { value: '200' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useDocumentStore.getState().document?.operations).toEqual([]);
    expect(useResizeDialogStore.getState().isOpen).toBe(false);
  });

  it('the pixelated resampling option is applied on submit', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useResizeDialogStore.getState().open();
    render(<ResizeDialog />);

    fireEvent.change(screen.getByLabelText('Width'), { target: { value: '200' } });
    fireEvent.change(screen.getByLabelText('Resampling'), { target: { value: 'pixelated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resize' }));

    expect(useDocumentStore.getState().document?.operations).toEqual([
      { type: 'resize', width: 200, height: 100, resampling: 'pixelated' },
    ]);
  });
});
