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
- **Pengajuan Laporan** — Buat pengaduan dengan judul, deskripsi, kategori, dan lampiran file; setiap laporan mendapat nomor registrasi unik
- **Dashboard Mahasiswa** — Lihat seluruh pengaduan beserta status terkini
- **Tracking Status** — Pantau progres: `PENDING` → `IN_REVIEW` → `IN_PROGRESS` → `RESOLVED` / `REJECTED` / `CANCELED`
- **Chat Real-time** — Diskusi langsung dengan admin per laporan (typing indicator, read receipt)
- **Profil & Pengaturan** — Kelola informasi akun dan preferensi
- **Halaman Bantuan** — Panduan lengkap penggunaan sistem

### Sisi Admin
- **Dashboard Admin** — Ringkasan statistik dan visualisasi data pengaduan (Recharts)
- **Manajemen Laporan** — Tindaklanjuti, ubah status, lihat detail & riwayat chat
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
| `/v1/api/users` | Manajemen pengguna |
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

## 🐳 Deployment (Docker)

### Local development

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:6060/v1/api |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

Frontend mem-proxy `/v1/api`, `/api`, dan `/socket.io` ke backend via nginx (same-origin).

### Production

```bash
export POSTGRES_PASSWORD='<strong-password>'
export SEED_SUPERADMIN_PASSWORD='<strong-password>'
docker compose -f docker-compose.prod.yml up --build -d
```

Kedua variabel di atas **wajib** — compose gagal start jika kosong (tidak ada default lemah).

Hanya reverse proxy/frontend (`PUBLIC_HTTP_PORT`, default `8080`) yang diekspos. Backend, PostgreSQL, dan Redis berada pada jaringan internal Docker.

## 🧪 Testing & Quality Gates

Semua gate berikut harus lulus sebelum merge/deploy:

```bash
cd backend && npm test -- --runInBand
cd backend && npm run test:integration
cd frontend && npm run lint -- --max-warnings=0
cd frontend && npm run test:run          # alias test:component
cd frontend && npm run build
cd frontend && npm run test:e2e
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
| Export CSV pengguna | — | ❌ | ✅ |
| Cleanup / permanent delete user | — | ❌ | ✅ |
| CRUD kategori | — | ❌ | ✅ |
| Lihat laporan | Milik sendiri | Kategori assignment | Semua |
| Dashboard statistik | Milik sendiri | Scoped kategori + metadata `scope` | Global |

Admin tanpa assignment kategori melihat daftar kosong. Superadmin terakhir tidak dapat dihapus/didemosi (dilindungi advisory lock terhadap request konkuren).

## ⚙️ Instalasi & Menjalankan

### Prasyarat
- Node.js (v18+, disarankan v20+)
- PostgreSQL (v15+, disarankan v16)
- npm atau yarn

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

# Seed data kategori
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

# Jalankan development server
npm run dev
```

Frontend berjalan di `http://localhost:5173` (default Vite).

### Environment Variables (Backend)

| Variable | Deskripsi |
|---|---|
| `PORT` | Port server backend (default: `6060`) |
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Secret key untuk access token |
| `JWT_REFRESH_SECRET` | Secret key untuk refresh token |
| `FRONTEND_URL` | URL frontend yang diizinkan CORS |
| `REDIS_URL` | URL Redis untuk rate limit store (wajib production; override `ALLOW_IN_MEMORY_RATE_LIMIT=true` untuk dev) |
| `TRUST_PROXY` | Hop count / CIDR proxy untuk `X-Forwarded-For` (production: `1`) |
| `ALLOW_IN_MEMORY_RATE_LIMIT` | Set `true` untuk dev/test tanpa Redis |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Konfigurasi email notifikasi/reset password |
| `SEED_SUPERADMIN_EMAIL`, `SEED_SUPERADMIN_NAME`, `SEED_SUPERADMIN_PASSWORD` | Bootstrap akun superadmin saat seed |

### Environment Variables (Frontend)

| Variable | Deskripsi |
|---|---|
| `VITE_API_URL` | Base URL API, contoh `http://localhost:6060/v1/api` |
| `VITE_SOCKET_URL` | Base URL Socket.IO jika berbeda dari API |
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

> **Catatan:** Read receipt chat menggunakan flag `isRead` tunggal per pesan (bukan per-user).

## 🚀 Scripts

### Backend
| Script | Perintah |
|---|---|
| `npm run dev` | Jalankan server dengan hot-reload (nodemon) |
| `npm start` | Jalankan server production |
| `npm run seed` | Seed data kategori ke database |
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

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan Computing Project di Universitas Bung Hatta.
