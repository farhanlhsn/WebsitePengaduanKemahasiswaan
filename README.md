# 📢 Sistem Pelaporan dan Pengaduan Kemahasiswaan UBH

Sistem Pengaduan Kemahasiswaan Universitas Bung Hatta — platform digital yang memungkinkan mahasiswa menyampaikan laporan pengaduan terkait permasalahan akademik maupun non-akademik secara mudah, aman, dan transparan.

## 📖 Deskripsi

Website ini dirancang sebagai solusi digital untuk menjembatani komunikasi antara mahasiswa dan pihak kampus dalam menangani berbagai keluhan dan pengaduan. Mahasiswa dapat mengajukan laporan, melampirkan bukti, serta memantau progres penanganan secara real-time. Admin kampus dapat mengelola, menindaklanjuti, dan memantau seluruh pengaduan secara terpusat melalui dashboard yang komprehensif.

## 🏗️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React 19 (Vite), Material UI 7, Zustand, Socket.IO Client, Recharts |
| **Backend** | Node.js, Express.js 4, Prisma ORM 6, Socket.IO |
| **Database** | PostgreSQL 16+ |
| **Auth** | JWT (Access Token + Refresh Token), bcryptjs |
| **File Upload** | Multer, Sharp (kompresi gambar) |
| **Logging** | Winston, Morgan |
| **Styling** | TailwindCSS 3, Emotion |

## 📁 Struktur Proyek

```
WebsitePengaduanKemahasiswaan/
├── backend/
│   ├── prisma/              # Schema database & migrations
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   ├── src/
│   │   ├── app.js           # Setup Express & Socket.IO
│   │   ├── server.js         # Entry point
│   │   ├── controllers/     # Logic handler (auth, report, chat, dll.)
│   │   ├── routes/          # Endpoint API
│   │   ├── services/        # Business logic layer
│   │   ├── middlewares/     # Auth, error handler, rate limiter, device tracking, dll.
│   │   ├── sockets/         # Handler Socket.IO (chat real-time)
│   │   ├── jobs/            # Scheduled jobs (cleanup)
│   │   ├── utils/           # Helper & utility functions
│   │   └── config/          # Konfigurasi aplikasi
│   ├── tests/               # Unit & integration tests (Jest)
│   ├── scripts/             # Script operasional (seed e2e, rotate secrets)
│   ├── uploads/             # File lampiran yang diunggah
│   └── logs/                # Log file (Winston)
│
├── frontend/
│   ├── public/              # Aset statis
│   ├── src/
│   │   ├── main.jsx         # Entry point React
│   │   ├── theme.jsx        # Konfigurasi tema MUI
│   │   ├── pages/           # Halaman-halaman aplikasi
│   │   ├── components/      # Komponen reusable
│   │   │   ├── admin/       # Komponen khusus admin
│   │   │   ├── chat/        # Komponen chat
│   │   │   ├── dashboard/   # Komponen dashboard
│   │   │   └── ui/          # Komponen UI umum
│   │   ├── services/        # API service layer
│   │   ├── stores/          # State management (Zustand)
│   │   └── utils/           # Utility functions
│   ├── tests/               # Component tests (Vitest) & E2E (Playwright)
│   └── index.html
│
├── docs/                    # Dokumen proyek (SRS, SDD, runbook, plan)
├── docker-compose.yml       # Deployment development
├── docker-compose.prod.yml  # Deployment production
└── README.md
```

## 👥 Peran Pengguna

| Peran | Deskripsi |
|---|---|
| **Mahasiswa** | Mendaftar, mengajukan pengaduan (termasuk anonim), memantau status, dan berdiskusi dengan admin |
| **Admin** | Scoped per kategori via assignment; verifikasi akun, kelola pengaduan, chat, dan analitik |
| **SuperAdmin** | Akses penuh; kelola admin, kategori, assignment, audit log, dan governance |

## ✨ Fitur

### Sisi Mahasiswa
- **Registrasi & Login** — Daftar akun dengan upload KTM untuk verifikasi identitas, autentikasi JWT
- **Pengajuan Laporan** — Buat pengaduan dengan judul, deskripsi, kategori, dan lampiran file; setiap laporan mendapat nomor registrasi unik; laporan berstatus PENDING dapat diedit kembali oleh pelapor
- **Dashboard Mahasiswa** — Lihat seluruh pengaduan beserta status terkini
- **Tracking Status** — Pantau progres: `PENDING` → `IN_REVIEW` → `IN_PROGRESS` → `RESOLVED` / `REJECTED` / `CANCELED`
- **Chat Real-time** — Diskusi langsung dengan admin per laporan (typing indicator, read receipt per-user, unread count)
- **Profil & Pengaturan** — Kelola informasi akun dan preferensi (tema, bahasa, notifikasi) yang tersinkron per akun
- **Halaman Bantuan** — Panduan lengkap penggunaan sistem

