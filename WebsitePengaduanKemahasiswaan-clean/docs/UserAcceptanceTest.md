## COMPUTING PROJECT

# USER ACCEPTANCE TEST

## Sistem Pelaporan dan Pengaduan Kemahasiswaan Universitas Bung Hatta

```
Project Manager
Muhammad Farhan Al Hasan — 103012330007
```

```
Team Members
Ali Hizqil Syauqani — 103012300036
Reyhan Agra Syihab — 103012330066
M Hafid Ramadhan — 103012330194
Athallah Zacky Maulana — 103012330271
Raja Hanif Shirvani — 103012300315
Dinar Muhammad Akbar — 103012300333
```

```
Supervisor
Bintang Vieshe Mone
```

#### PROGRAM STUDI S-1 INFORMATIKA

#### FAKULTAS INFORMATIKA – UNIVERSITAS TELKOM

#### JUNI 2026

---

## Document Version

| Versi | Tanggal | Perubahan | Penulis |
|---|---|---|---|
| v0.1.0 | 07 Juni 2026 | Draft awal dokumen UAT berdasarkan SRS v1.0.0 dan implementasi sistem | Kelompok 3 IF-47-GABUP.04 |
| v0.2.0 | 07 Juni 2026 | Penyelarasan test case dengan kebijakan anonimitas, batas upload, RBAC, session lifecycle, dan implementasi aktual | Kelompok 3 IF-47-GABUP.04 |
| v0.2.1 | 07 Juni 2026 | Tambah TC-041 verifikasi purge cache API setelah logout dan shared browser | Kelompok 3 IF-47-GABUP.04 |
| v0.3.0 | 07 Juni 2026 | Tambah TC-042 s/d TC-048 (governance RBAC, dashboard scoping, upload hardening, chat idempotency, SW cache policy, token single-use) | Kelompok 3 IF-47-GABUP.04 |

| Tim Penguji | Tanggal UAT |
|---|---|
| *(diisi saat pelaksanaan)* | *(diisi saat pelaksanaan)* |

---

## Table of Content

