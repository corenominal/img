import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { IPC_CHANNELS } from '../shared/ipc/channels';
import { registerIpcHandlers } from './ipc/registerHandlers';
import { initializeMenu } from './menu/menuController';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Launching via a file association (double-click, "Open With") passes the
// file path as a CLI argument on Windows/Linux; macOS uses the 'open-file'
// event instead (handled below).
const OPENABLE_FILE_PATTERN = /\.(imgedit|png|jpe?g|webp)$/i;

function extractFilePathArg(argv: string[]): string | null {
  return argv.find((arg) => OPENABLE_FILE_PATTERN.test(arg)) ?? null;
}

let mainWindow: BrowserWindow | null = null;
let pendingOpenPath: string | null = extractFilePathArg(process.argv);

function openPathInMainWindow(filePath: string): void {
  if (mainWindow && !mainWindow.webContents.isLoading()) {
    mainWindow.webContents.send(IPC_CHANNELS.fileOpenRequested, filePath);
  } else {
    // No window yet, or it hasn't finished its initial load: queued and
    // flushed by the 'did-finish-load' handler in createMainWindow.
    pendingOpenPath = filePath;
  }
}

// Must be registered before 'ready': macOS can fire this before the app
// finishes starting up (e.g. the app wasn't already running).
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  openPathInMainWindow(filePath);
});

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  // Another instance is already running and will handle this launch (see
  // 'second-instance' below) — this is a single-document-window app, so a
  // second process would just be a redundant, confusing extra window.
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    if (!mainWindow) {
      return;
    }
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
    const filePath = extractFilePathArg(argv);
    if (filePath) {
      openPathInMainWindow(filePath);
    }
  });

  const createMainWindow = (): BrowserWindow => {
    const window = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    // Unsaved-changes-on-close guard: intercept the close, ask the
    // renderer (which owns the document's dirty state) whether it's safe
    // to proceed, and only actually close once it says yes. `allowClose`
    // is scoped to this window so a later window (e.g. after 'activate'
    // recreates one on macOS) starts with its own fresh guard.
    let allowClose = false;
    window.on('close', (event) => {
      if (allowClose) {
        return;
      }
      event.preventDefault();
      window.webContents.send(IPC_CHANNELS.windowCloseRequested);
      ipcMain.once(IPC_CHANNELS.windowCloseResponse, (_event, canClose: unknown) => {
        if (canClose === true) {
          allowClose = true;
          window.close();
        }
      });
    });

    window.webContents.once('did-finish-load', () => {
      if (pendingOpenPath) {
        window.webContents.send(IPC_CHANNELS.fileOpenRequested, pendingOpenPath);
        pendingOpenPath = null;
      }
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      window.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    return window;
  };

  app.on('ready', () => {
    registerIpcHandlers();
    void initializeMenu();
    mainWindow = createMainWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
}
