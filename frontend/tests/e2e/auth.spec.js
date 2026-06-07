import { test, expect } from '@playwright/test';
import { E2E_USERS, loginViaUI, clearClientState } from './helpers/fixtures.js';

test.describe('Login flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearClientState(page);
  });

  test('mahasiswa dapat login dan diarahkan ke dashboard', async ({ page }) => {
    await loginViaUI(page, E2E_USERS.student, /\/dashboard/);
    await expect(page.getByText(/laporan/i).first()).toBeVisible();
  });

  test('admin dapat login dan diarahkan ke panel admin', async ({ page }) => {
    await loginViaUI(page, E2E_USERS.admin, /\/admin/);
    await expect(page.getByText(/dashboard|manajemen|laporan/i).first()).toBeVisible();
  });

  test('menampilkan error untuk kredensial salah', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email kampus/i).fill(E2E_USERS.student.email);
    await page.getByLabel(/^password$/i).fill('WrongPass123!');
    await page.getByRole('button', { name: /masuk ke akun/i }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
