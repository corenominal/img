import path from 'node:path';
import { _electron as electron, expect, test } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';

const projectRoot = path.resolve(__dirname, '../..');

let app: ElectronApplication;
let window: Page;

test.beforeAll(async () => {
  app = await electron.launch({ args: [projectRoot] });
  window = await app.firstWindow();
});

test.afterAll(async () => {
  await app.close();
});

test('launches the application and renders the shell', async () => {
  await expect(window.getByRole('navigation', { name: 'Tools' })).toBeVisible();
  await expect(window.getByRole('complementary', { name: 'Adjustments' })).toBeVisible();
  await expect(window.getByText('No image open')).toBeVisible();
  await expect(window.getByRole('button', { name: 'Open Image' })).toBeVisible();
});

test('renderer has no direct Node.js access', async () => {
  const hasNodeAccess = await window.evaluate(() => typeof (window as unknown as { require?: unknown }).require !== 'undefined');
  expect(hasNodeAccess).toBe(false);
});
