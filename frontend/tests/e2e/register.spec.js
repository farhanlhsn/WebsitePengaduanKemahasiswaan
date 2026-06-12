import { test, expect } from '@playwright/test';
import { clearClientState } from './helpers/fixtures.js';

test.describe('Registration stepper smoke', () => {
  test.beforeEach(async ({ page }) => {
    await clearClientState(page);
  });

  test('stepper registrasi menampilkan tiga langkah', async ({ page }) => {
    await page.goto('/register');

    await expect(page.getByText('Bergabung dengan Kami')).toBeVisible();
    await expect(page.getByLabel(/NIM/i)).toBeVisible();
    await expect(page.getByLabel(/Nama Lengkap/i)).toBeVisible();
    await expect(page.getByLabel(/Email Kampus/i)).toBeVisible();

    await page.getByLabel(/NIM/i).fill('2021001234');
    await page.getByLabel(/Nama Lengkap/i).fill('Budi Santoso');
    await page.getByLabel(/Email Kampus/i).fill('budi@mahasiswa.bunghatta.ac.id');
    await page.getByTestId('next-step-0').click();

    await expect(page.getByLabel(/^Password$/i)).toBeVisible();
    await expect(page.getByLabel(/Konfirmasi Password/i)).toBeVisible();

    await page.getByLabel(/^Password$/i).fill('P@ssword123');
    await page.getByLabel(/Konfirmasi Password/i).fill('P@ssword123');
    await page.getByTestId('next-step-1').click();

    await expect(page.getByText('Upload KTM Anda')).toBeVisible();
  });
});
