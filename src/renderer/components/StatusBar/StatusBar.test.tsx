import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { StatusBar } from './StatusBar';
import { usePreferenceStore } from '../../stores/preferenceStore';
import { useDocumentStore } from '../../stores/documentStore';

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
    useDocumentStore.setState({ document: { width: 4000, height: 3000 } });
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
