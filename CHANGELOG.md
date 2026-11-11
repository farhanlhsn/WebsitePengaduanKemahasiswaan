# Changelog

Semua perubahan penting pada Sistem Pengaduan Kemahasiswaan UBH dicatat di sini, terbaru di atas. Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/). Proyek belum memakai tag versi, jadi setiap rilis ditandai dengan tanggal dan nomor pull request.

Tambahkan entri di bagian **Belum dirilis** setiap kali menggabungkan perubahan yang terlihat oleh pengguna, admin, atau tim operasional.

## Belum dirilis

### Keamanan
- Dependensi diperbarui karena advisory yang terbit 18–30 Oktober 2026 menggagalkan `npm audit` di CI. Semuanya versi patch atau minor. Backend: `multer` 2.4.0 → 2.5.0 (DoS lewat unggahan), `body-parser` 1.20.8 → 1.20.9 (DoS lewat badan permintaan terkompresi), `follow-redirects` 1.16.0 → 1.16.3 (header kredensial ikut saat redirect), `nodemailer` 10.0.16 → 10.4.0 (parser alamat email), `sanitize-html` 2.18.0 → 2.18.1, `qs`, `ip-address`. Frontend: `dompurify` 3.4.16 → 3.4.17 dan `follow-redirects` 1.16.3; dependensi dev `vite` 6.4.6, `vitest` 4.1.12, `sharp` 0.35.5, dan lainnya.
- `npm audit --omit=dev` kini bersih di backend dan frontend. Sisa 18 temuan low/moderate di dependensi dev backend (rantai Jest) hanya bisa diperbaiki dengan versi mayor.
- Runtime Node.js dinaikkan dari 20 ke 26 LTS ("Lithium", didukung sampai 30 April 2029) di Dockerfile backend/frontend dan CI, lewat Node 22 di PR #16. Node 20 sudah end-of-life sejak 30 April 2026 dan tidak lagi menerima patch keamanan, sementara `sanitize-html` ≥ 2.18 mensyaratkan Node ≥ 22.12. Versinya dikunci ke 26.13.0 di `.nvmrc`, `engines` di `package.json` (`>=26.13.0`), dan tag image Docker `node:26.13.0-alpine`; CI membaca `.nvmrc`. Developer perlu Node 26 secara lokal (`nvm install && nvm use`).

### Ditambahkan
- Draf kebijakan privasi, SOP penanganan pengaduan, dan kebijakan retensi data di `docs/kebijakan/`, disusun dari perilaku sistem yang sebenarnya. Isian bertanda `[ISI: ...]` (penanggung jawab data, target waktu, unit eskalasi, masa simpan) harus dilengkapi dan disahkan kampus sebelum berlaku.
- Dokumentasi OpenAPI lengkap untuk 85 endpoint REST (`backend/src/docs/openapi/*.yaml`), dengan contoh request/response dari API asli.
- Berkas statis `docs/api/openapi.json` dan skrip `npm run docs:openapi` untuk membuatnya ulang.
- `docs/api/README.md` (konvensi API, paginasi, rate limit, unggah berkas) dan `docs/api/SocketEvents.md` (event Socket.IO chat).
- `docs/DeveloperGuide.md` dan berkas changelog ini.
- Pusat Bantuan admin kini punya FAQ dan panduan cepat sendiri (verifikasi, status laporan, penugasan kategori, anonimitas, tugas superadmin); sebelumnya admin melihat FAQ mahasiswa.
- Pusat Bantuan menampilkan tautan **Panduan Pengguna** dan **Kebijakan Privasi** bila `VITE_USER_MANUAL_URL` / `VITE_PRIVACY_POLICY_URL` diisi (build arg di kedua berkas compose).
- Diagram ERD (mermaid) dan peta dokumentasi di `docs/DeveloperGuide.md`; README untuk `docs/superpowers/`.

### Diubah
- Anotasi `@swagger` dipindahkan dari file route dan `app.js` ke file YAML per modul; `config/swagger.js` kini hanya membaca folder `src/docs/openapi/`.
- Dokumen serah terima, user manual bergambar, dan daftar revisi SRS/SDD ditambahkan di `docs/`.
- `docs/ProductionRunbook.md` ditulis ulang sebagai acuan utama deploy: pembagian `.env` root dan `backend/.env`, reverse proxy yang meneruskan ke `PUBLIC_HTTP_PORT`, `TRUST_PROXY`, rollback lewat commit, backup/restore lewat `docker compose exec -T`, rotasi rahasia, dan kontak eskalasi. README dan `docs/SerahTerima.md` kini meringkas dan merujuk ke runbook. Langkah pembaruan memakai `build --pull` agar image dasar ikut mendapat patch keamanan.
- README: langkah Docker development (buat `backend/.env`, seed), port produksi `8085`, prasyarat Node.js 26 dan Redis, tabel variabel lingkungan lengkap.
- `frontend/README.md` diganti dari template Vite menjadi panduan frontend proyek.
- Isi Pusat Bantuan mahasiswa dipindah ke `frontend/src/pages/help/helpContent.js` dan diselaraskan dengan User Manual.

