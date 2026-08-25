import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { ToolStrip } from './ToolStrip';
import { useEditorStore } from '../../stores/editorStore';

describe('ToolStrip', () => {
  afterEach(() => {
    useEditorStore.setState({ activeTool: 'move' });
  });

  it('defaults to the move tool being active', () => {
    render(<ToolStrip />);
    expect(screen.getByRole('button', { name: 'Move' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Crop' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches the active tool when clicked', async () => {
    const user = userEvent.setup();
    render(<ToolStrip />);

    await user.click(screen.getByRole('button', { name: 'Crop' }));

    expect(useEditorStore.getState().activeTool).toBe('crop');
    expect(screen.getByRole('button', { name: 'Crop' })).toHaveAttribute('aria-pressed', 'true');
  });
});
