import { Menu } from 'electron';
import type { EditorMenuState } from '../../shared/types/imageEditorApi';

export function isEditorMenuState(value: unknown): value is EditorMenuState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.hasDocument === 'boolean' &&
    (candidate.undoLabel === null || typeof candidate.undoLabel === 'string') &&
    (candidate.redoLabel === null || typeof candidate.redoLabel === 'string')
  );
}

export function updateEditorMenuState(state: EditorMenuState): void {
  const menu = Menu.getApplicationMenu();
  if (!menu) {
    return;
  }

  const undoItem = menu.getMenuItemById('undo');
  if (undoItem) {
    undoItem.enabled = state.undoLabel !== null;
    undoItem.label = state.undoLabel ? `Undo ${state.undoLabel}` : 'Undo';
  }

  const redoItem = menu.getMenuItemById('redo');
  if (redoItem) {
    redoItem.enabled = state.redoLabel !== null;
    redoItem.label = state.redoLabel ? `Redo ${state.redoLabel}` : 'Redo';
  }

  for (const id of [
    'rotate-left',
    'rotate-right',
    'flip-horizontal',
    'flip-vertical',
    'resize',
    'export',
    'save-project',
  ] as const) {
    const item = menu.getMenuItemById(id);
    if (item) {
      item.enabled = state.hasDocument;
    }
  }

  // Electron does not always redraw an already-installed native menu when
  // an item's label/enabled state changes; re-installing the same menu
  // object forces the OS-level menu to pick up the changes.
  Menu.setApplicationMenu(menu);
}
