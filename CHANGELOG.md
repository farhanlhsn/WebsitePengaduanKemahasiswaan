# Changelog

Semua perubahan penting pada Sistem Pengaduan Kemahasiswaan UBH dicatat di sini, terbaru di atas. Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/). Proyek belum memakai tag versi, jadi setiap rilis ditandai dengan tanggal dan nomor pull request.

Tambahkan entri di bagian **Belum dirilis** setiap kali menggabungkan perubahan yang terlihat oleh pengguna, admin, atau tim operasional.

## Belum dirilis

### Ditambahkan
- Dokumentasi OpenAPI lengkap untuk 85 endpoint REST (`backend/src/docs/openapi/*.yaml`), dengan contoh request/response dari API asli.
- Berkas statis `docs/api/openapi.json` dan skrip `npm run docs:openapi` untuk membuatnya ulang.
- `docs/api/README.md` (konvensi API, paginasi, rate limit, unggah berkas) dan `docs/api/SocketEvents.md` (event Socket.IO chat).
- `docs/DeveloperGuide.md` dan berkas changelog ini.

### Diubah
- Anotasi `@swagger` dipindahkan dari file route dan `app.js` ke file YAML per modul; `config/swagger.js` kini hanya membaca folder `src/docs/openapi/`.

## 2026-08-16 — Pelengkapan fitur dan remediasi audit (PR #5–#8)

### Ditambahkan
- Tanda dibaca (read receipt) per pengguna lewat tabel `message_reads`: satu admin membaca pesan tidak lagi menghapus status belum dibaca bagi admin lain.
- Alasan penolakan/pembatalan disimpan di laporan (`rejectedReason`, `canceledReason`) dan ditampilkan ke pelapor.
- Preferensi pengguna (tema, bahasa, notifikasi) tersimpan per akun (`GET/PUT /users/preferences/me`).
- UI untuk menugaskan laporan ke admin, mengubah prioritas, filter "ditugaskan kepada saya", dan edit laporan PENDING oleh pelapor.
- Chat: indikator mengetik, badge pesan belum dibaca, tombol "Pesan baru".
- Konfigurasi tombol SSO opsional di frontend (`VITE_ENABLE_SSO`); backend SSO belum diimplementasikan.
- Pemusatan label dan warna status di `frontend/src/utils/statusConfig.js`.
- E2E tes governance (anonimitas API, guard superadmin terakhir, akses laporan tanpa autentikasi).

### Keamanan
- Mass-assignment: update pengguna hanya menerima `name`, `email`, `nim`.
- Operasi massal divalidasi per item (governance, cakupan kategori, state machine, alasan wajib, maksimal 100 item).
- Anonimitas pelapor dijaga di event Socket.IO (pseudonim `reporter`) dan endpoint direktori pengguna.
- Tidak lagi mempercayai `X-Forwarded-For` mentah untuk IP rate limit.
- Update status bersyarat (mencegah perubahan bersamaan), guard superadmin terakhir dengan advisory lock PostgreSQL, KTM wajib saat registrasi dan verifikasi, ganti email wajib password lama.
- Compose produksi menolak start tanpa `POSTGRES_PASSWORD` dan `SEED_SUPERADMIN_PASSWORD`; dependensi dengan kerentanan high/critical diperbarui.

### Diperbaiki
- Demote superadmin selalu gagal (`Failed to deserialize column of type void`) karena `pg_advisory_xact_lock` dipanggil lewat `$queryRaw`.
- Gate audit `VIEW_ANONYMOUS` kini memakai Redis bila tersedia (konsisten di banyak instance).

## 2026-06-07 s.d. 2026-07-04 — Hardening dan persiapan produksi

### Ditambahkan
- Migrasi Prisma lengkap, bootstrap E2E, serta unit test dan integration test backend.
- Docker Compose development dan produksi, pipeline CI (Gitleaks, audit, test, lint, build, E2E).
- Notifikasi email (SMTP) untuk perubahan status, verifikasi akun, dan pesan chat saat pengguna offline.
- Halaman verifikasi pengguna dan penolakan pendaftaran dengan alasan; manajemen pengguna; manajemen kategori; `AdminDataTable`.
- Store autentikasi Zustand; refresh token single-flight.
- Dokumen UAT dan Production Runbook.

### Keamanan
- Refresh token disimpan sebagai hash SHA-256 dan dirotasi; deteksi pemakaian ulang. **Migrasi `20260607130000_token_hash_migration` membuat semua sesi lama tidak berlaku.**
- Unggahan chat terikat ke laporan (`chat_pending_uploads`), pesan idempoten lewat `clientMessageId`.
- Hardening autentikasi, RBAC, unggahan, dan siklus sesi.

### Diperbaiki
- Tampilan responsif halaman admin (pengaturan, keamanan, verifikasi, analitik) dan sidebar.
- Batas berkas laporan, unggah berkas chat, dasbor kosong, pesan error registrasi, gambar lintas origin yang membutuhkan autentikasi.

## 2026-03-25 s.d. 2026-05-13 — Fitur inti (PR #1–#4)

### Ditambahkan
- Dasbor admin, audit log, chat per laporan, dan operasi massal.
- Peralihan database ke PostgreSQL.
- Helmet, rate limiting global, dan akses berkas unggahan yang membutuhkan autentikasi.
- Prioritas laporan, reset password, laporan anonim, penugasan laporan, peran SUPERADMIN, dan penugasan kategori per admin (migrasi `20260519*`–`20260527*`).
- Balasan pesan (reply) dan `tokenVersion` untuk mencabut sesi.
- Sidebar mahasiswa yang dapat diciutkan, manajemen perangkat, dan halaman analitik.

## 2025-06-22 s.d. 2025-06-30 — Prototipe awal

### Ditambahkan
- Kerangka frontend React (Vite, MUI, Tailwind) dan backend Express.
- Tabel laporan responsif, editor teks kaya, dan dasbor admin awal.
- Kompresi respons serta endpoint statistik laporan dan pengguna.
