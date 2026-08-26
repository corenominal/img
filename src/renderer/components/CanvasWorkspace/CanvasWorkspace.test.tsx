import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CanvasWorkspace } from './CanvasWorkspace';
import { useDocumentStore } from '../../stores/documentStore';

describe('CanvasWorkspace', () => {
  afterEach(() => {
    useDocumentStore.setState({ document: null, documentError: null });
  });

  it('shows the empty state and requests an image when clicked', async () => {
    const user = userEvent.setup();
    render(<CanvasWorkspace />);

    expect(screen.getByText('No image open')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open Image' }));

    expect(window.imageEditor.openImage).toHaveBeenCalledOnce();
  });

  it('shows a dismissible error banner when opening fails', async () => {
    useDocumentStore.setState({ documentError: 'The image could not be opened.' });
    const user = userEvent.setup();
    render(<CanvasWorkspace />);

    expect(screen.getByRole('alert')).toHaveTextContent('The image could not be opened.');

    await user.click(screen.getByRole('button', { name: 'Dismiss error' }));

    expect(useDocumentStore.getState().documentError).toBeNull();
  });

  it('renders the image canvas when a document is open', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    useDocumentStore.setState({
      document: {
        id: 'doc-1',
        filename: 'photo.png',
        sourcePath: '/tmp/photo.png',
        width: 100,
        height: 50,
        source: { width: 100, height: 50, close: vi.fn() } as unknown as ImageBitmap,
        operations: [],
        dirty: false,
      },
    });

    render(<CanvasWorkspace />);

    expect(screen.queryByText('No image open')).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
