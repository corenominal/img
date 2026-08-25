import path from 'node:path';
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

async function sendImageAction(
  app: ElectronApplication,
  action: 'rotate-left' | 'rotate-right' | 'flip-horizontal' | 'flip-vertical',
): Promise<void> {
  await app.evaluate(({ BrowserWindow }, imageAction) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:image-action', imageAction);
  }, action);
}

async function sendHistoryAction(app: ElectronApplication, action: 'undo' | 'redo'): Promise<void> {
  await app.evaluate(({ BrowserWindow }, historyAction) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:history-action', historyAction);
  }, action);
}

function readMenuItemEnabled(app: ElectronApplication, id: string): Promise<boolean | undefined> {
  return app.evaluate(({ Menu }, menuId) => Menu.getApplicationMenu()?.getMenuItemById(menuId)?.enabled, id);
}

let app: ElectronApplication;
let window: Page;

test.beforeEach(async () => {
  app = await electron.launch({ args: [projectRoot] });
  window = await app.firstWindow();
  await stubOpenDialog(app, path.join(fixturesDir, 'test.png'));
  await window.getByRole('button', { name: 'Open Image' }).click();
  await expect(window.getByText('320 × 200')).toBeVisible();
});

test.afterEach(async () => {
  await app.close();
});

test('rotating 90° swaps the reported dimensions', async () => {
  await sendImageAction(app, 'rotate-right');
  await expect(window.getByText('200 × 320')).toBeVisible();
});

test('rotating left then right returns to the original dimensions', async () => {
  await sendImageAction(app, 'rotate-left');
  await expect(window.getByText('200 × 320')).toBeVisible();
  await sendImageAction(app, 'rotate-right');
  await expect(window.getByText('320 × 200')).toBeVisible();
});

test('flipping does not change dimensions', async () => {
  await sendImageAction(app, 'flip-horizontal');
  await expect(window.getByText('320 × 200')).toBeVisible();
  await sendImageAction(app, 'flip-vertical');
  await expect(window.getByText('320 × 200')).toBeVisible();
});

test('undo restores the previous dimensions and redo reapplies the rotation', async () => {
  await sendImageAction(app, 'rotate-right');
  await expect(window.getByText('200 × 320')).toBeVisible();

  await sendHistoryAction(app, 'undo');
  await expect(window.getByText('320 × 200')).toBeVisible();

  await sendHistoryAction(app, 'redo');
  await expect(window.getByText('200 × 320')).toBeVisible();
});

test('the Undo and Redo menu items enable and disable as history changes', async () => {
  expect(await readMenuItemEnabled(app, 'undo')).toBe(false);
  expect(await readMenuItemEnabled(app, 'redo')).toBe(false);

  await sendImageAction(app, 'rotate-right');
  await expect.poll(() => readMenuItemEnabled(app, 'undo')).toBe(true);
  expect(await readMenuItemEnabled(app, 'redo')).toBe(false);

  await sendHistoryAction(app, 'undo');
  await expect.poll(() => readMenuItemEnabled(app, 'redo')).toBe(true);
  expect(await readMenuItemEnabled(app, 'undo')).toBe(false);
});

test('the Image menu items are disabled until a document is open', async () => {
  // A fresh instance with no document opened yet, independent of the
  // beforeEach instance (which already has an image open by this point).
  const freshApp = await electron.launch({ args: [projectRoot] });
  await freshApp.firstWindow();

  expect(await readMenuItemEnabled(freshApp, 'rotate-left')).toBe(false);
  expect(await readMenuItemEnabled(freshApp, 'flip-horizontal')).toBe(false);

  await freshApp.close();
});
