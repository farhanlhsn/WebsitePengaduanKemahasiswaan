import { test, expect } from '@playwright/test';
import { E2E_USERS, loginViaUI, apiURL, clearClientState } from './helpers/fixtures.js';

test.describe('Admin report processing', () => {
  let reportId;

  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post(`${apiURL}/auth/login`, {
      data: {
        email: E2E_USERS.student.email,
        password: E2E_USERS.student.password,
      },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { accessToken } = await loginRes.json();

    const categoriesRes = await request.get(`${apiURL}/categories`);
    const categories = await categoriesRes.json();
    const categoryId = categories?.data?.[0]?.id || categories?.[0]?.id;

    const createRes = await request.post(`${apiURL}/reports`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: `E2E Admin Report ${Date.now()}`,
        description: '<p>Laporan untuk pengujian admin E2E</p>',
        categoryId,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = await createRes.json();
    reportId = created?.data?.id || created?.id;
  });

  test.beforeEach(async ({ page }) => {
    await clearClientState(page);
    await loginViaUI(page, E2E_USERS.admin, /\/admin/);
  });

  test('admin dapat membuka detail laporan dalam popup dan mengubah status', async ({ page }) => {
    test.skip(!reportId, 'Fixture report tidak tersedia');

    await page.goto(`/admin/reports/${reportId}`);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(new RegExp(`/admin/reports\?report=${reportId}`));

    await dialog.getByLabel('Status').click();
    await page.getByRole('option', { name: 'Ditinjau' }).click();
    await dialog.getByRole('button', { name: /simpan status/i }).click();
    await expect(dialog.getByText(/ditinjau/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