### Diperbaiki
- Pusat Bantuan mahasiswa tidak lagi menyebut kolom "fakultas", verifikasi email, janji tanggapan 24 jam, atau kebijakan privasi yang belum ada; ditambah tanya jawab laporan anonim, status, edit/batal, dan sesi perangkat.
- Formulir "Kirim Tiket Bantuan" yang hanya menampilkan pesan terkirim tanpa mengirim apa pun diganti tombol email ke Bagian Kemahasiswaan; tautan "Buku Panduan", "Kebijakan Privasi", dan "Laporkan Bug" yang tidak mengarah ke mana pun dihapus.
- Tautan WhatsApp di Pusat Bantuan kini sesuai nomor yang ditampilkan.
- Runbook lama berisi langkah yang tidak berjalan: `export JWT_SECRET`/`TRUST_PROXY` di shell (tidak dibaca compose), contoh reverse proxy ke `backend:6060` (jaringan internal), rollback `docker compose pull` (tidak ada registry), dan `pg_dump -h` (database tidak dibuka keluar).
- Healthcheck kontainer frontend selalu `unhealthy` setelah image dibangun dengan `nginx:alpine` terbaru (Alpine 3.24): `wget` mencoba `localhost` lewat IPv6 (`::1`), sedangkan `frontend/nginx.conf` hanya mendengarkan IPv4. Healthcheck kini memanggil `127.0.0.1`.
- Unggahan di atas 1 MB (misalnya PDF 3 MB atau beberapa foto sekaligus) ditolak HTTP 413 saat aplikasi berjalan di Docker/produksi, karena Nginx di kontainer frontend memakai batas bawaan 1 MB. `frontend/nginx.conf` kini mengizinkan permintaan hingga 55 MB (`client_max_body_size`), cukup untuk 10 berkas × 5 MB. Regresi dijaga `npm run test:nginx` di job CI `docker`.

### Dihapus
- `FIXES_UI.md` di root; isinya dipindah ke entri 2026-06-07 s.d. 2026-07-04 di bawah.

## 2026-10-08 — Perbaikan keamanan dan dependensi (PR #10–#12)

### Keamanan
- Setiap rate limiter kini memakai prefix Redis sendiri (`rl:<nama>:`). Sebelumnya semua limiter berbasis IP berbagi key `rl:<ip>`, sehingga lalu lintas biasa menghabiskan kuota login, registrasi, lupa password, dan refresh token (PR #10).
- `GET /users/unverified/students` dan `/unverified/admins` tidak lagi mengirim hash password dan `tokenVersion` (PR #10).
- Dependensi rentan diperbarui: `nodemailer` 9 → 10.0.16 (critical), `sanitize-html` 2.17.5 → 2.18.0 (XSS), serta `axios`, `multer`, `express`/`qs`, `sharp`, `engine.io`, `dompurify` lewat `npm audit fix` (PR #11).

### Diperbaiki
- Setup E2E tidak lagi memakai SMTP dan Redis dari `backend/.env` developer, sehingga E2E lokal tidak mengirim email sungguhan (PR #12).

### Catatan
- `nodemailer` 10 membutuhkan Node.js ≥ 20 (Docker dan CI sudah Node 20).
- Jest backend mentranspilasi paket ESM `htmlparser2` dkk. lewat `backend/tests/esmTransform.js`.

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

### Diubah
- Ikon lonceng admin membuka ringkasan akun dan laporan yang perlu perhatian; ikon lonceng mahasiswa membuka pembaruan laporan, dengan badge belum dibaca berdasarkan waktu terakhir menu dibuka.
- Detail laporan admin dan mahasiswa dibuka dalam dialog di atas daftar. URL lama `/report/:id` dan `/admin/reports/:id` dialihkan ke daftar dan otomatis membuka dialog tersebut. (Berkas halaman detail lama masih tersisa sebagai kode mati; lihat DeveloperGuide bagian 8.)
- Aksi per baris/kartu (laporan, pengguna, verifikasi, kategori, audit log, perangkat, admin) memakai menu titik tiga secara konsisten.
- Tabel utama tidak lagi memaksa scroll horizontal: kolom sekunder disembunyikan per breakpoint, daftar kategori menjadi kartu di layar kecil.
- Tata letak lebih ringkas, dan istilah diseragamkan ke Bahasa Indonesia (Dasbor, Analitik, Segarkan, Prioritas Bawaan, Unggah, Menunggu, Selesai, Ditolak, Dihapus sementara).

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
