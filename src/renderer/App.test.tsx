import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the application shell regions', () => {
    render(<App />);
    expect(screen.getByRole('navigation', { name: 'Tools' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Adjustments' })).toBeInTheDocument();
    expect(screen.getByText('No image open')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Image' })).toBeInTheDocument();
  });
});
