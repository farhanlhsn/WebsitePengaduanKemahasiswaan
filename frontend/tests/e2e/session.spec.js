import { test, expect } from '@playwright/test';
import { E2E_USERS, loginViaUI, clearClientState, apiURL } from './helpers/fixtures.js';

const NEW_PASSWORD = 'E2eNewPass123!';

test.describe('Session invalidation after password change', () => {
  test('ubah password memaksa login ulang', async ({ page, context }) => {
    await clearClientState(page);
    await loginViaUI(page, E2E_USERS.student, /\/dashboard/);

    await page.goto('/settings');
    await expect(page.getByText(/pengaturan/i).first()).toBeVisible({ timeout: 15_000 });

    await page.getByText('Privasi & Keamanan').click();
    await page.getByRole('button', { name: /ubah password/i }).click();

    await page.getByLabel('Password Saat Ini').fill(E2E_USERS.student.password);
    await page.getByLabel('Password Baru', { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel('Konfirmasi Password Baru').fill(NEW_PASSWORD);
    await page.getByRole('button', { name: /^ubah password$/i }).last().click();

    await page.waitForURL(/\/login/, { timeout: 30_000 });

    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 15_000 });

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'refreshToken')).toBeFalsy();
  });

  test.afterAll(async ({ request }) => {
    const loginRes = await request.post(`${apiURL}/auth/login`, {
      data: {
        email: E2E_USERS.student.email,
        password: NEW_PASSWORD,
      },
    });
    if (!loginRes.ok()) return;

    const { accessToken } = await loginRes.json();
    await request.post(`${apiURL}/auth/change-password`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        currentPassword: NEW_PASSWORD,
        newPassword: E2E_USERS.student.password,
      },
    });
  });
});
