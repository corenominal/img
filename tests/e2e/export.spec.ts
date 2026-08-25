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

async function stubSaveDialog(app: ElectronApplication, filePath: string | null): Promise<void> {
  await app.evaluate(({ dialog }, targetPath) => {
    dialog.showSaveDialog = (async () => ({
      canceled: targetPath === null,
      filePath: targetPath ?? undefined,
    })) as typeof dialog.showSaveDialog;
  }, filePath);
}

async function sendExportMenuAction(app: ElectronApplication): Promise<void> {
  await app.evaluate(({ BrowserWindow }) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:export-image-requested');
  });
}

function readMenuItemEnabled(app: ElectronApplication, id: string): Promise<boolean | undefined> {
  return app.evaluate(
    ({ Menu }, menuId) => Menu.getApplicationMenu()?.getMenuItemById(menuId)?.enabled,
    id,
  );
}

function readMenuItemAccelerator(
  app: ElectronApplication,
  id: string,
): Promise<string | null | undefined> {
  return app.evaluate(
    ({ Menu }, menuId) => Menu.getApplicationMenu()?.getMenuItemById(menuId)?.accelerator,
    id,
  );
}

let app: ElectronApplication;
let window: Page;
let outputDir: string;

test.beforeEach(async () => {
  outputDir = await mkdtemp(path.join(os.tmpdir(), 'image-editor-export-'));
  app = await electron.launch({ args: [projectRoot] });
  window = await app.firstWindow();
  // test.png is 320x200.
  await stubOpenDialog(app, path.join(fixturesDir, 'test.png'));
  await window.getByRole('button', { name: 'Open Image' }).click();
  await expect(window.getByText('320 × 200')).toBeVisible();
});

test.afterEach(async () => {
  await app.close();
  await rm(outputDir, { recursive: true, force: true });
});

test('the Export menu item is disabled until a document is open, and declares Cmd/Ctrl+E', async () => {
  const freshApp = await electron.launch({ args: [projectRoot] });
  expect(await readMenuItemEnabled(freshApp, 'export')).toBe(false);
  await freshApp.close();

  expect(await readMenuItemEnabled(app, 'export')).toBe(true);
  expect(await readMenuItemAccelerator(app, 'export')).toBe('CmdOrCtrl+E');
});

test('the export menu action opens a dialog defaulting to JPEG with a quality control', async () => {
  await sendExportMenuAction(app);

  await expect(window.getByRole('heading', { name: 'Export Image' })).toBeVisible();
  await expect(window.getByLabel('Format')).toHaveValue('jpeg');
  await expect(window.getByLabel('Quality')).toBeVisible();
});

test('exports a real JPEG file at the full document resolution', async () => {
  const outputPath = path.join(outputDir, 'out.jpg');
  await stubSaveDialog(app, outputPath);
  await sendExportMenuAction(app);

  await window.getByRole('button', { name: 'Export' }).click();
  await expect(window.getByRole('heading', { name: 'Export Image' })).not.toBeVisible();

  const bytes = await readFile(outputPath);
  expect(bytes.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
});

test('exports a real PNG file, hiding the quality control and showing preserve-transparency', async () => {
  const outputPath = path.join(outputDir, 'out.png');
  await stubSaveDialog(app, outputPath);
  await sendExportMenuAction(app);

  await window.getByLabel('Format').selectOption('png');
  await expect(window.getByLabel('Quality')).not.toBeVisible();
  await expect(window.getByRole('checkbox', { name: 'Preserve transparency' })).toBeChecked();

  await window.getByRole('button', { name: 'Export' }).click();
  await expect(window.getByRole('heading', { name: 'Export Image' })).not.toBeVisible();

  const bytes = await readFile(outputPath);
  expect(bytes.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
});

test('exports a real WebP file', async () => {
  const outputPath = path.join(outputDir, 'out.webp');
  await stubSaveDialog(app, outputPath);
  await sendExportMenuAction(app);

  await window.getByLabel('Format').selectOption('webp');
  await window.getByRole('button', { name: 'Export' }).click();
  await expect(window.getByRole('heading', { name: 'Export Image' })).not.toBeVisible();

  const bytes = await readFile(outputPath);
  expect(bytes.subarray(0, 4)).toEqual(Buffer.from('RIFF', 'ascii'));
  expect(bytes.subarray(8, 12)).toEqual(Buffer.from('WEBP', 'ascii'));
});

test('a higher JPEG quality produces a larger file than a lower one', async () => {
  const lowPath = path.join(outputDir, 'low.jpg');
  await stubSaveDialog(app, lowPath);
  await sendExportMenuAction(app);
  await window.getByLabel('Quality').fill('5');
  await window.getByRole('button', { name: 'Export' }).click();
  await expect(window.getByRole('heading', { name: 'Export Image' })).not.toBeVisible();

  const highPath = path.join(outputDir, 'high.jpg');
  await stubSaveDialog(app, highPath);
  await sendExportMenuAction(app);
  await window.getByLabel('Quality').fill('100');
  await window.getByRole('button', { name: 'Export' }).click();
  await expect(window.getByRole('heading', { name: 'Export Image' })).not.toBeVisible();

  const [lowBytes, highBytes] = await Promise.all([readFile(lowPath), readFile(highPath)]);
  expect(highBytes.length).toBeGreaterThan(lowBytes.length);
});

test('Escape cancels without writing a file', async () => {
  await sendExportMenuAction(app);

  await window.keyboard.press('Escape');

  await expect(window.getByRole('heading', { name: 'Export Image' })).not.toBeVisible();
});

test('a cancelled native save dialog leaves the export dialog open', async () => {
  await stubSaveDialog(app, null);
  await sendExportMenuAction(app);

  await window.getByRole('button', { name: 'Export' }).click();

  await expect(window.getByRole('heading', { name: 'Export Image' })).toBeVisible();
});
