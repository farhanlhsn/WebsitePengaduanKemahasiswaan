# Panduan Developer

Panduan ini ditujukan bagi developer yang melanjutkan pengembangan Sistem Pengaduan Kemahasiswaan UBH. Isinya: cara kode disusun, langkah menambah fitur tanpa melanggar aturan keamanan yang sudah ada, dan jebakan yang perlu diketahui. Instalasi dasar ada di [README](../README.md), deployment di [ProductionRunbook](ProductionRunbook.md), dan referensi API di [api/README](api/README.md).

## 1. Peta sistem

```
Browser ──HTTPS──► Nginx (frontend/nginx.conf)
                     ├─ /            → berkas statis React (frontend/dist)
                     ├─ /v1/api/     ┐
                     ├─ /api/        ├─► Backend Express :6060 ──► PostgreSQL (Prisma)
                     ├─ /socket.io/  │                       ├──► Redis (rate limit, gate audit)
                     └─ /uploads/    ┘                       └──► SMTP (email notifikasi)
```

| Bagian | Teknologi | Titik masuk |
| --- | --- | --- |
| Backend | Node.js 20, Express 4, Prisma 6, Socket.IO 4 | `backend/src/server.js` → `src/app.js` |
| Frontend | React 19, Vite, MUI 7, Zustand, Axios, Socket.IO client | `frontend/src/main.jsx` → `src/pages/routes.jsx` |
| Database | PostgreSQL 16 | `backend/prisma/schema.prisma` |

## 2. Menjalankan lokal

Ikuti README (Docker Compose atau manual). Beberapa hal yang tidak tertulis di sana:

- **`backend/.env` menimpa environment shell.** `src/app.js` dan `src/config/env.js` memanggil `dotenv` dengan `override: true`. Variabel seperti `DATABASE_URL=... npm run dev` diabaikan bila `backend/.env` juga mengisinya. Untuk menjalankan backend dengan konfigurasi lain (misalnya database uji), set `E2E_BOOTSTRAP=true` agar `.env` tidak dimuat sama sekali, lalu berikan semua variabel lewat shell.
- **Jangan arahkan `.env` lokal ke database produksi.** Prisma CLI (`migrate`, `studio`, `seed`) juga membaca `backend/.env`.
- **CORS memakai origin persis.** Bila frontend dibuka di `http://127.0.0.1:5173` sementara `FRONTEND_URL=http://localhost:5173`, login akan gagal karena CORS. Gunakan host yang sama.
- **Swagger UI**: `http://localhost:6060/api/docs`.
- **Prisma Studio** untuk melihat data: `cd backend && npm run prisma:studio`.

## 3. Backend

### 3.1 Alur request

```
routes/*Routes.js            URL, middleware, validasi (express-validator)
  └─ middlewares/            authMiddleware, isAdmin/isSuperAdmin/isVerified, rate limiter, upload
      └─ controllers/        baca req, panggil service, cek akses, audit log, kirim respons
          └─ services/       logika bisnis + query Prisma
              └─ utils/      kebijakan akses, state machine, anonimisasi, dsb.
```

Modul utilitas yang **wajib dipakai ulang**, bukan ditulis ulang:

| Kebutuhan | Pakai |
| --- | --- |
| Siapa boleh melihat/mengubah laporan | `utils/accessPolicy.js` (`canAccessReport`, `canAdminManageReport`) |
| Cakupan kategori admin | `services/adminGovernanceServices.getAccessibleCategoryIds(user)` (`null` = superadmin, semua kategori) |
| Admin boleh mengelola user tertentu | `utils/userGovernancePolicy.js` (`assertCanManageUser`) |
| Cek peran | `utils/rbac.js` |
| Perpindahan status laporan | `utils/reportTransitions.js` (`canTransition`) |
| Menyamarkan pelapor anonim | `utils/anonymizer.js` (REST dan socket) |
| Format respons | `utils/responseFormatter.js` |
| Validasi berkas unggahan | `utils/fileValidation.js` |
| Sanitasi HTML | `utils/htmlSanitize.js` (dipasang global lewat `sanitizeMiddleware`) |
| Logging | `utils/logger.js` → `getLogger('modul')` (jangan `console.log`) |
| Audit log | `services/auditLogServices.createAuditLog(...)` |

