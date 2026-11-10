# Frontend — Sistem Pengaduan Kemahasiswaan UBH

Aplikasi web untuk mahasiswa, admin, dan superadmin: React 19 (Vite), Material UI 7, Zustand, Axios, Socket.IO client, dan Recharts. Gambaran sistem, instalasi lengkap, dan variabel lingkungan ada di [README root](../README.md). Aturan kode frontend (penyimpanan token, pemanggilan API, label status, sanitasi HTML) ada di [DeveloperGuide bagian 4](../docs/DeveloperGuide.md#4-frontend).

## Menjalankan untuk pengembangan

Backend harus berjalan lebih dulu (lihat README root).

```bash
npm install
cp .env.example .env     # VITE_API_URL=http://localhost:6060/v1/api
npm run dev              # http://localhost:5173
```

Buka dengan `localhost`, bukan `127.0.0.1`, kecuali `FRONTEND_URL` di `backend/.env` juga memakai `127.0.0.1`; CORS mencocokkan origin persis.

## Perintah

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Server pengembangan Vite dengan hot-reload |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Menyajikan hasil build secara lokal |
| `npm run lint` | ESLint; CI menjalankan `npm run lint -- --max-warnings=0` |
| `npx vitest run --project unit` | Unit test (jsdom), tidak butuh browser |
| `npm run test:e2e:install` | Unduh Chromium Playwright ke `.playwright-browsers/` (sekali) |
| `npm run test:run` | Component test (Vitest Browser + Chromium); juga menjalankan unit test |
| `npm run test:e2e` | Playwright E2E; menyiapkan backend dan database uji otomatis lewat `tests/e2e/global-setup.js` (butuh Docker) |
| `npm run test:nginx` | Menjalankan `nginx.conf` di kontainer `nginx:alpine` dan memastikan unggahan hingga 55 MB diteruskan serta yang lebih besar ditolak 413 (butuh Docker) |

## Struktur singkat

| Folder | Isi |
| --- | --- |
| `src/pages/` | Halaman dan `routes.jsx`; halaman admin di `pages/admin/`; isi Pusat Bantuan di `pages/help/helpContent.js` |
| `src/components/` | Komponen per domain (`admin/`, `chat/`, `dashboard/`, `report/`, `auth/`, `ui/`) |
| `src/services/` | `axiosClient.js` (refresh token otomatis), pemanggil API, `socketService.js` |
| `src/stores/` | State global Zustand |
| `src/utils/` | `statusConfig.js`, `sanitizeHtml.js`, dan utilitas lain |
| `tests/` | `unit/`, `component/`, `e2e/` |

## Docker

`Dockerfile` membangun aplikasi lalu menyajikannya dengan Nginx. `nginx.conf` meneruskan `/v1/api`, `/api`, `/socket.io`, dan `/uploads` ke kontainer `backend`, sehingga browser hanya berbicara dengan satu origin.

Variabel `VITE_*` dibaca saat build dan dikirim sebagai build arg oleh `docker-compose*.yml`: `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_USER_MANUAL_URL`, dan `VITE_PRIVACY_POLICY_URL`. Mengubah nilainya memerlukan build ulang image. Deploy produksi mengikuti [`docs/ProductionRunbook.md`](../docs/ProductionRunbook.md).
