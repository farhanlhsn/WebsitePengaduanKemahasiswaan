import { test, expect } from '@playwright/test';
import { E2E_USERS, loginViaUI, clearClientState } from './helpers/fixtures.js';

test.describe('Create report flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearClientState(page);
    await loginViaUI(page, E2E_USERS.student, /\/dashboard/);
  });

  test('mahasiswa dapat membuat laporan baru', async ({ page }) => {
    const reportTitle = `E2E Laporan ${Date.now()}`;

    await page.getByRole('button', { name: /buat laporan/i }).first().click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/judul laporan/i).fill(reportTitle);
    await dialog.getByRole('combobox').click();
    await page.getByRole('listbox').getByRole('option').first().click();

    await dialog.getByRole('button', { name: /lanjutkan/i }).click();

    const editor = dialog.locator('[contenteditable="true"]').first();
    await editor.click();
    await editor.fill('Deskripsi laporan uji E2E — masalah akademik contoh.');

    await dialog.getByRole('button', { name: /lanjutkan/i }).click();
    await dialog.getByRole('button', { name: /kirim laporan/i }).click();

    await expect(page.getByText(reportTitle)).toBeVisible({ timeout: 30_000 });
  });
});
