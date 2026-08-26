import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExportDialog } from './ExportDialog';
import { renderDocumentToBlob } from '../../editor/export/renderExport';
import { useDocumentStore } from '../../stores/documentStore';
import { useExportDialogStore } from '../../stores/exportDialogStore';
import type { ImageDocument } from '../../editor/document/documentTypes';

vi.mock('../../editor/export/renderExport', () => ({
  renderDocumentToBlob: vi.fn(),
}));

// jsdom's Blob has no arrayBuffer() (unlike real Chromium's), so the mock
// resolves to a minimal stand-in with just the method ExportDialog uses.
function fakeBlob(): Blob {
  return {
    arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
  } as unknown as Blob;
}

function fakeDocument(overrides: Partial<ImageDocument> = {}): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'holiday-photo.png',
    sourcePath: '/tmp/holiday-photo.png',
    width: 400,
    height: 200,
    source: { width: 400, height: 200, close: vi.fn() } as unknown as ImageBitmap,
    operations: [],
    dirty: false,
    ...overrides,
  };
}

describe('ExportDialog', () => {
  afterEach(() => {
    useExportDialogStore.setState({ isOpen: false });
    useDocumentStore.setState({ document: null, history: null, documentError: null });
    vi.mocked(renderDocumentToBlob).mockReset();
  });

  it('renders no form fields while closed', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    render(<ExportDialog />);

    expect(screen.queryByLabelText('Format')).not.toBeInTheDocument();
  });

  it('defaults to JPEG with a visible quality control and no transparency checkbox', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useExportDialogStore.getState().open();
    render(<ExportDialog />);

    expect(screen.getByLabelText('Format')).toHaveValue('jpeg');
    expect(screen.getByLabelText('Quality')).toHaveValue('90');
    expect(
      screen.queryByRole('checkbox', { name: 'Preserve transparency' }),
    ).not.toBeInTheDocument();
  });

  it('switching to PNG hides quality and shows a transparency checkbox, checked by default', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useExportDialogStore.getState().open();
    render(<ExportDialog />);

    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'png' } });

    expect(screen.queryByLabelText('Quality')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Preserve transparency' })).toBeChecked();
  });

  it('switching to WebP shows quality but no transparency checkbox', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useExportDialogStore.getState().open();
    render(<ExportDialog />);

    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'webp' } });

    expect(screen.getByLabelText('Quality')).toBeInTheDocument();
    expect(
      screen.queryByRole('checkbox', { name: 'Preserve transparency' }),
    ).not.toBeInTheDocument();
  });

  it('submitting renders and exports with the chosen options, using the filename without its extension', async () => {
    const document = fakeDocument();
    useDocumentStore.getState().setDocument(document);
    useExportDialogStore.getState().open();
    vi.mocked(renderDocumentToBlob).mockResolvedValue(fakeBlob());
    window.imageEditor.exportImage = vi
      .fn()
      .mockResolvedValue({ status: 'exported', filePath: '/tmp/out.jpg' });
    render(<ExportDialog />);

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    await waitFor(() => expect(useExportDialogStore.getState().isOpen).toBe(false));

    expect(renderDocumentToBlob).toHaveBeenCalledWith(document, {
      format: 'jpeg',
      quality: 0.9,
      preserveTransparency: true,
    });
    expect(window.imageEditor.exportImage).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'jpeg', suggestedFileName: 'holiday-photo' }),
    );
  });

  it('a cancelled native save dialog leaves the export dialog open with the chosen options intact', async () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useExportDialogStore.getState().open();
    vi.mocked(renderDocumentToBlob).mockResolvedValue(fakeBlob());
    window.imageEditor.exportImage = vi.fn().mockResolvedValue({ status: 'cancelled' });
    render(<ExportDialog />);

    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'png' } });
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    await waitFor(() => expect(window.imageEditor.exportImage).toHaveBeenCalled());

    expect(useExportDialogStore.getState().isOpen).toBe(true);
    expect(screen.getByLabelText('Format')).toHaveValue('png');
  });

  it('shows the error message inline and keeps the dialog open when export fails', async () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useExportDialogStore.getState().open();
    vi.mocked(renderDocumentToBlob).mockResolvedValue(fakeBlob());
    window.imageEditor.exportImage = vi
      .fn()
      .mockResolvedValue({ status: 'error', message: 'Disk is full.' });
    render(<ExportDialog />);

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Disk is full.');
    expect(useExportDialogStore.getState().isOpen).toBe(true);
  });

  it('Cancel closes the dialog without rendering or exporting anything', () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    useExportDialogStore.getState().open();
    render(<ExportDialog />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(useExportDialogStore.getState().isOpen).toBe(false);
    expect(renderDocumentToBlob).not.toHaveBeenCalled();
  });
});