### 3.2 Menambah endpoint baru — daftar periksa

1. **Route**: tambahkan di file `routes/` yang sesuai, lengkap dengan middleware peran dan validator `express-validator`, diakhiri `validate`.
2. **Controller**: ambil hanya field yang dibutuhkan dari `req.body` / `req.query`. **Jangan pernah** menyebar (`...req.body`) objek request ke Prisma `data` atau `where`; ini pernah menjadi celah mass-assignment (audit C2/M10).
3. **Akses**: untuk data laporan, selalu lewat `canAccessReport` / cakupan kategori. Admin tanpa penugasan harus mendapat hasil kosong, bukan error.
4. **Anonimitas**: setiap respons atau event yang memuat data pelapor wajib melewati `anonymizer`.
5. **Audit**: aksi yang mengubah data penting dicatat dengan `createAuditLog`. Bila perlu enum baru, tambahkan `AuditAction`/`AuditEntity` lewat migrasi.
6. **Rate limit**: endpoint yang rawan disalahgunakan (autentikasi, unggah, pembuatan data) diberi limiter dari `middlewares/rateLimiters.js`. Lihat juga catatan bug di bagian 8.
7. **Respons**: gunakan `ResponseFormatter.success/error` dan kode HTTP yang tepat.
8. **Dokumentasi**: tambahkan path di `src/docs/openapi/<modul>.yaml`, jalankan `npm run docs:openapi`, lalu commit `docs/api/openapi.json`.
9. **Tes**: unit test di `backend/tests/`; untuk aturan akses, tambahkan integration test di `tests/integration/`.

### 3.3 Mengubah skema database

```bash
cd backend
# 1. ubah prisma/schema.prisma
npx prisma migrate dev --name deskripsi_singkat   # membuat folder migrasi baru + menerapkan ke DB lokal
npx prisma generate
# 2. commit schema.prisma DAN folder prisma/migrations/<timestamp>_deskripsi_singkat/
```

- Produksi menerapkan migrasi otomatis lewat kontainer `migrate` (`npx prisma migrate deploy`) setiap `docker compose up`.
- **Jangan mengedit migrasi yang sudah diterapkan** di lingkungan mana pun; buat migrasi baru.
- Perubahan yang berisiko kehilangan data (hapus kolom, ubah tipe) diuji dulu terhadap salinan database produksi.
- `prisma/seed.js` idempoten: membuat 23 kategori bawaan dan superadmin pertama (hanya bila belum ada superadmin). `scripts/seed-e2e.js` hanya untuk tes E2E.

### 3.4 Tugas terjadwal

`src/jobs/cleanupJob.js` berjalan setiap hari pukul 03.00 (waktu server). Tugas ini menghapus refresh token kedaluwarsa, token reset password lama, dan unggahan chat yang tidak terpakai. Job dijaga advisory lock PostgreSQL agar hanya satu instance yang menjalankannya.

## 4. Frontend

| Folder | Isi |
| --- | --- |
| `src/pages/` | Halaman; `routes.jsx` mendefinisikan semua route dan pembungkus autentikasi. Halaman admin ada di `pages/admin/`. |
| `src/components/` | Komponen per domain: `admin/`, `chat/`, `dashboard/`, `report/`, `auth/`, `ui/`. |
| `src/services/` | `axiosClient.js` (instans Axios + interceptor refresh token single-flight), `api.js` (fungsi API umum), `chatApi.js`, `adminGovernanceApi.js`, `socketService.js`. |
| `src/stores/` | State Zustand: `authStore` (disimpan sebagian di localStorage, **tanpa** token), `reportStore`, `chatStore`, `categoryStore`, `userStore`, `settingsStore`. |
| `src/utils/` | `statusConfig.js` (satu sumber label dan warna status), `sanitizeHtml.js` (DOMPurify), `getApiErrorMessage.js`, dsb. |

