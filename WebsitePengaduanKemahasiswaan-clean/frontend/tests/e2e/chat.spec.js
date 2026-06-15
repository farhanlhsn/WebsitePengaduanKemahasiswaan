import { test, expect } from '@playwright/test';
import { E2E_USERS, loginViaUI, clearClientState } from './helpers/fixtures.js';

test.describe('Chat smoke', () => {
  test.beforeEach(async ({ page }) => {
    await clearClientState(page);
    await loginViaUI(page, E2E_USERS.student, /\/dashboard/);
  });

  test('halaman chat mahasiswa dapat dimuat', async ({ page }) => {
    await page.goto('/dashboard/chat');
    await expect(page.getByText(/chat|pesan|laporan/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