### Sisi Admin
- **Dashboard Admin** — Ringkasan statistik dan visualisasi data pengaduan (Recharts)
- **Manajemen Laporan** — Tindaklanjuti, ubah status (dengan alasan), atur prioritas & petugas (assign), lihat detail & riwayat chat; filter "ditugaskan kepada saya"
- **Bulk Operations** — Aksi massal untuk laporan (ubah status, hapus, restore), pengguna (verifikasi, hapus, restore), dan kategori; tervalidasi per-item sesuai scope
- **Verifikasi Pengguna** — Verifikasi akun mahasiswa baru berdasarkan KTM
- **Manajemen Kategori** — CRUD kategori pengaduan
- **Admin Governance** — Promote/demote admin, grant/revoke assignment kategori (SuperAdmin)
- **Laporan Anonim** — Identitas pelapor disembunyikan dari semua pihak termasuk admin
- **Export CSV** — Export data laporan dan pengguna
- **Audit Log** — Jejak audit untuk semua aksi penting
- **Analitik** — Statistik mendalam tentang tren pengaduan
- **Keamanan Sistem** — Manajemen sesi, device tracking, monitoring keamanan
- **Password Reset** — Reset password via email

### Kategori Pengaduan
Sistem menyediakan 23 kategori bawaan, antara lain: Kekerasan Seksual, Sarana dan Prasarana, Pelanggaran Kode Etik, Akademik, Administrasi, Keuangan, Diskriminasi, Penyalahgunaan Wewenang Dosen/Staff, Keamanan Kampus, dan lainnya.

## 🔌 API Endpoints

| Prefix | Modul |
|---|---|
| `/v1/api/auth` | Autentikasi (login, register, refresh token, logout) |
| `/v1/api/users` | Manajemen pengguna + preferensi (`/users/preferences/me`) |
| `/v1/api/categories` | Manajemen kategori pengaduan |
| `/v1/api/reports` | CRUD laporan pengaduan |
| `/v1/api/chat` | Pesan/chat per laporan |
| `/v1/api/audit-logs` | Log audit |
| `/v1/api/admin` | Dashboard admin |
| `/v1/api/admin-governance` | Governance admin: promote/demote, grant/revoke assignment (SuperAdmin) |
| `/v1/api/bulk-operations` | Operasi massal |
| `/api/health/live` | Liveness probe |
| `/api/health/ready` | Readiness probe (DB + Redis reachable) |
| `/api/docs` | Swagger API documentation (non-production) |

Referensi lengkap 85 endpoint (parameter, body, contoh respons, hak akses) ada di Swagger UI dan di [`docs/api/openapi.json`](docs/api/openapi.json). Konvensi, paginasi, dan rate limit dijelaskan di [`docs/api/README.md`](docs/api/README.md); event chat real-time di [`docs/api/SocketEvents.md`](docs/api/SocketEvents.md).

## 📚 Dokumentasi

| Dokumen | Untuk |
|---|---|
| [`docs/SerahTerima.md`](docs/SerahTerima.md) | Pihak kampus: ringkasan sistem, deploy, keamanan, keterbatasan, checklist serah terima |
| [`docs/UserManual.md`](docs/UserManual.md) | Mahasiswa, admin, superadmin: panduan pemakaian bergambar |
| [`docs/RevisiSRS-SDD.md`](docs/RevisiSRS-SDD.md) | Tim proyek: bagian SRS/SDD yang perlu diperbarui |
| [`docs/DeveloperGuide.md`](docs/DeveloperGuide.md) | Developer: struktur kode, cara menambah endpoint/migrasi, pengujian, bug yang diketahui |
| [`docs/api/`](docs/api/README.md) | Referensi API REST (OpenAPI) dan Socket.IO |
| [`docs/ProductionRunbook.md`](docs/ProductionRunbook.md) | Tim operasional: **acuan utama** deploy produksi, pembaruan, rollback, backup/restore, monitoring |
| [`docs/UserAcceptanceTest.md`](docs/UserAcceptanceTest.md) | Skenario UAT |
| [`CHANGELOG.md`](CHANGELOG.md) | Riwayat perubahan |
| `docs/*.pdf` | Proposal, SRS, SDD, dan laporan akhir Computing Project |

## 🐳 Deployment (Docker)

### Local development

