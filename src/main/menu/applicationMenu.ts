import { app, dialog, Menu } from 'electron';
import type { MenuItemConstructorOptions } from 'electron';

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

// The View menu deliberately omits the default zoom items (Cmd/Ctrl+= and
// Cmd/Ctrl+-): those accelerators are reserved for the image viewport zoom
// controls planned in a later phase, not Chromium page zoom.
export function buildApplicationMenu(): Menu {
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
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
