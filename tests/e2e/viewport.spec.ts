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

async function sendViewportAction(
  app: ElectronApplication,
  action: 'zoom-in' | 'zoom-out' | 'actual-size' | 'fit-to-window',
): Promise<void> {
  await app.evaluate(({ BrowserWindow }, viewportAction) => {
    const [win] = BrowserWindow.getAllWindows();
    win?.webContents.send('menu:viewport-action', viewportAction);
  }, action);
}

function readZoomPercent(window: Page): Promise<number> {
  return window
    .getByText(/^Zoom \d+%$/)
    .textContent()
    .then((text) => Number(text?.replace(/\D/g, '')));
}

let app: ElectronApplication;
let window: Page;

test.beforeEach(async () => {
  app = await electron.launch({ args: [projectRoot] });
  window = await app.firstWindow();
  await window.setViewportSize({ width: 1000, height: 800 });
  await stubOpenDialog(app, path.join(fixturesDir, 'test.png'));
  await window.getByRole('button', { name: 'Open Image' }).click();
  await expect(window.locator('canvas.image-canvas')).toBeVisible();
});

test.afterEach(async () => {
  await app.close();
});

test('fits the image to the window on open, well below 100% for a small window', async () => {
  const zoom = await readZoomPercent(window);
  expect(zoom).toBeGreaterThan(0);
  expect(zoom).toBeLessThan(1000);
});

test('actual size sets zoom to exactly 100%', async () => {
  await sendViewportAction(app, 'actual-size');
  await expect.poll(() => readZoomPercent(window)).toBe(100);
});

test('zoom in and zoom out change the percentage in the expected direction', async () => {
  await sendViewportAction(app, 'actual-size');
  await expect.poll(() => readZoomPercent(window)).toBe(100);
  const baseline = 100;

  await sendViewportAction(app, 'zoom-in');
  await expect.poll(() => readZoomPercent(window)).toBeGreaterThan(baseline);

  await sendViewportAction(app, 'zoom-out');
  await sendViewportAction(app, 'zoom-out');
  await expect.poll(() => readZoomPercent(window)).toBeLessThan(baseline);
});

test('fit to window returns to the fitted zoom level after zooming in', async () => {
  const fitted = await readZoomPercent(window);
  await sendViewportAction(app, 'actual-size');
  await expect.poll(() => readZoomPercent(window)).not.toBe(fitted);

  await sendViewportAction(app, 'fit-to-window');
  await expect.poll(() => readZoomPercent(window)).toBe(fitted);
});

test('mouse wheel zooms in and out around the pointer', async () => {
  const baseline = await readZoomPercent(window);
  const canvas = window.locator('canvas.image-canvas');
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('canvas has no layout box');
  }
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await window.mouse.move(center.x, center.y);
  await window.mouse.wheel(0, -240);
  await expect.poll(() => readZoomPercent(window)).toBeGreaterThan(baseline);
  const zoomedIn = await readZoomPercent(window);

  await window.mouse.wheel(0, 240);
  await expect.poll(() => readZoomPercent(window)).toBeLessThan(zoomedIn);
});

test('dragging with the move tool pans without changing the zoom level', async () => {
  await window.getByRole('button', { name: 'Move' }).click();
  const zoomBefore = await readZoomPercent(window);

  const canvas = window.locator('canvas.image-canvas');
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('canvas has no layout box');
  }
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await window.mouse.move(start.x, start.y);
  await window.mouse.down();
  await window.mouse.move(start.x + 80, start.y + 40, { steps: 5 });
  await window.mouse.up();

  expect(await readZoomPercent(window)).toBe(zoomBefore);
});