```bash
cp backend/.env.example backend/.env             # wajib ada; nilai contoh cukup untuk development
docker compose up --build                        # db, redis, migrasi, backend, frontend
docker compose exec backend npm run seed         # sekali: 23 kategori + superadmin pertama
```

Login superadmin memakai `SEED_SUPERADMIN_EMAIL` dan `SEED_SUPERADMIN_PASSWORD` dari `backend/.env`. Kosongkan `SMTP_HOST` di `backend/.env` bila tidak ingin mencoba mengirim email.

| Service | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:6060/v1/api |
| Swagger UI | http://localhost:6060/api/docs |
| PostgreSQL | localhost:5432 (user/password `postgres`) |
| Redis | localhost:6379 |

Frontend mem-proxy `/v1/api`, `/api`, `/socket.io`, dan `/uploads` ke backend via nginx (same-origin). Compose development memakai password database `postgres` dan membuka semua port, jadi **jangan dipakai di produksi**.

### Production

Ikuti [`docs/ProductionRunbook.md`](docs/ProductionRunbook.md). Ringkasnya:

```bash
cp .env.example .env                  # FRONTEND_URL, POSTGRES_PASSWORD, SEED_SUPERADMIN_PASSWORD, ...
cp backend/.env.example backend/.env  # JWT_SECRET, JWT_REFRESH_SECRET (openssl rand -hex 64), SMTP_*
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend npm run seed   # sekali
```

Hanya kontainer frontend (Nginx) yang membuka port ke host (`PUBLIC_HTTP_PORT`, default `8085`); di depannya wajib ada reverse proxy HTTPS. Backend, PostgreSQL, dan Redis berada di jaringan internal Docker.

## 🧪 Testing & Quality Gates

Semua gate berikut harus lulus sebelum merge/deploy:

```bash
cd backend && npm test -- --runInBand
cd backend && npm run test:integration
cd frontend && npm run lint -- --max-warnings=0
cd frontend && npm run test:run          # alias test:component
cd frontend && npm run build
cd frontend && npm run test:e2e
cd frontend && npm run test:nginx        # batas unggah Nginx (butuh Docker)
docker compose config
docker compose build
docker compose -f docker-compose.prod.yml config
```

Integration test membutuhkan Docker (Postgres test container) atau `TEST_DATABASE_URL`. E2E bootstrap otomatis via `frontend/tests/e2e/global-setup.js`.

## 📤 Aturan Upload

| Konteks | Format diizinkan | Batas |
|---|---|---|
| **KTM** (registrasi) | JPEG, PNG, WebP | 5 MB |
| **Lampiran laporan & chat** | JPEG, PNG, WebP, PDF, DOC, DOCX | 5 MB/file |

Validasi MIME, ekstensi, dan magic bytes. Nama file disimpan acak; nama asli disanitasi sebagai metadata. Path `/uploads/chat-pending` tidak dapat diakses langsung — file dipromosikan ke `/uploads/chat/attachments/` saat pesan terkirim. Path upload tidak dikenal ditolak (404).

## 🛡️ Governance & Scoping

| Aksi | Mahasiswa | Admin | SuperAdmin |
|---|---|---|---|
| Kelola mahasiswa (verify/reject/delete) | — | ✅ | ✅ |
| Kelola admin tier | — | ❌ | ✅ |
| Bulk ops user (verify/delete/restore) | — | ✅ (hanya target MAHASISWA, per-item) | ✅ |
| Bulk ops kategori | — | ❌ | ✅ |
| Export CSV pengguna lewat API (`/admin/export/users`) | — | ❌ (tombol Ekspor di UI mengunduh daftar yang sedang tampil) | ✅ |
| Cleanup / permanent delete user | — | ❌ | ✅ |
| CRUD kategori | — | ❌ | ✅ |
| Lihat laporan | Milik sendiri | Kategori assignment | Semua |
| Dashboard statistik | Milik sendiri | Scoped kategori + metadata `scope` | Global |

Admin tanpa assignment kategori melihat daftar kosong. Superadmin terakhir tidak dapat dihapus/didemosi (dilindungi advisory lock terhadap request konkuren).

## ⚙️ Instalasi & Menjalankan

Cara manual dipakai bila ingin mengubah kode dengan hot-reload.

### Prasyarat
- Node.js 22 LTS, minimal 22.23.4 (versi persisnya ada di `.nvmrc`; jalankan `nvm use`) dan npm
- PostgreSQL 16
- Redis 7, atau set `ALLOW_IN_MEMORY_RATE_LIMIT=true` di `backend/.env` untuk development tanpa Redis

### Backend

