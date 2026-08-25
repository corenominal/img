import path from 'node:path';
import { _electron as electron, expect, test } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';

const projectRoot = path.resolve(__dirname, '../..');
const fixturesDir = path.join(__dirname, 'fixtures');

// The native open dialog can't be driven through Playwright's UI automation,
// so it's stubbed in the main process. Everything downstream of that —
// IPC, file reading, decoding, document creation, canvas rendering — is
// exercised for real.
async function stubOpenDialog(app: ElectronApplication, filePath: string | null): Promise<void> {
  await app.evaluate(({ dialog }, targetPath) => {
    dialog.showOpenDialog = (async () => ({
      canceled: targetPath === null,
      filePaths: targetPath ? [targetPath] : [],
    })) as typeof dialog.showOpenDialog;
  }, filePath);
}

async function requestOpenViaMenu(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:open-image-requested');
  });
}

let app: ElectronApplication;
let window: Page;

test.beforeEach(async () => {
  app = await electron.launch({ args: [projectRoot] });
  window = await app.firstWindow();
});

test.afterEach(async () => {
  await app.close();
});

test('opens a PNG and displays it at the correct dimensions', async () => {
  await stubOpenDialog(app, path.join(fixturesDir, 'test.png'));

  await window.getByRole('button', { name: 'Open Image' }).click();

  const canvas = window.locator('canvas.image-canvas');
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute('width', '320');
  await expect(canvas).toHaveAttribute('height', '200');
  await expect(window.getByText('320 × 200')).toBeVisible();
});

test('opens a JPEG, then replaces it with a WebP via the menu', async () => {
  await stubOpenDialog(app, path.join(fixturesDir, 'test.jpg'));
  await window.getByRole('button', { name: 'Open Image' }).click();
  await expect(window.locator('canvas.image-canvas')).toHaveAttribute('width', '150');

  await stubOpenDialog(app, path.join(fixturesDir, 'test.webp'));
  await requestOpenViaMenu(app);
  await expect(window.locator('canvas.image-canvas')).toHaveAttribute('width', '64');
});

test('shows a friendly error for a corrupt file instead of crashing', async () => {
  await stubOpenDialog(app, path.join(fixturesDir, 'corrupt.png'));

  await window.getByRole('button', { name: 'Open Image' }).click();

  await expect(window.getByRole('alert')).toContainText('could not be opened');
  await expect(window.getByText('No image open')).toBeVisible();
});

test('cancelling the dialog leaves the previous document untouched', async () => {
  await stubOpenDialog(app, path.join(fixturesDir, 'test.png'));
  await window.getByRole('button', { name: 'Open Image' }).click();
  await expect(window.locator('canvas.image-canvas')).toBeVisible();

  await stubOpenDialog(app, null);
  await requestOpenViaMenu(app);

  await expect(window.locator('canvas.image-canvas')).toBeVisible();
  await expect(window.getByText('320 × 200')).toBeVisible();
});
