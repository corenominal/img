import { afterEach, describe, expect, it } from 'vitest';
import { useExportDialogStore } from './exportDialogStore';

describe('exportDialogStore', () => {
  afterEach(() => {
    useExportDialogStore.setState({ isOpen: false });
  });

  it('starts closed', () => {
    expect(useExportDialogStore.getState().isOpen).toBe(false);
  });

  it('open sets isOpen to true', () => {
    useExportDialogStore.getState().open();
    expect(useExportDialogStore.getState().isOpen).toBe(true);
  });

  it('close sets isOpen to false', () => {
    useExportDialogStore.getState().open();
    useExportDialogStore.getState().close();
    expect(useExportDialogStore.getState().isOpen).toBe(false);
  });
});
