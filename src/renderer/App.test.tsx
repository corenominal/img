import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    window.imageEditor = {
      getVersions: vi.fn(() => ({ chrome: '1', node: '1', electron: '1' })),
    };
  });

  it('renders the application shell', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Image Editor' })).toBeInTheDocument();
  });

  it('displays the electron version from the preload API', async () => {
    render(<App />);
    expect(await screen.findByText('Electron 1')).toBeInTheDocument();
  });
});
