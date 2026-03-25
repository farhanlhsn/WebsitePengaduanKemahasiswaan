# 📢 Sistem Pelaporan dan Pengaduan Kemahasiswaan UBH

Sistem Pengaduan Kemahasiswaan Universitas Bung Hatta — platform digital yang memungkinkan mahasiswa menyampaikan laporan pengaduan terkait permasalahan akademik maupun non-akademik secara mudah, aman, dan transparan.

## 📖 Deskripsi

Website ini dirancang sebagai solusi digital untuk menjembatani komunikasi antara mahasiswa dan pihak kampus dalam menangani berbagai keluhan dan pengaduan. Mahasiswa dapat mengajukan laporan, melampirkan bukti, serta memantau progres penanganan secara real-time. Admin kampus dapat mengelola, menindaklanjuti, dan memantau seluruh pengaduan secara terpusat melalui dashboard yang komprehensif.

## 🏗️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React 19 (Vite), Material UI 7, Zustand, Socket.IO Client, Recharts |
| **Backend** | Node.js, Express.js 4, Prisma ORM 6, Socket.IO |
| **Database** | MySQL |
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
│   │   ├── middlewares/     # Auth, error handler, device tracking, dll.
│   │   ├── utils/           # Helper & utility functions
│   │   └── config/          # Konfigurasi aplikasi
│   ├── uploads/             # File lampiran yang diunggah
│   └── logs/                # Log file (Winston)
│
├── frontend/WebsitePengaduanKemahasiswaan/
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
│   └── index.html
│
└── README.md
```

## 👥 Peran Pengguna

| Peran | Deskripsi |
|---|---|
| **Mahasiswa** | Pengguna utama yang mendaftar, mengajukan pengaduan, memantau status, dan berdiskusi dengan admin |
| **Admin** | Petugas kampus yang memverifikasi akun, mengelola pengaduan, mengubah status laporan, dan memantau analitik |

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
- **Bulk Operations** — Aksi massal terhadap beberapa laporan sekaligus
- **Verifikasi Pengguna** — Verifikasi akun mahasiswa baru berdasarkan KTM
- **Manajemen Kategori** — CRUD kategori pengaduan
- **Audit Log** — Jejak audit untuk semua aksi penting (delete, restore, update status, verifikasi)
- **Analitik** — Statistik mendalam tentang tren pengaduan
- **Keamanan Sistem** — Manajemen sesi, device tracking, monitoring keamanan

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
| `/v1/api/bulk-operations` | Operasi massal |
| `/api/health` | Health check database |

## ⚙️ Instalasi & Menjalankan

### Prasyarat
- Node.js (v18+)
- MySQL
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
cd frontend/WebsitePengaduanKemahasiswaan

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
| `DATABASE_URL` | Connection string MySQL |
| `JWT_SECRET` | Secret key untuk access token |
| `JWT_REFRESH_SECRET` | Secret key untuk refresh token |
| `JWT_EXPIRES_IN` | Durasi expired access token (default: `1d`) |
| `UPLOAD_DIR` | Direktori penyimpanan file upload |
| `FILE_SIZE_LIMIT` | Batas ukuran file upload dalam MB |

## 🔒 Keamanan

- Autentikasi berbasis JWT dengan mekanisme refresh token
- Device fingerprinting & tracking untuk keamanan sesi
- Password hashing menggunakan bcryptjs
- Middleware validasi input (express-validator)
- CORS dikonfigurasi secara ketat
- Kompresi gambar otomatis saat upload (Sharp)
- Audit logging untuk akuntabilitas

## 🚀 Scripts

### Backend
| Script | Perintah |
|---|---|
| `npm run dev` | Jalankan server dengan hot-reload (nodemon) |
| `npm start` | Jalankan server production |
| `npm run seed` | Seed data kategori ke database |
| `npm run prisma:studio` | Buka Prisma Studio (GUI database) |
| `npm run prisma:migrate` | Jalankan migrasi database |

### Frontend
| Script | Perintah |
|---|---|
| `npm run dev` | Jalankan dev server Vite |
| `npm run build` | Build untuk production |
| `npm run preview` | Preview build production |
| `npm run lint` | Jalankan ESLint |

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan Computing Project di Universitas Bung Hatta.
