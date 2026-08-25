import { Menu } from 'electron';
import type { EditorMenuState } from '../../shared/types/imageEditorApi';

const MENU_ITEM_IDS = ['undo', 'redo', 'rotate-left', 'rotate-right', 'flip-horizontal', 'flip-vertical'] as const;

export function isEditorMenuState(value: unknown): value is EditorMenuState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.hasDocument === 'boolean' &&
    typeof candidate.canUndo === 'boolean' &&
    typeof candidate.canRedo === 'boolean'
  );
}

export function updateEditorMenuState(state: EditorMenuState): void {
  const menu = Menu.getApplicationMenu();
  if (!menu) {
    return;
  }

  const enabledById: Record<(typeof MENU_ITEM_IDS)[number], boolean> = {
    undo: state.canUndo,
    redo: state.canRedo,
    'rotate-left': state.hasDocument,
    'rotate-right': state.hasDocument,
    'flip-horizontal': state.hasDocument,
    'flip-vertical': state.hasDocument,
  };

  for (const id of MENU_ITEM_IDS) {
    const item = menu.getMenuItemById(id);
    if (item) {
      item.enabled = enabledById[id];
    }
  }
}