```bash
# Masuk ke direktori backend
cd backend

# Install dependencies
npm install

# Konfigurasi environment variables
cp .env.example .env
# Edit .env sesuai konfigurasi lokal (DATABASE_URL, JWT_SECRET, dll.)

# Generate Prisma Client
npx prisma generate

# Jalankan migrasi database
npx prisma migrate dev

# Seed 23 kategori bawaan + superadmin pertama (dari SEED_SUPERADMIN_*)
npm run seed

# Jalankan server (development)
npm run dev
```

Backend berjalan di `http://localhost:6060` (default).

### Frontend

```bash
# Masuk ke direktori frontend
cd frontend

# Install dependencies
npm install

# Konfigurasi environment variables (VITE_API_URL=http://localhost:6060/v1/api)
cp .env.example .env

# Jalankan development server
npm run dev
```

Frontend berjalan di `http://localhost:5173` (default Vite). Buka dengan host yang sama seperti `FRONTEND_URL` di `backend/.env` (`localhost`, bukan `127.0.0.1`), karena CORS mencocokkan origin persis.

### Environment Variables (Backend)

Tabel ini adalah referensi lengkap variabel backend. Untuk produksi, lihat juga pembagian berkas `.env` di [Runbook bagian 3](docs/ProductionRunbook.md#3-konfigurasi).

| Variable | Wajib | Deskripsi |
|---|---|---|
| `DATABASE_URL` | Ya | Connection string PostgreSQL |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Ya | Minimal 32 karakter dan bukan nilai contoh; backend menolak start di produksi bila lemah. Buat dengan `openssl rand -hex 64` |
| `FRONTEND_URL` | Produksi | Origin frontend untuk CORS dan tautan di email; boleh beberapa, dipisah koma (default `http://localhost:5173`) |
| `REDIS_URL` | Produksi | Penyimpanan rate limit. Di development bisa diganti `ALLOW_IN_MEMORY_RATE_LIMIT=true` |
| `PORT`, `NODE_ENV` | Tidak | Default `6060` dan `development` |
| `TRUST_PROXY` | Produksi | Jumlah proxy di depan backend, untuk membaca IP klien dari `X-Forwarded-For`. Compose produksi memakai `2` (proxy HTTPS kampus + Nginx frontend) |
| `ALLOW_IN_MEMORY_RATE_LIMIT` | Tidak | `true` untuk dev/test tanpa Redis |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Tidak | Email reset password dan notifikasi; tanpa `SMTP_HOST`/`SMTP_USER` email dimatikan |
| `ALLOWED_EMAIL_DOMAINS` | Tidak | Batasi domain email pendaftar, mis. `mahasiswa.bunghatta.ac.id` (kosong = semua domain) |
| `SEED_SUPERADMIN_EMAIL`, `SEED_SUPERADMIN_NAME`, `SEED_SUPERADMIN_PASSWORD` | Saat seed | Superadmin pertama, dibuat hanya bila belum ada superadmin. Di produksi password minimal 12 karakter |
| `ENABLE_SWAGGER` | Tidak | `true` mengaktifkan Swagger UI di produksi (di luar produksi selalu aktif) |
| `LOG_LEVEL` | Tidak | Default `info` |
| `TZ` | Tidak | Zona waktu job pembersihan 03.00, default `Asia/Jakarta` |
| `GEOLOCATION_TEST_MODE` | Tidak | `true` agar login dari IP lokal tetap dicari lokasinya (hanya untuk pengujian) |

`JWT_EXPIRES_IN`, `UPLOAD_DIR`, dan `FILE_SIZE_LIMIT` di `backend/.env.example` tidak dibaca kode; masa berlaku token dan batas unggah ditulis langsung di kode.

### Environment Variables (Frontend)

Semua variabel `VITE_*` dibaca saat **build**. Di Docker, nilainya dikirim sebagai build arg dari `.env` root; mengubahnya memerlukan build ulang image frontend.

| Variable | Deskripsi |
|---|---|
| `VITE_API_URL` | Base URL API, contoh `http://localhost:6060/v1/api` (di Docker: `/v1/api`) |
| `VITE_SOCKET_URL` | Base URL Socket.IO jika berbeda dari API |
| `VITE_USER_MANUAL_URL` | Tautan "Panduan Pengguna" di Pusat Bantuan (http(s) atau path `/...`); kosong = disembunyikan |
| `VITE_PRIVACY_POLICY_URL` | Tautan "Kebijakan Privasi" di Pusat Bantuan; kosong = disembunyikan |
| `VITE_ENABLE_SSO` | Tampilkan tombol SSO di login/register (`true`/`false`; backend SSO belum tersedia — biarkan `false`) |
| `VITE_SSO_PROVIDER`, `VITE_SSO_PROVIDER_NAME` | Provider & label tombol SSO (hanya relevan bila SSO aktif) |

## 🔒 Keamanan

- Autentikasi berbasis JWT dengan mekanisme refresh token + `tokenVersion` revocation; algoritma di-pin ke `HS256`
- Refresh token: rotasi tiap pemakaian, deteksi reuse (reuse → cabut semua token device tersebut), disimpan sebagai hash SHA-256 di DB, cookie `httpOnly` + `SameSite=Strict`
- RBAC 3-tier (Mahasiswa / Admin / SuperAdmin) dengan category assignment
- Chat access policy: `canAccessReport()` di REST dan Socket.IO (revalidasi per event)
- Anonimitas pelapor: identitas disembunyikan bahkan dari SuperAdmin — di REST, Socket.IO (event typing/join/leave/read memakai pseudonim `reporter`), export CSV, dan audit log
- Proteksi mass-assignment: update user hanya menerima whitelist field (`name/email/nim`); perubahan role/password melalui endpoint khusus
- Bulk operations tervalidasi per-item: governance policy untuk user ops, scoping kategori assignment untuk report ops, state machine + alasan wajib untuk REJECTED/CANCELED, limit 100 item
- Transisi status laporan atomik (conditional update) dengan state machine terpusat; guard "superadmin terakhir" memakai advisory lock PostgreSQL
- Registrasi wajib upload KTM (validasi MIME + magic bytes); verifikasi akun menolak tanpa KTM; ganti email butuh password lama + invalidasi semua sesi
- Upload chat scoped ke report (`ChatPendingUpload` + token binding); pesan idempoten via `clientMessageId`
- Device fingerprinting & tracking untuk keamanan sesi
- Rate limiting global + granular per endpoint (Redis-backed; IP dihitung via `trust proxy`, bukan header mentah)
- Password hashing menggunakan bcryptjs; password policy saat registrasi/reset
- Sanitasi input: allowlist `sanitize-html` di server + DOMPurify di client
- CORS dikonfigurasi secara ketat; Helmet + CSP & HSTS di production
- Kompresi gambar otomatis saat upload (Sharp)
- Audit logging untuk akuntabilitas (termasuk aksi governance, change password, cleanup)
- Password reset via email: token acak 32-byte di-hash, kedaluwarsa 1 jam, sekali pakai, anti-enumerasi
- Dependency audit bersih (0 known vulnerability)
- Read receipt chat **per-user** (model `MessageRead`) — satu admin membaca tidak lagi menghilangkan unread untuk admin lain
- Preferensi pengguna (tema, bahasa, notifikasi) tersimpan per akun di backend (`GET/PUT /users/preferences/me`), bukan hanya localStorage
- Alasan penolakan/pembatalan laporan tersimpan di laporan (`rejectedReason`/`canceledReason`) dan ditampilkan ke pelapor

## 🚀 Scripts

### Backend
| Script | Perintah |
|---|---|
| `npm run dev` | Jalankan server dengan hot-reload (nodemon) |
| `npm start` | Jalankan server production |
| `npm run seed` | Seed 23 kategori bawaan + superadmin pertama (idempoten) |
| `npm run rotate-secrets` | Cetak nilai acak baru untuk `JWT_SECRET` dan `JWT_REFRESH_SECRET` |
| `npm run docs:openapi` | Ekspor ulang `docs/api/openapi.json` dari `src/docs/openapi/*.yaml` |
| `npm test` | Jalankan unit test backend |
| `npm run test:integration` | Jalankan integration test backend (butuh Docker) |
| `npm run test:integration:up` | Start Postgres test container |
| `npm run test:integration:down` | Stop Postgres test container |
| `npm run prisma:studio` | Buka Prisma Studio (GUI database) |
| `npm run prisma:migrate` | Jalankan migrasi database |

### Frontend
| Script | Perintah |
|---|---|
| `npm run dev` | Jalankan dev server Vite |
| `npm run build` | Build untuk production |
| `npm run preview` | Preview build production |
| `npm run lint` | Jalankan ESLint (`--max-warnings=0` di CI) |
| `npm run test:run` | Alias component tests (Vitest) |
| `npm run test:component` | Jalankan component tests (Vitest Browser) |
| `npm run test:e2e` | Jalankan Playwright E2E (bootstrap otomatis) |
| `npm run test:nginx` | Uji batas unggah Nginx kontainer frontend (butuh Docker) |

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan Computing Project di Universitas Bung Hatta.
