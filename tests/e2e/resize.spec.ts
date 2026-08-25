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

async function sendResizeMenuAction(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:image-action', 'resize');
  });
}

function readMenuItemEnabled(app: ElectronApplication, id: string): Promise<boolean | undefined> {
  return app.evaluate(
    ({ Menu }, menuId) => Menu.getApplicationMenu()?.getMenuItemById(menuId)?.enabled,
    id,
  );
}

let app: ElectronApplication;
let window: Page;

test.beforeEach(async () => {
  app = await electron.launch({ args: [projectRoot] });
  window = await app.firstWindow();
  // test.png is 320x200.
  await stubOpenDialog(app, path.join(fixturesDir, 'test.png'));
  await window.getByRole('button', { name: 'Open Image' }).click();
  await expect(window.getByText('320 × 200')).toBeVisible();
});

test.afterEach(async () => {
  await app.close();
});

test('the Resize menu item is disabled until a document is open', async () => {
  const freshApp = await electron.launch({ args: [projectRoot] });
  expect(await readMenuItemEnabled(freshApp, 'resize')).toBe(false);
  await freshApp.close();

  expect(await readMenuItemEnabled(app, 'resize')).toBe(true);
});

test('the resize menu action opens a dialog prefilled with the current dimensions', async () => {
  await sendResizeMenuAction(app);

  await expect(window.getByRole('heading', { name: 'Resize Image' })).toBeVisible();
  await expect(window.getByLabel('Width')).toHaveValue('320');
  await expect(window.getByLabel('Height')).toHaveValue('200');
});

test('locked aspect ratio: changing width updates height, and resizing updates the reported dimensions', async () => {
  await sendResizeMenuAction(app);

  await window.getByLabel('Width').fill('160');
  await expect(window.getByLabel('Height')).toHaveValue('100');

  await window.getByRole('button', { name: 'Resize' }).click();

  await expect(window.getByText('160 × 100')).toBeVisible();
  const undoLabel = await app.evaluate(
    ({ Menu }) => Menu.getApplicationMenu()?.getMenuItemById('undo')?.label,
  );
  expect(undoLabel).toBe('Undo Resize');
});

test('an invalid width disables the Resize button', async () => {
  await sendResizeMenuAction(app);

  await window.getByLabel('Width').fill('0');

  await expect(window.getByRole('button', { name: 'Resize' })).toBeDisabled();
});

test('Escape cancels without changing the document', async () => {
  await sendResizeMenuAction(app);
  await window.getByLabel('Width').fill('160');

  await window.keyboard.press('Escape');

  await expect(window.getByRole('heading', { name: 'Resize Image' })).not.toBeVisible();
  await expect(window.getByText('320 × 200')).toBeVisible();
});

test('undo restores the pre-resize dimensions and redo reapplies the resize', async () => {
  await sendResizeMenuAction(app);
  await window.getByLabel('Width').fill('160');
  await window.getByRole('button', { name: 'Resize' }).click();
  await expect(window.getByText('160 × 100')).toBeVisible();

  await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:history-action', 'undo');
  });
  await expect(window.getByText('320 × 200')).toBeVisible();

  await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:history-action', 'redo');
  });
  await expect(window.getByText('160 × 100')).toBeVisible();
});