Aturan penting:

- **Access token hanya disimpan di memori** (`services/authToken.js`). Saat halaman dimuat ulang, `authStore` meminta token baru lewat cookie refresh. Jangan menyimpan token di localStorage.
- Selalu memanggil API lewat `axiosClient`/`api.js` agar penanganan 401 → refresh → ulangi berjalan otomatis.
- Label dan warna status laporan diambil dari `utils/statusConfig.js`, jangan ditulis ulang di komponen.
- Konten HTML dari pengguna (deskripsi laporan) dirender lewat `utils/sanitizeHtml.js`.
- Variabel lingkungan frontend dibaca saat **build** (`VITE_*`). Mengubahnya di server memerlukan build ulang image frontend.

## 5. Chat real-time

Kirim, tandai dibaca, dan hapus pesan selalu lewat REST; Socket.IO hanya memancarkan perubahan. Detail event dan kode error ada di [api/SocketEvents.md](api/SocketEvents.md). Server: `backend/src/sockets/`; emisi event juga dilakukan dari `controllers/chatControllers.js` dan `utils/chatNotify.js`.

## 6. Pengujian dan CI

| Perintah | Isi | Kebutuhan |
| --- | --- | --- |
| `cd backend && npm test -- --runInBand` | 215 unit test (middleware, service, kebijakan) | — |
| `cd backend && npm run test:integration` | Integration test (anonimitas, akses chat, governance, sesi) | Docker (Postgres uji di port 55432) |
| `cd frontend && npm run lint -- --max-warnings=0` | ESLint | — |
| `cd frontend && npm run test:run` | Component test (Vitest Browser) | Chromium Playwright (`npm run test:e2e:install`) |
| `cd frontend && npm run test:e2e` | Playwright E2E (auth, laporan, chat, admin, governance) | Docker; bootstrap otomatis di `tests/e2e/global-setup.js` |

Workflow GitHub Actions (`.github/workflows/ci.yml`) menjalankan Gitleaks, `npm audit` (high), unit test, integration test, lint, component test, build, validasi docker compose, dan E2E untuk setiap push ke `main`/`develop` dan setiap pull request ke `main`. Pastikan semuanya hijau sebelum merge.

## 7. Alur kerja Git

- Buat branch dari `main` dengan nama `feat/...`, `fix/...`, `docs/...`, atau `chore/...`.
- Pesan commit mengikuti gaya yang sudah ada (Conventional Commits): `feat: ...`, `fix(security): ...`, `docs: ...`.
- Gabungkan lewat pull request ke `main`; jangan push langsung ke `main`.
- Rilis ke produksi mengikuti `docs/ProductionRunbook.md`. Catat perubahan yang terlihat oleh pengguna di `CHANGELOG.md`.

## 8. Keterbatasan dan bug yang diketahui (Oktober 2026)

Ditemukan saat menyusun dokumentasi serah terima. Belum diperbaiki di kode.