1. [Introduction](#1-introduction)
2. [UAT Environment](#2-uat-environment)
3. [UAT Roles and Responsibilities](#3-uat-roles-and-responsibilities)
4. [Test Scenario Overview](#4-test-scenario-overview)
5. [Detailed Test Cases](#5-detailed-test-cases)
6. [UAT Summary Report](#6-uat-summary-report)
7. [Approval](#7-approval)

---

## 1. Introduction

### 1.1. Purpose of UAT

Dokumen User Acceptance Test (UAT) ini disusun untuk memverifikasi bahwa **Sistem Pelaporan dan Pengaduan Kemahasiswaan Universitas Bung Hatta** telah memenuhi kebutuhan bisnis dan fungsional yang ditetapkan dalam dokumen SRS v1.0.0 serta kebutuhan operasional stakeholder kampus.

Tujuan utama pelaksanaan UAT:

- Memverifikasi bahwa sistem sesuai dengan kebutuhan bisnis pengaduan kemahasiswaan UBH (transparansi, keamanan, akuntabilitas).
- Menilai apakah fungsionalitas dapat diterima dan digunakan oleh pengguna akhir (mahasiswa dan admin kampus).
- Memvalidasi alur bisnis utama: registrasi → verifikasi → pengaduan → tindak lanjut → penyelesaian.
- Menjadi dasar keputusan **Go / No-Go** untuk deployment ke lingkungan produksi atau staging kampus.

### 1.2. Scope of UAT

**Lingkup bisnis**

UAT mencakup pengujian penerimaan terhadap platform web pengaduan kemahasiswaan yang menghubungkan mahasiswa aktif UBH dengan admin/petugas kampus dalam proses pelaporan, verifikasi, komunikasi, dan penindaklanjutan pengaduan.

**Fitur yang diuji (In Scope)**

| Modul | Cakupan UAT |
|---|---|
| **AUTH** | Registrasi mahasiswa (3 langkah + KTM), login, logout, refresh token, lupa/reset password, manajemen sesi perangkat |
| **USR** | Verifikasi/penolakan mahasiswa, manajemen pengguna, profil mandiri, superadmin governance |
| **REP** | Pembuatan laporan, laporan anonim, lampiran, penomoran otomatis, tracking status, pembatalan, soft/hard delete |
| **CHT** | Chat real-time per laporan, lampiran chat, typing indicator, read receipt |
| **DSB** | Dashboard mahasiswa, dashboard admin, analitik & grafik |
| **CAT** | CRUD kategori, pengaturan prioritas & anonimitas per kategori |
| **AUD** | Audit log aksi sensitif (verifikasi, ubah status, lihat identitas anonim, dll.) |
| **BLK** | Bulk operations (verifikasi massal, update status massal, delete/restore massal) |
| **SEC** | Keamanan file upload, proteksi akses lampiran, device tracking |

**Excluded items (Out of Scope)**

- Pengujian performa beban tinggi (load/stress testing) — dilakukan terpisah.
- Pengujian keamanan penetrasi (penetration testing) eksternal.
- Integrasi dengan sistem akademik UBH (SIAKAD, email kampus resmi) yang belum tersedia.
- Notifikasi email produksi (bergantung konfigurasi SMTP kampus).
- Pengujian pada perangkat mobile native (aplikasi hanya web responsif).
- Migrasi data pengaduan historis dari kanal manual (WhatsApp/email).

### 1.3. Intended Audience

| Pembaca | Kegunaan Dokumen |
|---|---|
| **Product Owner / Stakeholder UBH** | Menilai kelayakan sistem untuk dioperasikan di kampus |
| **Business Analyst** | Memvalidasi kesesuaian alur bisnis dengan prosedur pengaduan |
| **End User (Mahasiswa & Admin)** | Memahami skenario yang diuji dan memberikan feedback |
| **QA Tester / Tim Penguji** | Menjalankan test case dan mencatat hasil |
| **Developer** | Mendukung perbaikan defect yang ditemukan selama UAT |
| **Project Manager** | Mengkoordinasikan jadwal UAT dan keputusan Go Live |
| **Supervisor / Dosen Pembimbing** | Meninjau kelengkapan dan kualitas pengujian penerimaan |

---

## 2. UAT Environment

| Item | Description |
|---|---|
| **URL Frontend** | `http://localhost:5173` (development) / *(isi URL staging/produksi saat UAT)* |
| **URL Backend API** | `http://localhost:6060/v1/api` |
| **URL Socket.IO** | `http://localhost:6060` |
| **Health Check** | `http://localhost:6060/api/health` |
| **Browser** | Google Chrome 120+ (utama), Firefox 115+, Edge 120+ |
| **OS** | Windows 11 / macOS 14+ / Linux (Ubuntu 22.04+) |
| **Device** | Desktop (1920×1080), Tablet (768px), Mobile (375px) |
| **DB** | PostgreSQL 16 |
| **Backend Runtime** | Node.js 20 LTS, Express.js 4 |
| **Frontend** | React 19, Vite 6, Material UI 7 |
| **Versi Aplikasi** | v1.0.0 |
| **Dependency** | PostgreSQL dan Redis aktif; layanan email diperlukan untuk skenario reset password berbasis email |

### Akun UAT (Test Credentials)

> **Catatan keamanan:** Ganti password default sebelum UAT di lingkungan yang dapat diakses publik. Jangan gunakan kredensial produksi nyata.

| Role | Email | Password | Status | Keterangan |
|---|---|---|---|---|
| Super Admin | `superadmin@kampus.ac.id` | *(dari `SEED_SUPERADMIN_PASSWORD`)* | Verified | Bootstrap via `npm run seed` |
| Admin | `admin@kampus.ac.id` | *(buat manual / seed)* | Verified | Perlu assignment kategori |
| Mahasiswa (belum verifikasi) | `belumverif@mahasiswa.bunghatta.ac.id` | `TestPass123!` | Unverified | Untuk TC verifikasi |
| Mahasiswa (terverifikasi) | `mahasiswa@mahasiswa.bunghatta.ac.id` | `TestPass123!` | Verified | Untuk TC pengaduan & chat |
| Mahasiswa (baru) | *(buat saat TC registrasi)* | — | — | Data dinamis per test case |

### Data UAT Pendukung

| Item | Nilai Contoh |
|---|---|
| NIM valid | `103012330099` (data uji, bukan NIM anggota tim) |
| File KTM | `ktm-sample.jpg` (JPEG, ukuran awal ≤ 15 MB, hasil kompresi ≤ 5 MB, teks terbaca) |
| File lampiran laporan | `bukti-kerusakan.jpg`, `dokumen.pdf` |
| Kategori uji anonim | `Kekerasan Seksual`, `Diskriminasi` |
| Kategori uji non-anonim | `Sarana dan Prasarana`, `Akademik` |

---

## 3. UAT Roles and Responsibilities

| Role | Nama | Responsibility |
|---|---|---|
| **UAT Lead** | Muhammad Farhan Al Hasan | Merencanakan jadwal UAT, memastikan semua skenario dijalankan, menyusun laporan ringkasan |
| **Business User / Client Representative** | *(Perwakilan Biro Kemahasiswaan UBH)* | Memvalidasi kesesuaian alur bisnis dan memberikan persetujuan fungsional |
| **QA Tester** | Reyhan Agra Syihab, Ali Hizqil Syauqani | Menjalankan test case, mendokumentasikan actual result & screenshot |
| **Developer Support** | Athallah Zacky Maulana, M Hafid Ramadhan | Memperbaiki defect, mendukung setup environment UAT |
| **Project Manager** | Muhammad Farhan Al Hasan | Mengkoordinasikan tim, melaporkan progress ke supervisor |
| **End User Tester (Mahasiswa)** | Raja Hanif Shirvani | Menguji sisi mahasiswa dari perspektif pengguna nyata |
| **End User Tester (Admin)** | Dinar Muhammad Akbar | Menguji sisi admin dari perspektif petugas kampus |

---

## 4. Test Scenario Overview

| Scenario ID | Scenario Name | Description | Related Module | Related SRS |
|---|---|---|---|---|
| SC-01 | Registrasi Mahasiswa | Pendaftaran akun 3 langkah dengan upload KTM | AUTH | FR-AUTH-01 |
| SC-02 | Autentikasi & Sesi | Login, logout, refresh token, manajemen perangkat | AUTH | FR-AUTH-02 s/d FR-AUTH-07 |
| SC-03 | Reset Password | Alur lupa password dan reset via token | AUTH | *(implementasi tambahan)* |
| SC-04 | Verifikasi Akun Mahasiswa | Admin memverifikasi/menolak pendaftar baru | USR | FR-USR-01 |
| SC-05 | Pembuatan Laporan | Mahasiswa membuat pengaduan dengan lampiran | REP | FR-REP-01 s/d FR-REP-04 |
| SC-06 | Laporan Anonim | Pengaduan tanpa identitas pelapor untuk kategori sensitif | REP | *(implementasi tambahan)* |
| SC-07 | Tracking & Status Laporan | Pemantauan status dan timeline laporan | REP | FR-REP-05, FR-REP-06 |
| SC-08 | Pembatalan & Penghapusan Laporan | Mahasiswa membatalkan laporan PENDING; pengguna/admin menguji soft delete, restore, dan hard delete sesuai kewenangan | REP | FR-REP-07, FR-REP-08 |
| SC-09 | Chat Real-time | Komunikasi per laporan dengan fitur real-time | CHT | FR-CHT-01 s/d FR-CHT-05 |
| SC-10 | Dashboard Mahasiswa | Ringkasan dan daftar laporan milik sendiri | DSB | FR-DSB-03 |
| SC-11 | Dashboard & Analitik Admin | Statistik, grafik tren, dan KPI penyelesaian | DSB | FR-DSB-01, FR-DSB-02 |
| SC-12 | Manajemen Laporan Admin | Update status, prioritas, assign, detail laporan | REP | FR-REP-06, FR-REP-08 |
| SC-13 | Bulk Operations | Aksi massal verifikasi, status, delete/restore | BLK | FR-BLK-* |
| SC-14 | Manajemen Kategori | CRUD kategori, prioritas default, toggle anonim | CAT | FR-CAT-* |
| SC-15 | Manajemen Pengguna | Daftar user, soft delete, restore, cleanup | USR | FR-USR-02, FR-USR-03 |
| SC-16 | Audit Log | Pencatatan dan penelusuran jejak audit | AUD | FR-AUD-* |
| SC-17 | Keamanan & Sesi Perangkat | Device tracking, logout perangkat lain, purge cache API | AUTH/SEC | FR-AUTH-04, FR-AUTH-07 |
| SC-18 | Superadmin Governance | Promosi admin, assignment kategori per admin | USR | *(implementasi tambahan)* |
| SC-19 | Profil & Pengaturan | Update profil, ubah password mandiri | USR | FR-USR-04 |
| SC-20 | Halaman Publik & Bantuan | Landing page, help page, halaman 404 | UI | SRS §4.1 |
| SC-21 | Remediation & Security Hardening | RBAC governance, scoping dashboard, validasi upload, chat idempotency, cache policy, token rotation | USR/SEC/CHT | *(implementasi remediasi Juni 2026)* |

---

## 5. Detailed Test Cases

> **Petunjuk pengujian:** Kolom *Actual Result*, *Status*, dan *Notes* diisi oleh tim penguji saat pelaksanaan UAT. Lampirkan screenshot untuk setiap test case yang menghasilkan tampilan visual penting.

---

### SC-01: Registrasi Mahasiswa

#### TC-001 — Registrasi Mahasiswa Berhasil (Happy Path)

| Field | Value |
|---|---|
| **Test Case ID** | TC-001 |
| **Scenario ID** | SC-01 |
| **Test Case Name** | Registrasi mahasiswa baru dengan data valid |
| **Pre-conditions** | Email belum terdaftar di sistem; file KTM tersedia |
| **Test Steps** | 1. Buka `/register`<br>2. Isi NIM, nama, email kampus → klik **Lanjutkan**<br>3. Isi password & konfirmasi (memenuhi kebijakan kekuatan password) → **Lanjutkan**<br>4. Upload foto KTM valid → **Daftar** |
| **Test Data** | NIM: `103012330099`, Nama: `Budi Santoso`, Email: `budi@mahasiswa.bunghatta.ac.id`, Password: `TestPass123!`, KTM: `ktm-sample.jpg` |
| **Expected Result** | Registrasi berhasil; pengguna diarahkan ke halaman menunggu verifikasi; akun tercatat dengan `isVerified = false` |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-002 — Registrasi Gagal: Email Sudah Terdaftar

| Field | Value |
|---|---|
| **Test Case ID** | TC-002 |
| **Scenario ID** | SC-01 |
| **Test Case Name** | Registrasi dengan email duplikat |
| **Pre-conditions** | Email `mahasiswa@mahasiswa.bunghatta.ac.id` sudah terdaftar |
| **Test Steps** | 1. Buka `/register`<br>2. Isi form dengan email yang sudah ada<br>3. Selesaikan semua langkah dan submit |
| **Test Data** | Email: `mahasiswa@mahasiswa.bunghatta.ac.id` |
| **Expected Result** | Sistem menampilkan pesan error bahwa email sudah digunakan; akun baru tidak dibuat |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-003 — Registrasi Gagal: File KTM Tidak Valid

| Field | Value |
|---|---|
| **Test Case ID** | TC-003 |
| **Scenario ID** | SC-01 |
| **Test Case Name** | Upload KTM dengan format/ukuran tidak valid |
| **Pre-conditions** | Pengguna berada di langkah 3 registrasi |
| **Test Steps** | 1. Upload file `.exe` atau gambar > 15 MB<br>2. Coba lanjutkan registrasi<br>3. Ulangi dengan gambar 5–15 MB untuk memverifikasi proses kompresi |
| **Test Data** | File: `invalid.exe`, `oversized.jpg` (> 15 MB), dan gambar valid 5–15 MB |
| **Expected Result** | Format non-gambar dan file awal > 15 MB ditolak; gambar valid 5–15 MB dikompresi sebelum upload dan hasil akhir tidak melebihi batas backend |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

---

### SC-02: Autentikasi & Sesi

#### TC-004 — Login Berhasil (Mahasiswa Terverifikasi)

| Field | Value |
|---|---|
| **Test Case ID** | TC-004 |
| **Scenario ID** | SC-02 |
| **Test Case Name** | Login mahasiswa terverifikasi |
| **Pre-conditions** | Akun mahasiswa sudah diverifikasi admin |
| **Test Steps** | 1. Buka `/login`<br>2. Masukkan email dan password valid<br>3. Klik **Masuk ke Akun** |
| **Test Data** | Email: `mahasiswa@mahasiswa.bunghatta.ac.id`, Password: `TestPass123!` |
| **Expected Result** | Login berhasil; diarahkan ke `/dashboard`; token JWT diterbitkan |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-005 — Login Gagal: Kredensial Salah

| Field | Value |
|---|---|
| **Test Case ID** | TC-005 |
| **Scenario ID** | SC-02 |
| **Test Case Name** | Login dengan password salah |
| **Pre-conditions** | Akun terdaftar dan aktif |
| **Test Steps** | 1. Buka `/login`<br>2. Masukkan email benar, password salah<br>3. Submit |
| **Test Data** | Email: `mahasiswa@mahasiswa.bunghatta.ac.id`, Password: `SalahPassword1!` |
| **Expected Result** | Login ditolak; pesan error ditampilkan; tidak ada redirect ke dashboard |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-006 — Login Gagal: Akun Belum Diverifikasi

| Field | Value |
|---|---|
| **Test Case ID** | TC-006 |
| **Scenario ID** | SC-02 |
| **Test Case Name** | Login mahasiswa yang belum diverifikasi |
| **Pre-conditions** | Akun mahasiswa `isVerified = false` |
| **Test Steps** | 1. Login dengan akun belum verifikasi |
| **Test Data** | Email: `belumverif@mahasiswa.bunghatta.ac.id` |
| **Expected Result** | Login ditolak dengan informasi bahwa akun belum diverifikasi; access token dan refresh token tidak diterbitkan |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-007 — Logout Berhasil

| Field | Value |
|---|---|
| **Test Case ID** | TC-007 |
| **Scenario ID** | SC-02 |
| **Test Case Name** | Logout dan pencabutan sesi |
| **Pre-conditions** | Pengguna sudah login |
| **Test Steps** | 1. Klik tombol **Logout**<br>2. Coba akses `/dashboard` langsung |
| **Test Data** | Akun mahasiswa terverifikasi |
| **Expected Result** | Sesi berakhir; refresh token dihapus; akses dashboard ditolak dan redirect ke login |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

---

### SC-03: Reset Password

#### TC-008 — Lupa Password: Request Reset

| Field | Value |
|---|---|
| **Test Case ID** | TC-008 |
| **Scenario ID** | SC-03 |
| **Test Case Name** | Request reset password via email |
| **Pre-conditions** | SMTP dikonfigurasi; email terdaftar di sistem |
| **Test Steps** | 1. Buka `/forgot-password`<br>2. Masukkan email terdaftar<br>3. Submit |
| **Test Data** | Email: `mahasiswa@mahasiswa.bunghatta.ac.id` |
| **Expected Result** | Sistem menampilkan konfirmasi; token reset dibuat; email terkirim (jika SMTP aktif) |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | Jika SMTP tidak aktif, catat sebagai Blocked dengan alasan environment |

#### TC-009 — Reset Password Berhasil

| Field | Value |
|---|---|
| **Test Case ID** | TC-009 |
| **Scenario ID** | SC-03 |
| **Test Case Name** | Reset password dengan token valid |
| **Pre-conditions** | Token reset valid belum expired |
| **Test Steps** | 1. Buka link `/reset-password?token=...`<br>2. Masukkan password baru & konfirmasi<br>3. Submit |
| **Test Data** | Password baru: `NewPass456!` |
| **Expected Result** | Password berhasil diubah; token ditandai used; seluruh sesi lama dicabut; login dengan password lama gagal dan login dengan password baru berhasil |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

---

### SC-04: Verifikasi Akun Mahasiswa

#### TC-010 — Admin Verifikasi Mahasiswa Baru

| Field | Value |
|---|---|
| **Test Case ID** | TC-010 |
| **Scenario ID** | SC-04 |
| **Test Case Name** | Admin menyetujui pendaftaran mahasiswa |
| **Pre-conditions** | Ada mahasiswa belum verifikasi; admin sudah login |
| **Test Steps** | 1. Login sebagai admin<br>2. Buka `/admin/unverified-users`<br>3. Lihat preview KTM<br>4. Klik **Verifikasi** |
| **Test Data** | Mahasiswa dari TC-001 |
| **Expected Result** | Status mahasiswa menjadi verified; aksi tercatat di audit log; mahasiswa dapat login penuh |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-011 — Admin Menolak Pendaftaran Mahasiswa

| Field | Value |
|---|---|
| **Test Case ID** | TC-011 |
| **Scenario ID** | SC-04 |
| **Test Case Name** | Admin menolak pendaftaran dengan alasan |
| **Pre-conditions** | Ada mahasiswa belum verifikasi |
| **Test Steps** | 1. Buka daftar unverified users<br>2. Klik **Tolak**<br>3. Isi alasan penolakan<br>4. Konfirmasi |
| **Test Data** | Alasan: `KTM tidak terbaca / tidak valid` |
| **Expected Result** | Pendaftaran ditolak; mahasiswa tidak dapat mengakses fitur pengaduan |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

---

### SC-05 & SC-06: Pembuatan Laporan

#### TC-012 — Buat Laporan Reguler Berhasil

| Field | Value |
|---|---|
| **Test Case ID** | TC-012 |
| **Scenario ID** | SC-05 |
| **Test Case Name** | Mahasiswa membuat laporan non-anonim |
| **Pre-conditions** | Mahasiswa terverifikasi dan login |
| **Test Steps** | 1. Buka `/dashboard`<br>2. Klik **Buat Laporan**<br>3. Isi judul, pilih kategori `Sarana dan Prasarana`<br>4. Isi deskripsi di langkah 2<br>5. Upload 1 lampiran di langkah 3<br>6. Submit |
| **Test Data** | Judul: `AC Ruang B3 Rusak`, Deskripsi: `AC tidak dingin sejak 3 hari`, Lampiran: `bukti.jpg` |
| **Expected Result** | Laporan tersimpan; nomor registrasi unik dihasilkan; status awal `PENDING`; muncul di dashboard |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-013 — Buat Laporan Anonim

| Field | Value |
|---|---|
| **Test Case ID** | TC-013 |
| **Scenario ID** | SC-06 |
| **Test Case Name** | Mahasiswa membuat laporan anonim pada kategori yang mendukung |
| **Pre-conditions** | Kategori `Kekerasan Seksual` memiliki `allowAnonymous = true` |
| **Test Steps** | 1. Buat laporan baru<br>2. Pilih kategori yang mendukung anonim<br>3. Aktifkan toggle **Laporkan secara anonim**<br>4. Lengkapi dan submit |
| **Test Data** | Kategori: `Kekerasan Seksual`, Toggle anonim: ON |
| **Expected Result** | Laporan tersimpan dengan `isAnonymous = true`; identitas pelapor disembunyikan dari seluruh pengguna selain pelapor, termasuk Admin dan SuperAdmin |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-014 — Toggle Anonim Tidak Muncul pada Kategori Non-Anonim

| Field | Value |
|---|---|
| **Test Case ID** | TC-014 |
| **Scenario ID** | SC-06 |
| **Test Case Name** | Validasi toggle anonim hanya untuk kategori tertentu |
| **Pre-conditions** | Mahasiswa login |
| **Test Steps** | 1. Buat laporan<br>2. Pilih kategori `Akademik` (non-anonim)<br>3. Periksa ketersediaan toggle anonim |
| **Test Data** | Kategori: `Akademik` |
| **Expected Result** | Toggle **Laporkan secara anonim** tidak ditampilkan atau dinonaktifkan |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-015 — Validasi Lampiran: Melebihi Batas Ukuran

| Field | Value |
|---|---|
| **Test Case ID** | TC-015 |
| **Scenario ID** | SC-05 |
| **Test Case Name** | Upload lampiran lebih dari 5 MB ditolak |
| **Pre-conditions** | Modal buat laporan terbuka |
| **Test Steps** | 1. Coba upload file > 5 MB |
| **Test Data** | File: `large-file.jpg` (6 MB) |
| **Expected Result** | Sistem menolak upload dan menampilkan pesan batas ukuran |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

---

### SC-07 & SC-08: Tracking & Pembatalan Laporan

#### TC-016 — Mahasiswa Melihat Detail & Timeline Status

| Field | Value |
|---|---|
| **Test Case ID** | TC-016 |
| **Scenario ID** | SC-07 |
| **Test Case Name** | Tracking status laporan via halaman detail |
| **Pre-conditions** | Laporan milik mahasiswa sudah ada (TC-012) |
| **Test Steps** | 1. Dari dashboard, klik laporan<br>2. Buka `/report/:id`<br>3. Periksa timeline status |
| **Test Data** | Laporan dari TC-012 |
| **Expected Result** | Detail laporan tampil lengkap; timeline menunjukkan status terkini; nomor registrasi terlihat |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-017 — Mahasiswa Membatalkan Laporan PENDING

| Field | Value |
|---|---|
| **Test Case ID** | TC-017 |
| **Scenario ID** | SC-08 |
| **Test Case Name** | Pembatalan laporan berstatus PENDING |
| **Pre-conditions** | Laporan berstatus `PENDING` milik mahasiswa |
| **Test Steps** | 1. Buka detail laporan<br>2. Klik **Batalkan Laporan**<br>3. Konfirmasi |
| **Test Data** | Laporan PENDING |
| **Expected Result** | Status berubah ke `CANCELED`; laporan tidak dapat diproses admin |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | Requirement SRS menyatakan pembatalan dilakukan oleh pelapor. Pada baseline kode yang direview, perubahan status masih melalui endpoint admin; test ini menjadi acceptance gate dan tidak boleh dianggap Passed sebelum aksi pembatalan mahasiswa tersedia. |

#### TC-018 — Pembatalan Gagal: Status Bukan PENDING

| Field | Value |
|---|---|
| **Test Case ID** | TC-018 |
| **Scenario ID** | SC-08 |
| **Test Case Name** | Mahasiswa tidak dapat membatalkan laporan yang sudah diproses |
| **Pre-conditions** | Laporan berstatus `IN_REVIEW` atau lebih lanjut |
| **Test Steps** | 1. Buka detail laporan non-PENDING<br>2. Cari opsi batalkan |
| **Test Data** | Laporan status `IN_REVIEW` |
| **Expected Result** | Tombol batalkan tidak tersedia atau aksi ditolak oleh sistem |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-040 — Soft Delete, Restore, dan Hard Delete Laporan

| Field | Value |
|---|---|
| **Test Case ID** | TC-040 |
| **Scenario ID** | SC-08 |
| **Test Case Name** | Penghapusan logis, pemulihan, dan penghapusan permanen laporan |
| **Pre-conditions** | Tersedia laporan uji; mahasiswa adalah pemilik laporan; akun admin memiliki akses ke kategori laporan |
| **Test Steps** | 1. Sebagai mahasiswa, soft delete laporan milik sendiri yang masih `PENDING`<br>2. Pastikan laporan tidak muncul pada daftar aktif<br>3. Sebagai admin berwenang, restore laporan<br>4. Verifikasi laporan kembali aktif<br>5. Sebagai admin berwenang, lakukan hard delete pada laporan khusus data uji |
| **Test Data** | Laporan khusus UAT tanpa data produksi |
| **Expected Result** | Soft delete menyembunyikan laporan dari daftar aktif; restore mengaktifkan kembali laporan; hard delete menghapus data uji secara permanen sesuai kewenangan dan seluruh aksi tercatat pada audit log |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | Hard delete hanya dilakukan pada data uji yang telah disetujui UAT Lead. |

---

### SC-09: Chat Real-time

#### TC-019 — Kirim & Terima Pesan Chat Real-time

| Field | Value |
|---|---|
| **Test Case ID** | TC-019 |
| **Scenario ID** | SC-09 |
| **Test Case Name** | Chat dua arah mahasiswa ↔ admin tanpa refresh |
| **Pre-conditions** | Laporan aktif ada; mahasiswa dan admin login di browser berbeda |
| **Test Steps** | 1. Mahasiswa buka `/dashboard/chat/:reportId`<br>2. Admin buka chat laporan yang sama<br>3. Mahasiswa kirim pesan<br>4. Admin balas pesan |
| **Test Data** | Pesan: `Bukti sudah saya lampirkan, mohon ditindaklanjuti` |
| **Expected Result** | Pesan muncul instan di kedua sisi tanpa reload; timestamp dan nama pengirim benar |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-020 — Typing Indicator & Read Receipt

| Field | Value |
|---|---|
| **Test Case ID** | TC-020 |
| **Scenario ID** | SC-09 |
| **Test Case Name** | Indikator mengetik dan status baca pesan |
| **Pre-conditions** | Dua pengguna dalam room chat yang sama |
| **Test Steps** | 1. Admin mulai mengetik di input chat<br>2. Mahasiswa amati indikator<br>3. Mahasiswa buka/baca room chat |
| **Test Data** | — |
| **Expected Result** | Muncul "Sedang mengetik..."; setelah dibaca, status pesan berubah (read receipt) |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-021 — Kirim Lampiran dalam Chat

| Field | Value |
|---|---|
| **Test Case ID** | TC-021 |
| **Scenario ID** | SC-09 |
| **Test Case Name** | Upload file dalam percakapan chat |
| **Pre-conditions** | Room chat laporan terbuka |
| **Test Steps** | 1. Klik lampirkan file di chat<br>2. Upload gambar valid<br>3. Kirim pesan |
| **Test Data** | File: `bukti-tambahan.jpg` |
| **Expected Result** | File terlampir pada pesan; dapat diunduh oleh pihak yang berwenang |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

---

### SC-10 & SC-11: Dashboard

#### TC-022 — Dashboard Mahasiswa: Filter & Pencarian

| Field | Value |
|---|---|
| **Test Case ID** | TC-022 |
| **Scenario ID** | SC-10 |
| **Test Case Name** | Filter laporan berdasarkan status dan pencarian teks |
| **Pre-conditions** | Mahasiswa memiliki ≥ 2 laporan dengan status berbeda |
| **Test Steps** | 1. Buka `/dashboard`<br>2. Filter status `PENDING`<br>3. Cari berdasarkan judul laporan |
| **Test Data** | Keyword: `AC` |
| **Expected Result** | Daftar laporan terfilter sesuai kriteria; hanya laporan milik mahasiswa yang tampil |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-023 — Dashboard Admin: Statistik Ringkasan

| Field | Value |
|---|---|
| **Test Case ID** | TC-023 |
| **Scenario ID** | SC-11 |
| **Test Case Name** | Panel ringkasan statistik admin |
| **Pre-conditions** | Admin login; terdapat data laporan di sistem |
| **Test Steps** | 1. Buka `/admin`<br>2. Periksa kartu statistik (total laporan, per status, dll.) |
| **Test Data** | Akun admin |
| **Expected Result** | Statistik tampil akurat sesuai data database; grafik ter-render tanpa error |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-024 — Halaman Analitik Admin

| Field | Value |
|---|---|
| **Test Case ID** | TC-024 |
| **Scenario ID** | SC-11 |
| **Test Case Name** | Grafik tren dan distribusi kategori |
| **Pre-conditions** | Admin login; data historis laporan tersedia |
| **Test Steps** | 1. Buka `/admin/analytics`<br>2. Periksa grafik tren bulanan<br>3. Periksa distribusi kategori |
| **Test Data** | — |
| **Expected Result** | Grafik interaktif tampil (Recharts); data konsisten dengan jumlah laporan aktual |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

---

### SC-12: Manajemen Laporan Admin

#### TC-025 — Admin Mengubah Status Laporan

| Field | Value |
|---|---|
| **Test Case ID** | TC-025 |
| **Scenario ID** | SC-12 |
| **Test Case Name** | Update status PENDING → IN_REVIEW → IN_PROGRESS → RESOLVED |
| **Pre-conditions** | Admin memiliki akses ke kategori laporan; laporan PENDING tersedia |
| **Test Steps** | 1. Buka `/admin/reports`<br>2. Pilih laporan<br>3. Buka detail `/admin/reports/:id`<br>4. Ubah status secara berurutan |
| **Test Data** | Laporan dari TC-012 |
| **Expected Result** | Setiap perubahan status tersimpan; mahasiswa melihat update di timeline; tercatat di audit log |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-026 — Admin Membuka Laporan Anonim dengan Identitas Tetap Tersamarkan

| Field | Value |
|---|---|
| **Test Case ID** | TC-026 |
| **Scenario ID** | SC-12 / SC-16 |
| **Test Case Name** | Admin membuka laporan anonim tanpa memperoleh identitas pelapor |
| **Pre-conditions** | Laporan anonim ada (TC-013); admin login |
| **Test Steps** | 1. Buka detail laporan anonim sebagai Admin yang memiliki assignment kategori<br>2. Ulangi sebagai SuperAdmin<br>3. Pastikan nama, NIM, email, dan ID pelapor tidak tampil<br>4. Login sebagai SuperAdmin dan periksa audit log |
| **Test Data** | Laporan anonim TC-013 |
| **Expected Result** | Identitas tetap tampil sebagai `Anonim` bagi Admin dan SuperAdmin; pesan pelapor ikut dimasking; pembukaan detail oleh admin tercatat sebagai `VIEW_ANONYMOUS` dengan metadata `masked = true` tanpa membocorkan PII |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-027 — Admin Menolak Laporan (REJECTED)

| Field | Value |
|---|---|
| **Test Case ID** | TC-027 |
| **Scenario ID** | SC-12 |
| **Test Case Name** | Admin menolak laporan dengan alasan |
| **Pre-conditions** | Laporan aktif tersedia |
| **Test Steps** | 1. Buka detail laporan admin<br>2. Ubah status ke `REJECTED`<br>3. Isi alasan jika diminta |
| **Test Data** | Alasan: `Bukti tidak memadai` |
| **Expected Result** | Status `REJECTED`; mahasiswa dapat melihat status di dashboard |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

---

### SC-13: Bulk Operations

#### TC-028 — Bulk Update Status Laporan

| Field | Value |
|---|---|
| **Test Case ID** | TC-028 |
| **Scenario ID** | SC-13 |
| **Test Case Name** | Admin mengubah status beberapa laporan sekaligus |
| **Pre-conditions** | ≥ 2 laporan PENDING tersedia |
| **Test Steps** | 1. Buka `/admin/reports`<br>2. Pilih beberapa laporan (checkbox)<br>3. Pilih aksi bulk **Update Status**<br>4. Pilih status `IN_REVIEW`<br>5. Konfirmasi |
| **Test Data** | 2+ laporan PENDING |
| **Expected Result** | Semua laporan terpilih berubah status; notifikasi sukses ditampilkan |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-029 — Bulk Verifikasi Mahasiswa

| Field | Value |
|---|---|
| **Test Case ID** | TC-029 |
| **Scenario ID** | SC-13 |
| **Test Case Name** | Verifikasi massal mahasiswa belum terverifikasi |
| **Pre-conditions** | ≥ 2 mahasiswa unverified |
| **Test Steps** | 1. Buka halaman unverified users<br>2. Pilih beberapa mahasiswa<br>3. Jalankan bulk verify |
| **Test Data** | 2 mahasiswa unverified |
| **Expected Result** | Semua mahasiswa terpilih menjadi verified |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

---

### SC-14: Manajemen Kategori

#### TC-030 — Superadmin Membuat Kategori Baru

| Field | Value |
|---|---|
| **Test Case ID** | TC-030 |
| **Scenario ID** | SC-14 |
| **Test Case Name** | CRUD kategori — Create |
| **Pre-conditions** | Login sebagai SUPERADMIN |
| **Test Steps** | 1. Buka `/admin/categories`<br>2. Klik **Tambah Kategori**<br>3. Isi nama, prioritas default, toggle anonim<br>4. Simpan |
| **Test Data** | Nama: `Uji Kategori UAT`, Prioritas: `HIGH`, Anonim: OFF |
| **Expected Result** | Kategori baru muncul di daftar; tersedia saat mahasiswa membuat laporan |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-031 — Superadmin Menghapus & Restore Kategori

| Field | Value |
|---|---|
| **Test Case ID** | TC-031 |
| **Scenario ID** | SC-14 |
| **Test Case Name** | Soft delete dan restore kategori |
| **Pre-conditions** | Kategori uji ada (TC-030) |
| **Test Steps** | 1. Hapus kategori uji (soft delete)<br>2. Verifikasi tidak muncul di dropdown mahasiswa<br>3. Restore kategori<br>4. Verifikasi muncul kembali |
| **Test Data** | Kategori dari TC-030 |
| **Expected Result** | Soft delete dan restore berfungsi; audit log mencatat aksi |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

---

### SC-15 & SC-16: Manajemen Pengguna & Audit Log

#### TC-032 — Admin Soft Delete & Restore Pengguna

| Field | Value |
|---|---|
| **Test Case ID** | TC-032 |
| **Scenario ID** | SC-15 |
| **Test Case Name** | Nonaktifkan dan pulihkan akun pengguna |
| **Pre-conditions** | Admin login; akun uji tersedia |
| **Test Steps** | 1. Buka `/admin/users`<br>2. Soft delete akun uji<br>3. Restore akun tersebut |
| **Test Data** | Akun mahasiswa uji |
| **Expected Result** | Akun ter-soft delete tidak dapat login; setelah restore dapat login kembali |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-033 — Audit Log Mencatat Aksi Sensitif

| Field | Value |
|---|---|
| **Test Case ID** | TC-033 |
| **Scenario ID** | SC-16 |
| **Test Case Name** | Verifikasi pencatatan audit log |
| **Pre-conditions** | Login sebagai SUPERADMIN; beberapa aksi admin sudah dilakukan (TC-010, TC-025) |
| **Test Steps** | 1. Buka `/admin/audit-logs` sebagai SuperAdmin<br>2. Filter berdasarkan aksi `UPDATE_STATUS` dan `VERIFY_MAHASISWA`<br>3. Periksa detail entri<br>4. Coba akses halaman yang sama sebagai Admin biasa |
| **Test Data** | — |
| **Expected Result** | SuperAdmin dapat melihat log berisi actor, waktu, entity, IP/user-agent; Admin biasa ditolak; log tidak dapat diubah pengguna |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

---

### SC-17: Keamanan & Sesi Perangkat

#### TC-034 — Daftar Perangkat Aktif & Logout Remote

| Field | Value |
|---|---|
| **Test Case ID** | TC-034 |
| **Scenario ID** | SC-17 |
| **Test Case Name** | Manajemen sesi multi-perangkat |
| **Pre-conditions** | Akun login di 2 browser/perangkat berbeda |
| **Test Steps** | 1. Buka `/settings` pada salah satu perangkat<br>2. Lihat daftar perangkat aktif<br>3. Logout dari perangkat lain |
| **Test Data** | Chrome + Firefox |
| **Expected Result** | Daftar perangkat tampil; perangkat yang di-logout remote tidak dapat mengakses sistem |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-035 — Proteksi Akses File Lampiran

| Field | Value |
|---|---|
| **Test Case ID** | TC-035 |
| **Scenario ID** | SC-17 |
| **Test Case Name** | File upload tidak dapat diakses tanpa otorisasi |
| **Pre-conditions** | Laporan dengan lampiran ada |
| **Test Steps** | 1. Copy URL file lampiran<br>2. Akses URL tanpa login<br>3. Akses dengan akun yang bukan pemilik/admin |
| **Test Data** | URL `/uploads/...` |
| **Expected Result** | Akses ditolak (401/403); hanya pemilik laporan dan admin berwenang yang dapat mengunduh |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-041 — Cache API Dibersihkan Setelah Logout

| Field | Value |
|---|---|
| **Test Case ID** | TC-041 |
| **Scenario ID** | SC-17 |
| **Test Case Name** | Data API tidak tersisa di cache setelah logout |
| **Pre-conditions** | Service worker aktif; User A login dan membuka dashboard/laporan sehingga request GET `/v1/api/` terjadi |
| **Test Steps** | 1. Login sebagai User A dan buka `/dashboard`<br>2. Buka DevTools → Application → Cache Storage; catat entri cache dinamis (jika ada)<br>3. Logout User A<br>4. Periksa Cache Storage kembali<br>5. Tanpa login, coba muat ulang halaman atau akses endpoint API via fetch di konsol<br>6. Login sebagai User B di browser yang sama |
| **Test Data** | User A & User B (mahasiswa berbeda) pada browser bersama (mis. Chrome profil guest/incognito) |
| **Expected Result** | Setelah logout, cache dinamis/sensitif (`dynamic-v*`, `images-v*`, `ubh-pengaduan-v*`) terhapus; User B tidak melihat data laporan/profil User A dari cache offline; request API selalu diambil dari jaringan |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | Verifikasi juga skenario shared browser: User A logout → User B login tidak melihat data User A |

---

### SC-18: Superadmin Governance

#### TC-036 — Superadmin Assign Kategori ke Admin

| Field | Value |
|---|---|
| **Test Case ID** | TC-036 |
| **Scenario ID** | SC-18 |
| **Test Case Name** | Pemberian akses kategori per admin |
| **Pre-conditions** | Login SUPERADMIN; ada akun ADMIN tanpa assignment |
| **Test Steps** | 1. Buka `/admin/admins`<br>2. Pilih admin<br>3. Assign kategori `Akademik` dan `Sarana dan Prasarana`<br>4. Simpan |
| **Test Data** | Admin: `admin@kampus.ac.id` |
| **Expected Result** | Admin hanya melihat laporan dari kategori yang di-assign; aksi tercatat di audit log |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-037 — Admin Tanpa Assignment Tidak Melihat Laporan

| Field | Value |
|---|---|
| **Test Case ID** | TC-037 |
| **Scenario ID** | SC-18 |
| **Test Case Name** | Validasi isolasi akses admin berdasarkan kategori |
| **Pre-conditions** | Admin belum di-assign kategori apapun |
| **Test Steps** | 1. Login sebagai admin tanpa assignment<br>2. Buka `/admin/reports` |
| **Test Data** | Admin tanpa assignment |
| **Expected Result** | Daftar laporan kosong atau akses dibatasi sesuai kebijakan RBAC |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

---

### SC-19 & SC-20: Profil, Pengaturan & Halaman Publik

#### TC-038 — Update Profil & Ubah Password

| Field | Value |
|---|---|
| **Test Case ID** | TC-038 |
| **Scenario ID** | SC-19 |
| **Test Case Name** | Mahasiswa memperbarui profil mandiri |
| **Pre-conditions** | Mahasiswa login |
| **Test Steps** | 1. Buka `/profile`<br>2. Ubah nama tampilan<br>3. Buka `/settings`<br>4. Ubah password dengan password lama benar |
| **Test Data** | Nama baru: `Budi S.`, Password baru: `UpdatedPass789!` |
| **Expected Result** | Profil terupdate; password berhasil diubah; seluruh sesi termasuk sesi aktif dicabut; pengguna diarahkan untuk login ulang; password lama gagal dan password baru berhasil |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-039 — Halaman Bantuan & 404

| Field | Value |
|---|---|
| **Test Case ID** | TC-039 |
| **Scenario ID** | SC-20 |
| **Test Case Name** | Navigasi halaman publik dan error page |
| **Pre-conditions** | Tidak perlu login |
| **Test Steps** | 1. Buka `/` (landing page)<br>2. Buka `/help`<br>3. Buka URL tidak valid `/xyz-tidak-ada` |
| **Test Data** | URL invalid |
| **Expected Result** | Landing page dan help page tampil; URL invalid menampilkan halaman 404 Not Found |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

---

### SC-21: Remediation & Security Hardening

#### TC-042 — Admin Biasa Tidak Dapat Kelola Admin Tier

| Field | Value |
|---|---|
| **Test Case ID** | TC-042 |
| **Scenario ID** | SC-21 |
| **Test Case Name** | Regular admin ditolak saat promosi/demosi admin |
| **Pre-conditions** | Login sebagai ADMIN (bukan SUPERADMIN) |
| **Test Steps** | 1. Buka `/admin/admins` atau endpoint governance setara<br>2. Coba promosi mahasiswa ke admin atau demosi admin lain<br>3. Periksa respons API/UI |
| **Test Data** | Akun `admin@kampus.ac.id` |
| **Expected Result** | Aksi ditolak (403) dengan kode error governance; tidak ada perubahan role di database |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-043 — Superadmin Terakhir Tidak Dapat Dihapus/Didemosi

| Field | Value |
|---|---|
| **Test Case ID** | TC-043 |
| **Scenario ID** | SC-21 |
| **Test Case Name** | Proteksi superadmin terakhir |
| **Pre-conditions** | Hanya satu SUPERADMIN aktif di sistem |
| **Test Steps** | 1. Login sebagai SUPERADMIN tunggal<br>2. Coba demosi diri sendiri atau soft delete akun superadmin<br>3. Coba hapus permanen superadmin terakhir |
| **Test Data** | Akun superadmin bootstrap |
| **Expected Result** | Semua aksi destruktif ditolak (`LAST_SUPERADMIN`); sistem tetap memiliki minimal satu SUPERADMIN |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-044 — Dashboard Admin Scoped ke Kategori Assignment

| Field | Value |
|---|---|
| **Test Case ID** | TC-044 |
| **Scenario ID** | SC-21 |
| **Test Case Name** | Statistik admin hanya mencakup kategori yang di-assign |
| **Pre-conditions** | Admin di-assign ke subset kategori (mis. `Akademik` saja); ada laporan di kategori lain |
| **Test Steps** | 1. Login sebagai admin terbatas<br>2. Buka `/admin` dan `/admin/analytics`<br>3. Bandingkan angka dengan login SUPERADMIN<br>4. Periksa metadata respons API `scope` |
| **Test Data** | Admin dengan assignment 1 kategori |
| **Expected Result** | Kartu statistik dan grafik hanya mencerminkan laporan kategori assignment; metadata `scope.type = category` dan `categoryIds` sesuai assignment |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-045 — Upload File Invalid & Path Tidak Dikenal Ditolak

| Field | Value |
|---|---|
| **Test Case ID** | TC-045 |
| **Scenario ID** | SC-21 |
| **Test Case Name** | Validasi MIME/magic bytes dan blokir path upload tidak sah |
| **Pre-conditions** | Pengguna login dengan hak upload |
| **Test Steps** | 1. Coba upload file `.exe` atau gambar dengan ekstensi palsu ke lampiran laporan/chat<br>2. Akses langsung URL `/uploads/chat-pending/...` atau path upload tidak dikenal<br>3. Verifikasi file valid (JPEG/PDF) tetap berhasil |
| **Test Data** | `fake.jpg` (isi bukan gambar), path manual `/uploads/unknown/foo` |
| **Expected Result** | File invalid ditolak; path pending/unknown mengembalikan 404/403; file valid tersimpan dengan nama acak |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-046 — Chat Sukses Meski Email Gagal & Tanpa Duplikat Pesan

| Field | Value |
|---|---|
| **Test Case ID** | TC-046 |
| **Scenario ID** | SC-21 |
| **Test Case Name** | Pengiriman chat resilient + idempotency |
| **Pre-conditions** | SMTP tidak dikonfigurasi atau sengaja gagal; penerima offline |
| **Test Steps** | 1. Kirim pesan chat dengan `clientMessageId` unik<br>2. Verifikasi respons HTTP 201 sebelum notifikasi email selesai<br>3. Ulangi request yang sama (retry/idempotency)<br>4. Periksa database: hanya satu record pesan |
| **Test Data** | `clientMessageId: uat-msg-001` |
| **Expected Result** | Pesan tersimpan dan tampil di UI meski email gagal; retry tidak membuat duplikat |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | |

#### TC-047 — `/uploads/` Tidak Disimpan di Cache Storage

| Field | Value |
|---|---|
| **Test Case ID** | TC-047 |
| **Scenario ID** | SC-21 |
| **Test Case Name** | Service worker network-only untuk upload sensitif |
| **Pre-conditions** | Service worker v3+ aktif; pengguna login dan buka lampiran |
| **Test Steps** | 1. Buka lampiran laporan/chat<br>2. DevTools → Application → Cache Storage<br>3. Cari entri untuk URL `/uploads/...`<br>4. Putuskan jaringan dan coba muat ulang lampiran |
| **Test Data** | URL lampiran authorized |
| **Expected Result** | Request `/uploads/` tidak masuk cache SW; offline reload lampiran gagal (network-only) |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | Melengkapi TC-041 (purge API cache) |

#### TC-048 — Refresh & Reset Token Single-Use

| Field | Value |
|---|---|
| **Test Case ID** | TC-048 |
| **Scenario ID** | SC-21 |
| **Test Case Name** | Token refresh dan reset password tidak dapat dipakai ulang |
| **Pre-conditions** | Sesi aktif; token reset password valid |
| **Test Steps** | 1. Salin refresh token cookie/value setelah login<br>2. Gunakan refresh sekali → sukses<br>3. Ulangi refresh dengan token lama → ditolak<br>4. Reset password dengan token valid → sukses<br>5. Coba token reset yang sama lagi → ditolak |
| **Test Data** | Token reset dari TC-008 |
| **Expected Result** | Refresh rotation atomik; token lama invalid; reset token marked used; sesi lama dicabut |
| **Actual Result** | |
| **Status** | ☐ Passed ☐ Failed ☐ Blocked |
| **Notes** | Migrasi `tokenHash` SHA-256 — deploy production memaksa re-login semua user |

---

## 6. UAT Summary Report

> **Diisi setelah seluruh test case dijalankan.**

### 6.1. Statistik Pengujian

| Metrik | Nilai |
|---|---|
| Total Test Cases | 48 |
| Passed | |
| Failed | |
| Blocked | |
| Not Executed | |
| Pass Rate | % |

### 6.2. Ringkasan per Modul

| Modul | Total TC | Passed | Failed | Pass Rate |
|---|---|---|---|---|
| AUTH (SC-01 s/d SC-03, SC-21) | 10 | | | |
| USR (SC-04, SC-15, SC-18, SC-19, SC-21) | 8 | | | |
| REP (SC-05 s/d SC-08, SC-12) | 11 | | | |
| CHT (SC-09, SC-21) | 4 | | | |
| DSB (SC-10, SC-11, SC-21) | 4 | | | |
| BLK (SC-13) | 2 | | | |
| CAT (SC-14) | 2 | | | |
| AUD (SC-16) | 1 | | | |
| SEC (SC-17, SC-21) | 4 | | | |
| UI (SC-20) | 1 | | | |

### 6.3. Critical Issues

| Issue ID | Test Case | Deskripsi | Severity | Status |
|---|---|---|---|---|
| | | | Critical / Major / Minor | Open / Fixed |

### 6.4. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| SMTP belum dikonfigurasi di kampus | TC-008/009 blocked | Konfigurasi SMTP staging sebelum UAT final |
| Admin belum di-assign kategori | TC-025+ gagal | Superadmin assign kategori di awal UAT |
| Data uji tidak cukup | Beberapa skenario tidak teruji | Seed data uji minimal 5 laporan, 3 mahasiswa |
| Pembatalan laporan oleh mahasiswa belum tersedia pada baseline | TC-017/018 blocked | Implementasikan aksi pembatalan pelapor sesuai SRS sebelum keputusan Go Live |
| Migrasi token hash memaksa re-login | Semua user harus login ulang pasca-deploy | Komunikasikan ke stakeholder sebelum deploy production |

### 6.5. Rekomendasi & Keputusan

| Keputusan | ☐ **Go Live** — Sistem siap deployment dengan catatan minor |
|---|---|
| | ☐ **Go with Conditions** — Siap setelah perbaikan isu critical/major |
| | ☐ **No Go** — Perlu perbaikan signifikan dan UAT ulang |

**Justifikasi:**

*(Diisi UAT Lead setelah review hasil — kaitkan dengan tujuan UAT di §1.1)*

---

## 7. Approval

Dengan ini kami menyatakan bahwa sistem **Sistem Pelaporan dan Pengaduan Kemahasiswaan Universitas Bung Hatta** telah diuji dan disetujui sesuai dengan kriteria UAT serta siap untuk dilakukan deployment, dengan memperhatikan catatan-catatan yang telah disebutkan di atas.

*We hereby confirm that the system has been tested and approved according to the UAT criteria and is ready for deployment, subject to the notes above.*

| Name | Role | Signature | Date |
|---|---|---|---|
| | UAT Lead / Software Tester | | |
| | Business User Representative (UBH) | | |
| | Project Manager | | |
| | Supervisor (Dosen Pembimbing) | | |

---

## Lampiran

### A. Traceability Matrix (SRS → UAT)

| SRS Requirement | Test Case(s) |
|---|---|
| FR-AUTH-01 | TC-001, TC-002, TC-003 |
| FR-AUTH-02 | TC-004, TC-005, TC-006 |
| FR-AUTH-06 | TC-007 |
| FR-AUTH-07 | TC-034 |
| FR-USR-01 | TC-010, TC-011, TC-029 |
| FR-USR-02 | TC-032 |
| FR-USR-04 | TC-038 |
| FR-REP-01 | TC-012, TC-013 |
| FR-REP-02 | TC-012 |
| FR-REP-03 | TC-015 |
| FR-REP-05 | TC-022 |
| FR-REP-06 | TC-025, TC-027, TC-028 |
| FR-REP-07 | TC-017, TC-018 |
| FR-REP-08 | TC-040 |
| FR-CHT-01 s/d 05 | TC-019, TC-020, TC-021 |
| FR-DSB-01, 02 | TC-023, TC-024 |
| FR-DSB-03 | TC-022 |
| FR-CAT-* | TC-030, TC-031 |
| FR-AUD-* | TC-026, TC-033 |
| FR-BLK-* | TC-028, TC-029 |
| *(Remediasi Juni 2026)* | TC-042 s/d TC-048 |

### B. Checklist Persiapan UAT

- [ ] Environment backend + frontend + database berjalan stabil
- [ ] Data seed (kategori, superadmin) sudah dijalankan
- [ ] Akun uji mahasiswa & admin sudah disiapkan
- [ ] Browser penguji terinstal (Chrome terbaru)
- [ ] Template pencatatan screenshot siap
- [ ] Stakeholder UBH dijadwalkan untuk review demo
- [ ] Defect tracking (GitHub Issues) siap digunakan
