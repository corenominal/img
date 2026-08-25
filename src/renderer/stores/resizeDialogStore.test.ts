import { afterEach, describe, expect, it } from 'vitest';
import { useResizeDialogStore } from './resizeDialogStore';

describe('resizeDialogStore', () => {
  afterEach(() => {
    useResizeDialogStore.setState({ isOpen: false });
  });

  it('starts closed', () => {
    expect(useResizeDialogStore.getState().isOpen).toBe(false);
  });

  it('open sets isOpen to true', () => {
    useResizeDialogStore.getState().open();
    expect(useResizeDialogStore.getState().isOpen).toBe(true);
  });

  it('close sets isOpen to false', () => {
    useResizeDialogStore.getState().open();
    useResizeDialogStore.getState().close();
    expect(useResizeDialogStore.getState().isOpen).toBe(false);
  });
});
