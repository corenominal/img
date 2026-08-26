import { app, BrowserWindow, dialog, Menu } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc/channels';
import type {
  HistoryMenuAction,
  ImageMenuAction,
  ViewportMenuAction,
} from '../../shared/types/imageEditorApi';

const isMac = process.platform === 'darwin';

function showAboutDialog(): void {
  void dialog.showMessageBox({
    type: 'info',
    title: 'About Image Editor',
    message: 'Image Editor',
    detail: [
      `Version ${app.getVersion()}`,
      `Electron ${process.versions.electron}`,
      `Chromium ${process.versions.chrome}`,
      `Node ${process.versions.node}`,
    ].join('\n'),
  });
}

function sendToWindow(window: unknown, channel: string, ...args: unknown[]): void {
  if (window instanceof BrowserWindow) {
    window.webContents.send(channel, ...args);
  }
}

const sendViewportAction = (window: unknown, action: ViewportMenuAction): void =>
  sendToWindow(window, IPC_CHANNELS.menuViewportAction, action);

const sendImageAction = (window: unknown, action: ImageMenuAction): void =>
  sendToWindow(window, IPC_CHANNELS.menuImageAction, action);

const sendHistoryAction = (window: unknown, action: HistoryMenuAction): void =>
  sendToWindow(window, IPC_CHANNELS.menuHistoryAction, action);

// Menu items whose enabled state is kept in sync with renderer document/
// history state (see editorMenuState.ts) start disabled: nothing is open or
// undoable/redoable until the renderer reports otherwise.
export function buildApplicationMenu(): Menu {
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Image…',
          accelerator: 'CmdOrCtrl+O',
          click: (_item, window) => sendToWindow(window, IPC_CHANNELS.menuOpenImageRequested),
        },
        {
          label: 'Open Project…',
          click: (_item, window) => sendToWindow(window, IPC_CHANNELS.menuOpenProjectRequested),
        },
        { type: 'separator' },
        {
          id: 'save-project',
          label: 'Save Project…',
          accelerator: 'CmdOrCtrl+S',
          enabled: false,
          click: (_item, window) => sendToWindow(window, IPC_CHANNELS.menuSaveProjectRequested),
        },
        { type: 'separator' },
        {
          id: 'export',
          label: 'Export…',
          accelerator: 'CmdOrCtrl+E',
          enabled: false,
          click: (_item, window) => sendToWindow(window, IPC_CHANNELS.menuExportImageRequested),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          id: 'undo',
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          enabled: false,
          click: (_item, window) => sendHistoryAction(window, 'undo'),
        },
        {
          id: 'redo',
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Shift+Z',
          enabled: false,
          click: (_item, window) => sendHistoryAction(window, 'redo'),
        },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'Image',
      submenu: [
        {
          id: 'rotate-left',
          label: 'Rotate Left',
          accelerator: '[',
          enabled: false,
          click: (_item, window) => sendImageAction(window, 'rotate-left'),
        },
        {
          id: 'rotate-right',
          label: 'Rotate Right',
          accelerator: ']',
          enabled: false,
          click: (_item, window) => sendImageAction(window, 'rotate-right'),
        },
        { type: 'separator' },
        {
          id: 'flip-horizontal',
          label: 'Flip Horizontal',
          enabled: false,
          click: (_item, window) => sendImageAction(window, 'flip-horizontal'),
        },
        {
          id: 'flip-vertical',
          label: 'Flip Vertical',
          enabled: false,
          click: (_item, window) => sendImageAction(window, 'flip-vertical'),
        },
        { type: 'separator' },
        {
          id: 'resize',
          label: 'Resize…',
          enabled: false,
          click: (_item, window) => sendImageAction(window, 'resize'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: (_item, window) => sendViewportAction(window, 'zoom-in'),
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: (_item, window) => sendViewportAction(window, 'zoom-out'),
        },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+1',
          click: (_item, window) => sendViewportAction(window, 'actual-size'),
        },
        {
          label: 'Fit to Window',
          accelerator: 'CmdOrCtrl+0',
          click: (_item, window) => sendViewportAction(window, 'fit-to-window'),
        },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [{ label: 'About Image Editor', click: showAboutDialog }],
    },
  ];

  return Menu.buildFromTemplate(template);
}
