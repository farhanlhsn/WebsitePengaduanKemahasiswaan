# Revisi SRS dan SDD

SRS v1.0.0 dan SDD v1.0.0 (Mei–Juni 2026, berkas PDF di folder `docs/`) belum mencakup perubahan Juni–Agustus 2026: peran SUPERADMIN, penugasan kategori admin, laporan anonim, prioritas dan petugas laporan, read receipt per pengguna, serta preferensi akun. Tabel di bawah adalah daftar bagian yang perlu diperbarui di berkas sumber (Word/Google Docs) sebelum diserahkan. Kondisi sebenarnya diperiksa langsung dari kode branch `main` per 8 Oktober 2026.

Setelah berkas sumber diperbarui, naikkan versi dokumen (mis. v1.1.0), ekspor ulang ke PDF, lalu ganti berkas lama di folder `docs/`.

## SRS

| Bagian SRS | Tertulis sekarang | Kondisi sebenarnya | Tindakan |
| --- | --- | --- | --- |
| 1.3, 2.3 User Classes, 5.2.1 User Role | Dua kelas pengguna: Mahasiswa dan Admin | Tiga peran: MAHASISWA, ADMIN, SUPERADMIN. Admin hanya menangani kategori yang ditugaskan; kategori, audit log, dan tata kelola admin khusus SUPERADMIN | Tambah kelas SUPERADMIN dan ubah hak akses Admin menjadi "berdasarkan penugasan kategori" |
| 2.2 Product Functions, 3.1 | Tidak menyebut laporan anonim, prioritas, petugas laporan, notifikasi email, reset password lewat email, atau preferensi akun | Semua fitur tersebut sudah ada | Tambah kebutuhan fungsional baru (mis. FR-REP-09 Laporan Anonim, FR-REP-10 Prioritas & Petugas, FR-AUTH-08 Reset Password, FR-USR-05 Preferensi, FR-NTF Notifikasi Email) |
| 2.4 Operating Environment, 2.5 | Node.js ≥ 18, PostgreSQL ≥ 14 | Image Docker memakai Node 20 dan PostgreSQL 16; Redis 7 wajib di produksi | Perbarui versi; tambahkan Redis |
| 2.5, FR-AUTH-03, Glosarium c–d | Access token 15 menit, refresh token 7 hari | Sesuai | Tidak perlu diubah |
| FR-AUTH-04, 3.2.2 Session Security | Token ditolak bila sidik jari perangkat tidak cocok | Sidik jari hanya dipakai membentuk ID perangkat; tidak ada penolakan token bila berbeda. Ada batas 3 perangkat per akun | Ubah kalimat sesuai implementasi, atau catat sebagai kebutuhan yang belum dipenuhi |
| Tabel 3.1.2 (USR) | ID ditulis FR-AUTH-01 s.d. 04 | Seharusnya FR-USR-01 s.d. 04 | Perbaiki penomoran |
| FR-USR-04 | Profil: ubah nama dan kata sandi | Bisa ubah nama, NIM, email (email wajib password lama dan mengakhiri semua sesi) | Lengkapi deskripsi |
| FR-REP-02 | Nomor registrasi berbasis timestamp/acak | Format `<KODE KATEGORI>/<urutan>/<tgl>/<bln>/<thn>`, mis. `SP/01/08/10/2026` | Perbarui format |
| FR-REP-06, 5.2.2 | Status bergerak linear PENDING → IN_REVIEW → IN_PROGRESS → RESOLVED/REJECTED | State machine: penolakan/pembatalan dari status aktif, pembukaan kembali RESOLVED/REJECTED ke IN_REVIEW, CANCELED ke PENDING; alasan wajib untuk REJECTED/CANCELED dan disimpan di laporan | Ganti dengan tabel transisi lengkap |
| FR-REP-07, 2.3 | Mahasiswa membatalkan laporan PENDING | Tersedia di API (`DELETE /reports/:id`), tetapi tombolnya tidak ada di UI saat ini | Pertahankan kebutuhan; catat sebagai gap UI |
| FR-REP-08 | Soft delete oleh pengguna, hard delete oleh admin | Mahasiswa: "hapus" = batalkan. Admin: soft delete dan pulihkan. Hard delete hanya SUPERADMIN | Perbarui peran |
| FR-REP-04 | Berkas bisa diunduh pemilik dan admin | Admin dibatasi pada kategori yang ditugaskan; akses lewat token Bearer atau cookie refresh | Perbarui |
| FR-CHT-05 | Centang dua biru saat lawan bicara membuka room | Read receipt dicatat per pengguna (tabel `message_reads`), bukan satu flag | Perbarui deskripsi |
| FR-CHT-06 | Pengirim menghapus pesan secara permanen | Soft delete; boleh oleh pengirim, admin kategori terkait, atau SUPERADMIN; tercatat di audit log | Perbarui |
| FR-DSB-01, FR-DSB-02 | Persentase kepuasan; tren bulanan | Tidak ada pengukuran kepuasan; tren per hari (7 hari di dasbor; 24 jam/7/30 hari/semua di Analitik). Angka kepuasan di beranda statis | Hapus atau tandai "belum diimplementasikan"; sesuaikan tren |
| FR-CAT-01 s.d. 03 | CRUD kategori oleh admin | Khusus SUPERADMIN; kategori punya Prioritas Bawaan dan izin Anonim; hapus permanen ditolak bila masih punya laporan | Perbarui peran dan atribut |
| 3.1.7 FR-AUD-03 | Admin memfilter log | Khusus SUPERADMIN | Perbarui peran |
| Judul 3.1.8 | "Audit Logging (AUD)" (duplikat) | Isi tabelnya Bulk Operations (BLK) | Ganti judul |
| FR-BLK-01 s.d. 03 | Operasi massal oleh admin | Divalidasi per item, maksimal 100 item; item yang gagal dilaporkan terpisah; operasi kategori khusus SUPERADMIN | Lengkapi |
| 3.2.3 Usability | Preferensi tema disimpan lokal | Disimpan per akun di server (`/users/preferences/me`) | Perbarui |
| 3.2.4 Reliability | Health check `/api/health`; backup otomatis 02.00 WIB | Ada `/api/health/live` dan `/api/health/ready` (cek DB + Redis). Backup otomatis belum ada di sistem; prosedur manual di Production Runbook | Tambah endpoint; ubah backup menjadi tanggung jawab operasional |
| 3.2.5 Documentation | Setiap endpoint wajib didokumentasikan | Sudah terpenuhi: OpenAPI 85 endpoint (`docs/api/openapi.json`, Swagger `/api/docs`) | Rujuk dokumen ini |
| 4.1.1 Landing Page | Menu Beranda, Bantuan, Tentang; tombol Login | Menu Bantuan, Masuk, Daftar; tidak ada halaman Tentang | Perbarui deskripsi atau screenshot |
| 4.1.3 Dashboard Admin | Daftar menu sidebar lama | Dasbor, Manajemen Pengguna, Pengguna Belum Verifikasi, Semua Laporan, Chat & Komunikasi, Analitik, Kategori Laporan¹, Kelola Admin¹, Riwayat Audit¹, Sistem & Keamanan, Pengaturan, Bantuan (¹ SUPERADMIN) | Perbarui |
| 4.3 Software Interface | PostgreSQL, Multer/Sharp, JWT, Docker | Tambah Redis (rate limit), Nodemailer/SMTP (email), Nginx (reverse proxy) | Tambah |
| 5.2.3, 5.2.4 Enumerations | Audit Entity: User, Role; Audit Action: 5 nilai | Entity: USER, REPORT, CATEGORY, ASSIGNMENT. Action: + VIEW_ANONYMOUS, CREATE, UPDATE, PROMOTE_ADMIN, DEMOTE_ADMIN, GRANT_CATEGORY, REVOKE_CATEGORY. Tambah enum Priority: LOW, MEDIUM, HIGH, URGENT | Perbarui |

