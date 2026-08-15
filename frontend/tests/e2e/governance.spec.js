import { test, expect } from '@playwright/test';
import { E2E_USERS, apiURL } from './helpers/fixtures.js';

/**
 * Governance E2E (API-level): anonimitas laporan, guard superadmin terakhir,
 * dan kontrol akses laporan.
 *
 * Semua skenario diassert lewat API (fixture `request`) agar robust dan tidak
 * bergantung pada UI. Data uji memakai suffix Date.now() dan dibersihkan di
 * afterAll sehingga suite bisa dijalankan berulang.
 */

function unwrapData(body) {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.data)) return body.data;
  return body?.data ?? body;
}

test.describe('Governance (API)', () => {
  let studentToken;
  let studentId;
  let adminToken;

  test.beforeAll(async ({ request }) => {
    const studentLogin = await request.post(`${apiURL}/auth/login`, {
      data: {
        email: E2E_USERS.student.email,
        password: E2E_USERS.student.password,
      },
    });
    expect(studentLogin.ok()).toBeTruthy();
    const studentBody = await studentLogin.json();
    studentToken = studentBody.accessToken;
    studentId = studentBody?.data?.id;

    const adminLogin = await request.post(`${apiURL}/auth/login`, {
      data: {
        email: E2E_USERS.admin.email,
        password: E2E_USERS.admin.password,
      },
    });
    expect(adminLogin.ok()).toBeTruthy();
    adminToken = (await adminLogin.json()).accessToken;
  });

  test.describe('Anonimitas laporan', () => {
    let anonymousReportId;
    let anonCategoryId;
    let createdCategoryId;

    test.beforeAll(async ({ request }) => {
      // Cari kategori yang mengizinkan laporan anonim.
      const categoriesRes = await request.get(`${apiURL}/categories`);
      expect(categoriesRes.ok()).toBeTruthy();
      const categories = unwrapData(await categoriesRes.json()) || [];
      const existing = categories.find((c) => c.allowAnonymous === true);

      if (existing) {
        anonCategoryId = existing.id;
      } else {
        // Tidak ada kategori allowAnonymous — buat satu sebagai SUPERADMIN
        // (nama unik per run) agar path anonimitas tetap bisa diuji.
        const createCategoryRes = await request.post(`${apiURL}/categories`, {
          headers: { Authorization: `Bearer ${adminToken}` },
          data: {
            name: `E2E Kategori Anonim ${Date.now()}`,
            defaultPriority: 'MEDIUM',
            allowAnonymous: true,
          },
        });
        if (createCategoryRes.ok()) {
          const createdCategory = unwrapData(await createCategoryRes.json());
          anonCategoryId = createdCategory?.id;
          createdCategoryId = anonCategoryId;
        }
      }
      if (!anonCategoryId) return; // test.skip di test akan menangani kasus ini

      const createRes = await request.post(`${apiURL}/reports`, {
        headers: { Authorization: `Bearer ${studentToken}` },
        data: {
          title: `E2E Laporan Anonim ${Date.now()}`,
          description: '<p>Laporan anonim untuk pengujian governance E2E</p>',
          categoryId: anonCategoryId,
          isAnonymous: true,
        },
      });
      expect(createRes.ok()).toBeTruthy();
      const created = await createRes.json();
      anonymousReportId = created?.data?.id || created?.id;
    });

    test.afterAll(async ({ request }) => {
      // Bersihkan data uji: soft-delete laporan dulu, baru kategori yang dibuat
      // (kategori dengan laporan aktif tidak bisa dihapus).
      if (anonymousReportId) {
        await request.delete(`${apiURL}/reports/${anonymousReportId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      }
      if (createdCategoryId) {
        await request.delete(`${apiURL}/categories/${createdCategoryId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      }
    });

    test('identitas pelapor anonim disembunyikan dari admin, tetapi terlihat oleh pelapor sendiri', async ({ request }) => {
      test.skip(!anonymousReportId, 'Tidak ada kategori allowAnonymous dan gagal membuatnya');

      // Pandangan admin/superadmin: identitas harus termasker.
      const adminRes = await request.get(`${apiURL}/reports/${anonymousReportId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(adminRes.ok()).toBeTruthy();
      const adminReport = unwrapData(await adminRes.json());
      expect(adminReport.isAnonymous).toBe(true);
      expect(adminReport.userId).toBeNull();
      expect(adminReport.user?.id).toBeNull();
      expect(adminReport.user?.name).toBe('Anonim');
      expect(adminReport.user?.email).toBeNull();
      expect(adminReport.user?.nim).toBeNull();

      // Pandangan pelapor sendiri: identitas asli tetap terlihat.
      const ownerRes = await request.get(`${apiURL}/reports/${anonymousReportId}`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(ownerRes.ok()).toBeTruthy();
      const ownerReport = unwrapData(await ownerRes.json());
      expect(ownerReport.userId).toBe(studentId);
      expect(ownerReport.user?.id).toBe(studentId);
      expect(ownerReport.user?.name).toBe(E2E_USERS.student.name);
    });
  });

  test.describe('Kontrol akses laporan', () => {
    let reportId;

    test.beforeAll(async ({ request }) => {
      const categoriesRes = await request.get(`${apiURL}/categories`);
      const categories = unwrapData(await categoriesRes.json()) || [];
      const categoryId = categories?.[0]?.id;

      const createRes = await request.post(`${apiURL}/reports`, {
        headers: { Authorization: `Bearer ${studentToken}` },
        data: {
          title: `E2E Laporan Akses ${Date.now()}`,
          description: '<p>Laporan untuk pengujian kontrol akses E2E</p>',
          categoryId,
        },
      });
      expect(createRes.ok()).toBeTruthy();
      const created = await createRes.json();
      reportId = created?.data?.id || created?.id;
    });

    test.afterAll(async ({ request }) => {
      if (reportId) {
        await request.delete(`${apiURL}/reports/${reportId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      }
    });

    test('laporan tidak bisa dibaca tanpa autentikasi', async ({ request }) => {
      test.skip(!reportId, 'Fixture laporan tidak tersedia');

      // Kontrol positif: pemilik bisa membaca laporannya sendiri.
      const ownerRes = await request.get(`${apiURL}/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      expect(ownerRes.ok()).toBeTruthy();

      // Tanpa token, akses harus ditolak dan tidak membocorkan data laporan.
      const anonRes = await request.get(`${apiURL}/reports/${reportId}`);
      expect([401, 403]).toContain(anonRes.status());
      const anonBody = await anonRes.json().catch(() => null);
      expect(anonBody?.data).toBeFalsy();
    });
  });

  // Sengaja ditempatkan terakhir: bila guard ternyata jebol dan demote sukses,
  // token admin tidak lagi valid untuk test berikutnya. Seed E2E akan
  // mengembalikan role SUPERADMIN pada run berikutnya.
  test('demote terhadap superadmin terakhir harus ditolak', async ({ request }) => {
    const listRes = await request.get(`${apiURL}/admin-governance/admins`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const admins = unwrapData(await listRes.json()) || [];
    const superAdmins = admins.filter((a) => a.role === 'SUPERADMIN');

    // Guard hanya bisa dipicu dengan aman bila tepat ada satu SUPERADMIN.
    test.skip(
      superAdmins.length !== 1,
      'Jumlah SUPERADMIN bukan tepat satu — guard tidak bisa diuji dengan aman'
    );

    const target = superAdmins[0];
    expect(target.email).toBe(E2E_USERS.admin.email);

    const demoteRes = await request.post(
      `${apiURL}/admin-governance/users/${target.id}/demote-superadmin`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    // Guard harus menolak: respons 4xx (bukan 2xx, bukan 5xx). Pesan error
    // bisa berasal dari guard "last SUPERADMIN" atau dari lapisan lock
    // (advisory lock) — keduanya sama-sama menolak demote, dan invariant yang
    // benar-benar penting diverifikasi di bawah: state tidak boleh berubah.
    expect(demoteRes.ok()).toBeFalsy();
    expect(demoteRes.status()).toBeGreaterThanOrEqual(400);
    expect(demoteRes.status()).toBeLessThan(500);

    // Pastikan state tidak berubah: target masih SUPERADMIN (tidak ter-demote).
    const verifyRes = await request.get(`${apiURL}/admin-governance/admins`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(verifyRes.ok()).toBeTruthy();
    const after = unwrapData(await verifyRes.json()) || [];
    const stillSuperAdmin = after.find((a) => a.id === target.id);
    expect(stillSuperAdmin?.role).toBe('SUPERADMIN');
  });
});
