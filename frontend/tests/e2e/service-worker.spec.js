import { test, expect } from '@playwright/test';
import { E2E_USERS, loginViaUI, clearClientState } from './helpers/fixtures.js';

test.describe('Logout cache purge', () => {
  test.beforeEach(async ({ page }) => {
    await clearClientState(page);
  });

  test('logout menghapus cache sensitif non-static', async ({ page, context }) => {
    await loginViaUI(page, E2E_USERS.student, /\/dashboard/);

    await page.evaluate(async () => {
      const cache = await caches.open('dynamic-v1');
      await cache.put(
        '/v1/api/reports',
        new Response(JSON.stringify({ sensitive: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      );
      await caches.open('images-v2');
    });

    const beforeLogout = await page.evaluate(async () => {
      const names = await caches.keys();
      return names.sort();
    });
    expect(beforeLogout).toEqual(expect.arrayContaining(['dynamic-v1', 'images-v2']));

    await page.getByText(/keluar/i).first().click();
    await page.getByRole('button', { name: /ya, keluar/i }).click();
    await page.waitForURL(/\/login/, { timeout: 20_000 });

    const afterLogout = await page.evaluate(async () => {
      const names = await caches.keys();
      return names.filter((n) => !n.startsWith('static-v'));
    });

    expect(afterLogout).toEqual([]);

    const storage = await context.storageState();
    expect(storage.origins.every((o) => !o.localStorage.some((e) => e.name === 'auth-storage' && e.value.includes('token')))).toBeTruthy();
  });
});