| Prioritas | Masalah | Lokasi | Dampak |
| --- | --- | --- | --- |
| Tinggi (diperbaiki di PR #10) | Semua rate limiter berbasis IP memakai key Redis yang sama (`rl:<ip>`, prefix bawaan `rl:`), sehingga limiter global (500) ikut menambah counter login (20), registrasi (20), lupa password (3), dan refresh token (60). | `middlewares/rateLimiters.js`, `app.js` (`globalLimiter`) | Setelah sekitar 20 request dari satu IP dalam 15 menit, login ditolak; setelah sekitar 60, refresh token gagal dan pengguna terlogout. PR #10 memberi prefix unik per limiter (`rl:<nama>:`). Hapus baris ini setelah PR #10 digabung. |
| Tinggi (diperbaiki di PR #10) | `GET /users/unverified/students` dan `/users/unverified/admins` mengembalikan seluruh kolom user, termasuk hash `password` dan `tokenVersion`. | `services/userServices.js` | Hash password terkirim ke browser admin. PR #10 memakai `select` eksplisit. Hapus baris ini setelah PR #10 digabung. |
| Rendah | Respons `PUT /users/verify/:id`, `GET /users/search/:email`, dan `PUT /users/profile/me` masih menyertakan `tokenVersion` dan `preferences` (bukan password; controller sudah membuang field password). | `services/userServices.js`, `controllers/userControllers.js` | Informasi internal ikut terkirim; sebaiknya pakai `select` eksplisit juga. |
| Sedang | Detail dan daftar laporan tidak mengembalikan `assignedToId`/`assignedTo`. | `services/reportServices.js` | UI admin tidak bisa menampilkan petugas yang sudah ditugaskan. |
| Sedang | Mahasiswa tidak punya tombol untuk membatalkan laporan PENDING. Tombolnya ada di `pages/ReportDetailPage.jsx`, yang tidak lagi dipakai routing. | frontend | Pembatalan hanya bisa dilakukan admin. `ReportDetailPage.jsx` dan `AdminReportDetailPage.jsx` adalah kode mati. |
| Sedang | Ekspor laporan CSV (`exportReportsCsv`) tidak dipanggil di UI. | `frontend/src/services/api.js` | Fitur hanya bisa dipakai lewat API. |
| Rendah | Kartu "Aktivitas Laporan" di halaman Profil mahasiswa selalu 0. | `pages/ProfilePage.jsx` | Informasi menyesatkan. |
| Rendah | Dasbor admin: kartu "Total Laporan" dan "Total Kategori" tidak cocok dengan grafik; respons `categories.deleted` bisa negatif. | `services/adminDashboardServices.js` | Angka dasbor membingungkan. |
| Rendah | Halaman Sistem & Keamanan menulis "MySQL", padahal database-nya PostgreSQL. | `pages/SystemSecurityPage.jsx` | Teks keliru. |
| Rendah | Kartu statistik di Manajemen Pengguna tampil sempit/terpotong pada lebar 1366 px. | `pages/admin/AdminUsersPage.jsx` | Tampilan. |
| Rendah | Beranda menampilkan angka statis (1.247 laporan, 94% kepuasan, 24h), nomor hotline dan email berbeda dengan footer, dan footer bertuliskan nama developer. | `pages/HomePage.jsx`, `components/footer.jsx` | Konten perlu dikonfirmasi kampus. |
| Rendah | Format respons belum seragam (lihat [api/README](api/README.md#konvensi-respons)); HTTP 201 dengan `statusCode` 200 di body, dan transisi ditolak HTTP 400 dengan `statusCode` 500. | beberapa controller | Klien harus memakai kode HTTP. |
| Rendah | Origin CORS Socket.IO memakai `FRONTEND_URL` utuh (tidak dipisah koma) dan daftar localhost statis. | `sockets/chatHandler.js` | Bermasalah bila frontend dan backend beda origin dengan beberapa domain. Tidak berdampak pada setup Nginx same-origin. |
| Rendah | `JWT_EXPIRES_IN` di `backend/.env.example` tidak dipakai; masa berlaku access token (15 menit) dan refresh token (7 hari) ditulis langsung di kode. | `services/authServices.js`, `controllers/authControllers.js` | Mengubah variabel tersebut tidak berpengaruh. |
| Rendah | Folder `WebsitePengaduanKemahasiswaan-clean/` (salinan lama, 292 berkas) ikut tersimpan di Git. | root repo | Membingungkan; aman dihapus. |
