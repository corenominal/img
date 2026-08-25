import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StatusBar } from './StatusBar';
import { usePreferenceStore } from '../../stores/preferenceStore';
import { useDocumentStore } from '../../stores/documentStore';
import type { ImageDocument } from '../../editor/document/documentTypes';

function fakeDocument(width: number, height: number): ImageDocument {
  return {
    id: 'doc-1',
    filename: 'photo.png',
    sourcePath: '/tmp/photo.png',
    width,
    height,
    source: { width, height, close: vi.fn() } as unknown as ImageBitmap,
    operations: [],
    dirty: false,
  };
}

describe('StatusBar', () => {
  afterEach(() => {
    usePreferenceStore.setState({ theme: 'system' });
    useDocumentStore.setState({ document: null });
  });

  it('shows a placeholder when no document is open', () => {
    render(<StatusBar />);
    expect(screen.getByText('No document open')).toBeInTheDocument();
  });

  it('shows document dimensions when a document is open', () => {
    useDocumentStore.setState({ document: fakeDocument(4000, 3000) });
    render(<StatusBar />);
    expect(screen.getByText('4000 × 3000')).toBeInTheDocument();
  });

  it('updates the theme preference from the select control', async () => {
    const user = userEvent.setup();
    render(<StatusBar />);

    await user.selectOptions(screen.getByLabelText('Theme'), 'dark');

    expect(usePreferenceStore.getState().theme).toBe('dark');
  });
});
