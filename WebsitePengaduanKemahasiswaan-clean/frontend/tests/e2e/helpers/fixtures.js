/**
 * Shared E2E credentials and helpers.
 */

export const E2E_USERS = {
  student: {
    email: 'e2e.student@mahasiswa.bunghatta.ac.id',
    password: 'E2eTest123!',
    name: 'E2E Mahasiswa',
  },
  admin: {
    email: 'e2e.admin@kampus.ac.id',
    password: 'E2eTest123!',
    name: 'E2E Super Admin',
  },
};

export const baseURL = process.env.E2E_BASE_URL || 'http://localhost:5173';
export const apiURL = process.env.E2E_API_URL || 'http://localhost:6060/v1/api';

/**
 * Log in through the UI and wait for post-login redirect.
 */
export async function loginViaUI(page, { email, password }, expectedPath = /\/(dashboard|admin)/) {
  await page.goto('/login');
  await page.getByLabel(/email kampus/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button', { name: /masuk ke akun/i }).click();
  await page.waitForURL(expectedPath, { timeout: 30_000 });
}

/**
 * Clear client storage before sensitive scenarios.
 */
export async function clearClientState(page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
