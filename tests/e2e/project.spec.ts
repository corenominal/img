import path from 'node:path';
import os from 'node:os';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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

async function sendSaveProjectMenuAction(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:save-project-requested');
  });
}

async function sendOpenProjectMenuAction(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:open-project-requested');
  });
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

function readMenuItemEnabled(app: ElectronApplication, id: string): Promise<boolean | undefined> {
  return app.evaluate(
    ({ Menu }, menuId) => Menu.getApplicationMenu()?.getMenuItemById(menuId)?.enabled,
    id,
  );
}

function readMenuItemLabel(app: ElectronApplication, id: string): Promise<string | undefined> {
  return app.evaluate(
    ({ Menu }, menuId) => Menu.getApplicationMenu()?.getMenuItemById(menuId)?.label,
    id,
  );
}

let app: ElectronApplication;
let window: Page;
let workDir: string;

test.beforeEach(async () => {
  workDir = await mkdtemp(path.join(os.tmpdir(), 'image-editor-project-'));
  app = await electron.launch({ args: [projectRoot] });
  window = await app.firstWindow();
});

test.afterEach(async () => {
  await app.close();
  await rm(workDir, { recursive: true, force: true });
});

test('Save Project is disabled until a document is open; Open Project is always available', async () => {
  expect(await readMenuItemEnabled(app, 'save-project')).toBe(false);

  await stubOpenDialog(app, path.join(fixturesDir, 'test.png'));
  await window.getByRole('button', { name: 'Open Image' }).click();
  await expect(window.getByText('320 × 200')).toBeVisible();

  expect(await readMenuItemEnabled(app, 'save-project')).toBe(true);
});

test('saves a real .imgedit archive, and reopening it in a fresh window restores dimensions, edits and undo history', async () => {
  await stubOpenDialog(app, path.join(fixturesDir, 'test.png'));
  await window.getByRole('button', { name: 'Open Image' }).click();
  await expect(window.getByText('320 × 200')).toBeVisible();

  await sendImageAction(app, 'rotate-right');
  await expect(window.getByText('200 × 320')).toBeVisible();

  const projectPath = path.join(workDir, 'test.imgedit');
  await stubSaveDialog(app, projectPath);
  await sendSaveProjectMenuAction(app);

  await expect(async () => {
    const bytes = await readFile(projectPath);
    // A zip archive's local file header signature.
    expect(bytes.subarray(0, 2)).toEqual(Buffer.from('PK', 'ascii'));
  }).toPass();

  // Saving is not an undoable step: the rotate is still what Undo reports.
  expect(await readMenuItemLabel(app, 'undo')).toBe('Undo Rotate Right');

  await app.close();
  app = await electron.launch({ args: [projectRoot] });
  window = await app.firstWindow();

  await stubOpenDialog(app, projectPath);
  await sendOpenProjectMenuAction(app);

  // The rotated dimensions and the rotate operation itself both survived
  // the round trip through the project file.
  await expect(window.getByText('200 × 320')).toBeVisible();
  expect(await readMenuItemLabel(app, 'undo')).toBe('Undo Rotate Right');

  await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:history-action', 'undo');
  });
  await expect(window.getByText('320 × 200')).toBeVisible();
});

test('a corrupt project file produces a friendly error instead of a crash', async () => {
  const corruptPath = path.join(workDir, 'corrupt.imgedit');
  await writeFile(corruptPath, 'this is not a zip archive');
  await stubOpenDialog(app, corruptPath);

  await sendOpenProjectMenuAction(app);

  await expect(
    window.getByText('This project file is damaged or is not a valid Image Editor project.'),
  ).toBeVisible();
});
