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

let app: ElectronApplication;
let window: Page;

test.beforeEach(async () => {
  app = await electron.launch({ args: [projectRoot] });
  window = await app.firstWindow();
  await window.setViewportSize({ width: 900, height: 700 });
  // test.png is 320x200, opened at a fit zoom comfortably inside 900x700.
  await stubOpenDialog(app, path.join(fixturesDir, 'test.png'));
  await window.getByRole('button', { name: 'Open Image' }).click();
  await expect(window.getByText('320 × 200')).toBeVisible();
});

test.afterEach(async () => {
  await app.close();
});

test('selecting Crop shows a full-image overlay and the crop panel', async () => {
  await window.getByRole('button', { name: 'Crop' }).click();

  await expect(window.locator('.crop-overlay__rect')).toBeVisible();
  await expect(window.getByRole('heading', { name: 'Crop' })).toBeVisible();
  await expect(window.getByRole('button', { name: 'Move' })).toHaveAttribute('aria-pressed', 'false');
});

test('the crop tool is disabled without an open document', async () => {
  const freshApp = await electron.launch({ args: [projectRoot] });
  const freshWindow = await freshApp.firstWindow();
  await expect(freshWindow.getByRole('button', { name: 'Crop' })).toBeDisabled();
  await freshApp.close();
});

test('dragging the bottom-right handle shrinks the crop and Commit applies it', async () => {
  await window.getByRole('button', { name: 'Crop' }).click();
  const handle = window.locator('.crop-overlay__handle--se');
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error('handle has no layout box');
  }
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await window.mouse.move(start.x, start.y);
  await window.mouse.down();
  await window.mouse.move(start.x - 60, start.y - 40, { steps: 5 });
  await window.mouse.up();

  await window.getByRole('button', { name: 'Commit' }).click();

  // Dimensions shrank, and we're back to a non-cropping state.
  const statusText = await window.locator('.status-bar__item').first().textContent();
  expect(statusText).not.toBe('320 × 200');
  await expect(window.locator('.crop-overlay__rect')).toHaveCount(0);
  await expect(window.getByRole('button', { name: 'Move' })).toHaveAttribute('aria-pressed', 'true');
});

test('Escape cancels without changing the document', async () => {
  await window.getByRole('button', { name: 'Crop' }).click();
  const handle = window.locator('.crop-overlay__handle--se');
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error('handle has no layout box');
  }
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await window.mouse.move(start.x, start.y);
  await window.mouse.down();
  await window.mouse.move(start.x - 60, start.y - 40, { steps: 5 });
  await window.mouse.up();

  await window.keyboard.press('Escape');

  await expect(window.getByText('320 × 200')).toBeVisible();
  await expect(window.locator('.crop-overlay__rect')).toHaveCount(0);
  await expect(window.getByRole('button', { name: 'Move' })).toHaveAttribute('aria-pressed', 'true');
});

test('Enter commits the current crop rect', async () => {
  await window.getByRole('button', { name: 'Crop' }).click();
  await window.keyboard.press('Enter');

  // Full-image crop was committed: dimensions are unchanged, but it is now
  // a real (dirty) operation, and we're back on the move tool.
  await expect(window.getByText('320 × 200')).toBeVisible();
  await expect(window.getByRole('button', { name: 'Move' })).toHaveAttribute('aria-pressed', 'true');

  const undoLabel = await app.evaluate(({ Menu }) => Menu.getApplicationMenu()?.getMenuItemById('undo')?.label);
  expect(undoLabel).toBe('Undo Crop');
});

test('undo restores the pre-crop dimensions and redo reapplies the crop', async () => {
  await window.getByRole('button', { name: 'Crop' }).click();
  const handle = window.locator('.crop-overlay__handle--se');
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error('handle has no layout box');
  }
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await window.mouse.move(start.x, start.y);
  await window.mouse.down();
  await window.mouse.move(start.x - 100, start.y - 60, { steps: 5 });
  await window.mouse.up();
  await window.getByRole('button', { name: 'Commit' }).click();

  const dimensions = window.locator('.status-bar__item').first();
  await expect(dimensions).not.toHaveText('320 × 200');
  const croppedText = await dimensions.textContent();

  await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:history-action', 'undo');
  });
  await expect(window.getByText('320 × 200')).toBeVisible();

  await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:history-action', 'redo');
  });
  await expect(window.locator('.status-bar__item').first()).toHaveText(croppedText ?? '');
});

test('locking a 1:1 aspect ratio only shows corner handles and keeps the crop square', async () => {
  await window.getByRole('button', { name: 'Crop' }).click();
  await window.getByRole('radio', { name: '1:1' }).check();

  await expect(window.locator('.crop-overlay__handle--e')).toHaveCount(0);
  await expect(window.locator('.crop-overlay__handle--se')).toBeVisible();

  await window.getByRole('button', { name: 'Commit' }).click();
  await expect(window.getByText('200 × 200')).toBeVisible();
});
