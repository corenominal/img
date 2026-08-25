import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ToolStrip } from './ToolStrip';
import { useEditorStore } from '../../stores/editorStore';
import { useDocumentStore } from '../../stores/documentStore';
import type { ImageDocument } from '../../editor/document/documentTypes';

function fakeDocument(): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.png',
    sourcePath: '/tmp/photo.png',
    width: 100,
    height: 100,
    source: { width: 100, height: 100, close: vi.fn() } as unknown as ImageBitmap,
    operations: [],
    dirty: false,
  };
}

describe('ToolStrip', () => {
  afterEach(() => {
    useEditorStore.setState({ activeTool: 'move' });
    useDocumentStore.setState({ document: null, history: null });
  });

  it('defaults to the move tool being active', () => {
    render(<ToolStrip />);
    expect(screen.getByRole('button', { name: 'Move' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Crop' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('disables the crop tool until a document is open', () => {
    render(<ToolStrip />);
    expect(screen.getByRole('button', { name: 'Crop' })).toBeDisabled();
  });

  it('switches the active tool when clicked, once a document is open', async () => {
    useDocumentStore.getState().setDocument(fakeDocument());
    const user = userEvent.setup();
    render(<ToolStrip />);

    await user.click(screen.getByRole('button', { name: 'Crop' }));

    expect(useEditorStore.getState().activeTool).toBe('crop');
    expect(screen.getByRole('button', { name: 'Crop' })).toHaveAttribute('aria-pressed', 'true');
  });
});