## SDD

| Bagian SDD | Tertulis sekarang | Kondisi sebenarnya | Tindakan |
| --- | --- | --- | --- |
| 1.2, 2.1 Use Case | Dua aktor: Mahasiswa dan Admin | Tambah aktor SUPERADMIN (kelola admin, penugasan kategori, kategori, audit log, pembersihan data) | Perbarui diagram use case |
| 2.2 High-Level Architecture | Tiga lapis: React, Express, PostgreSQL | Tambah Redis (rate limit, gate audit anonim) dan SMTP | Perbarui diagram |
| 2.3 Deployment | Nginx meneruskan ke backend :6060; frontend bisa di CDN | Lima kontainer: frontend (Nginx), backend, PostgreSQL, Redis, migrate. Hanya Nginx yang terbuka; ada `docker-compose.prod.yml` | Perbarui diagram deployment (lihat `docs/SerahTerima.md` bagian 3) |
| 3.2.1 Authentication | Input header `x-device-fingerprint`; validasi sidik jari | Header dipakai membentuk ID perangkat; tidak ada penolakan bila berbeda. Refresh token disimpan sebagai hash SHA-256, dirotasi, dan dicabut bila dipakai ulang; batas 3 perangkat | Perbarui catatan |
| 3.2.2 User Management | Input profil: nama, password baru | Profil: nama, NIM, email; password lewat endpoint terpisah. ADMIN hanya mengelola MAHASISWA | Perbarui |
| 3.2.4 Chat | Event `joinRoom`, `typing`, `messageRead`; chat boleh untuk semua admin | Event `joinRoom`, `leaveRoom`, `chat:typing`; server memancarkan `chat:message`, `chat:read`, `chat:message:deleted`, `chat:list:update`, `access:revoked`. Kirim/baca/hapus lewat REST. Admin dibatasi kategori | Rujuk `docs/api/SocketEvents.md` |
| 3.2.5 Dashboard | Output rata-rata kepuasan pengguna, tren bulanan | Tidak ada metrik kepuasan; tren harian; data dibatasi cakupan kategori admin (`scope`) | Perbarui |
| 3.2.6 Category, 3.2.7 Audit Log | Dependency `isAdminMiddleware` | `isSuperAdminMiddleware` untuk perubahan kategori dan seluruh audit log | Perbarui |
| 3.2.8 Bulk Operations | Satu transaksi `updateMany`/`deleteMany` | Validasi per item dengan aturan yang sama seperti endpoint tunggal; hasil per item (`skipped`); maksimal 100 item | Perbarui |
| 4.1 Class Diagram, 5.1 ERD | 7 entitas | 11 tabel: tambah `admin_category_assignments`, `message_reads`, `password_reset_tokens`, `chat_pending_uploads` | Gambar ulang ERD dari `backend/prisma/schema.prisma` |
| 5.2.1 Users | Role MAHASISWA/ADMIN | Tambah SUPERADMIN; kolom baru `tokenVersion`, `preferences` (JSON) | Perbarui |
| 5.2.2 Categories | name, slug | Tambah `defaultPriority`, `allowAnonymous` | Perbarui |
| 5.2.3 Reports | Tanpa prioritas/anonim/petugas; `userId` wajib; `closedAt` untuk RESOLVED/REJECTED | Tambah `priority`, `isAnonymous`, `assignedToId`, `rejectedReason`, `canceledReason`; `userId` nullable; `closedAt` juga diisi untuk CANCELED | Perbarui |
| 5.2.4 Attachments | — | Tambah `createdAt`, `deletedAt` | Perbarui |
| 5.2.5 Messages | `isRead` sebagai status baca | Tambah `clientMessageId` (idempotensi); `isRead` usang, digantikan tabel `message_reads` | Perbarui |
| 5.2.6 Refresh_tokens | Kolom `token` | Kolom `tokenHash` (SHA-256), ditambah `userAgent`, `createdAt` | Perbarui |
| 5.2.7 AuditLog, Lampiran e–f | Entity USER/REPORT; 5 action | Entity + CATEGORY, ASSIGNMENT; action + 7 nilai (lihat tabel SRS 5.2.3–5.2.4) | Perbarui |
| 6.1 Wireframes | Mockup awal | Ganti dengan screenshot aplikasi akhir (`docs/user-manual/images/`) | Perbarui |
| 7.2.1 Activity Diagram Login | Validasi device fingerprint | Tidak ada validasi; login menolak akun belum terverifikasi atau sudah dihapus | Perbarui diagram |
| 7.3 State Machine | (diagram) | Pastikan mencakup pembukaan kembali RESOLVED/REJECTED → IN_REVIEW dan CANCELED → PENDING (`backend/src/utils/reportTransitions.js`) | Periksa dan perbarui |
| 8 System Constraints | Node.js ≥ 18, PostgreSQL ≥ 14, disk 20 GB, RAM 512 MB untuk backend | Versi produksi Node 20 dan PostgreSQL 16; batas kontainer: backend 512 MB, PostgreSQL 512 MB, Redis 256 MB | Perbarui versi; angka disk dan RAM masih sesuai |
