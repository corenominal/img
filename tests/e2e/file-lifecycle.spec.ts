import path from 'node:path';
import os from 'node:os';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { _electron as electron, expect, test } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';

const projectRoot = path.resolve(__dirname, '../..');
const fixturesDir = path.join(__dirname, 'fixtures');

async function stubOpenDialog(app: ElectronApplication, filePath: string): Promise<void> {
  await app.evaluate(({ dialog }, targetPath) => {
    dialog.showOpenDialog = (async () => ({
      canceled: false,
      filePaths: [targetPath],
    })) as typeof dialog.showOpenDialog;
  }, filePath);
}

async function stubSaveDialog(app: ElectronApplication, filePath: string): Promise<void> {
  await app.evaluate(({ dialog }, targetPath) => {
    dialog.showSaveDialog = (async () => ({
      canceled: false,
      filePath: targetPath,
    })) as typeof dialog.showSaveDialog;
  }, filePath);
}

async function stubSaveDialogToFail(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ dialog }) => {
    dialog.showSaveDialog = (() => {
      throw new Error('Save should not have opened the save dialog');
    }) as unknown as typeof dialog.showSaveDialog;
  });
}

async function stubMessageBoxResponse(app: ElectronApplication, response: number): Promise<void> {
  await app.evaluate(({ dialog }, buttonIndex) => {
    dialog.showMessageBox = (async () => ({
      response: buttonIndex,
      checkboxChecked: false,
    })) as typeof dialog.showMessageBox;
  }, response);
}

async function sendImageAction(
  app: ElectronApplication,
  action: 'rotate-left' | 'rotate-right',
): Promise<void> {
  await app.evaluate(({ BrowserWindow }, imageAction) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:image-action', imageAction);
  }, action);
}

async function sendSaveProjectMenuAction(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:save-project-requested');
  });
}

async function sendSaveProjectAsMenuAction(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:save-project-as-requested');
  });
}

async function closeMainWindow(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows()[0]?.close();
  });
}

function isMainWindowOpen(app: ElectronApplication): Promise<boolean> {
  return app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length > 0);
}

function recentFileLabels(app: ElectronApplication): Promise<string[]> {
  return app.evaluate(({ Menu }) => {
    const fileMenu = Menu.getApplicationMenu()?.items.find((item) => item.label === 'File');
    const recentMenu = fileMenu?.submenu?.items.find((item) => item.label === 'Open Recent');
    return recentMenu?.submenu?.items.map((item) => item.label) ?? [];
  });
}

let app: ElectronApplication;
let window: Page;
let workDir: string;

test.beforeEach(async () => {
  workDir = await mkdtemp(path.join(os.tmpdir(), 'image-editor-lifecycle-'));
  app = await electron.launch({ args: [projectRoot] });
  window = await app.firstWindow();
  // test.png is 320x200.
  await stubOpenDialog(app, path.join(fixturesDir, 'test.png'));
  await window.getByRole('button', { name: 'Open Image' }).click();
  await expect(window.getByText('320 × 200')).toBeVisible();
});

test.afterEach(async () => {
  await app.close().catch(() => {});
  await rm(workDir, { recursive: true, force: true });
});

test('the window title reflects the open document and its dirty state', async () => {
  await expect.poll(() => window.title()).toBe('test.png — Image Editor');

  await sendImageAction(app, 'rotate-right');

  await expect.poll(() => window.title()).toBe('test.png • — Image Editor');
});

test('Save writes quietly to the tracked project path; Save As always prompts', async () => {
  const firstPath = path.join(workDir, 'first.imgedit');
  await stubSaveDialog(app, firstPath);
  await sendSaveProjectAsMenuAction(app);
  await expect.poll(() => window.title()).toBe('first.imgedit — Image Editor');

  await sendImageAction(app, 'rotate-right');
  await expect.poll(() => window.title()).toBe('first.imgedit • — Image Editor');

  // If "Save" incorrectly opened the save dialog, this stub throws, the
  // save fails, and the title would stay dirty — so a clean title here
  // proves it went straight to the known path.
  await stubSaveDialogToFail(app);
  await sendSaveProjectMenuAction(app);
  await expect.poll(() => window.title()).toBe('first.imgedit — Image Editor');

  const secondPath = path.join(workDir, 'second.imgedit');
  await stubSaveDialog(app, secondPath);
  await sendSaveProjectAsMenuAction(app);
  await expect.poll(() => window.title()).toBe('second.imgedit — Image Editor');
});

test('opened and saved files appear in the Open Recent menu', async () => {
  const projectPath = path.join(workDir, 'test.imgedit');
  await stubSaveDialog(app, projectPath);
  await sendSaveProjectAsMenuAction(app);
  await expect.poll(() => window.title()).toBe('test.imgedit — Image Editor');

  await expect.poll(() => recentFileLabels(app)).toContain('test.imgedit');
});

test('closing a dirty document asks for confirmation; Cancel keeps the window open', async () => {
  await sendImageAction(app, 'rotate-right');
  await stubMessageBoxResponse(app, 2); // Cancel

  await closeMainWindow(app);

  await expect.poll(() => isMainWindowOpen(app)).toBe(true);
});

test('closing a dirty document and choosing "Don\'t Save" closes without saving', async () => {
  await sendImageAction(app, 'rotate-right');
  await stubMessageBoxResponse(app, 1); // Don't Save

  await closeMainWindow(app);

  await expect.poll(() => isMainWindowOpen(app)).toBe(false);
});

test('closing a dirty, never-saved document and choosing Save prompts a save location, then closes', async () => {
  await sendImageAction(app, 'rotate-right');
  const projectPath = path.join(workDir, 'saved-on-close.imgedit');
  await stubSaveDialog(app, projectPath);
  await stubMessageBoxResponse(app, 0); // Save

  await closeMainWindow(app);

  await expect.poll(() => isMainWindowOpen(app)).toBe(false);
  const bytes = await readFile(projectPath);
  expect(bytes.subarray(0, 2)).toEqual(Buffer.from('PK', 'ascii'));
});

test('closing a clean document does not prompt at all', async () => {
  await closeMainWindow(app);

  await expect.poll(() => isMainWindowOpen(app)).toBe(false);
});
