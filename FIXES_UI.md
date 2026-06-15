# Perbaikan UI Website Pengaduan Kemahasiswaan — Audit Final

## Perbaikan utama

1. **Notifikasi**
   - Ikon notifikasi admin membuka ringkasan akun/laporan yang memerlukan perhatian dan menyegarkan data saat dibuka.
   - Ikon notifikasi mahasiswa membuka pembaruan laporan.
   - Badge mahasiswa menggunakan status belum dibaca berbasis waktu terakhir menu notifikasi dibuka.

2. **Detail laporan dalam popup**
   - Detail laporan admin dan mahasiswa dibuka dalam dialog/modal tanpa meninggalkan halaman daftar.
   - URL lama `/report/:id` dan `/admin/reports/:id` dialihkan ke halaman daftar dan otomatis membuka popup terkait.
   - Komponen halaman detail penuh lama dihapus agar pola interaksi tidak ganda.

3. **Aksi konsisten**
   - Aksi per baris/kartu memakai menu titik tiga pada laporan, pengguna, verifikasi pengguna, kategori, log audit, perangkat, dan pengelolaan admin.
   - Aksi massal tetap memakai satu menu ringkas.

4. **Tabel responsif**
   - Tabel utama menggunakan `table-layout: fixed` dan tidak memaksa scroll horizontal.
   - Kolom sekunder disembunyikan sesuai breakpoint.
   - Daftar kategori berubah menjadi kartu pada layar kecil.
   - Daftar utama lainnya sudah memiliki tampilan kartu atau kolom responsif pada layar kecil.

5. **UI lebih ringkas**
   - Padding, jarak vertikal, bayangan, dan ruang kosong pada halaman utama dikurangi.
   - Kartu dan header dibuat lebih padat tanpa menghilangkan informasi penting.

6. **Bahasa lebih konsisten**
   - Istilah utama diseragamkan ke Bahasa Indonesia, termasuk Dasbor, Analitik, Segarkan, Prioritas Bawaan, Unggah, Menunggu, Selesai, Ditolak, dan Dihapus sementara.

## Validasi terakhir

- `npm run lint -- --max-warnings=0` — lulus tanpa error/peringatan.
- `npx vitest run --project unit` — 21 pengujian lulus.
- `npm run build` — build produksi berhasil.
- Pengujian komponen berbasis Chromium tidak dapat diselesaikan di lingkungan audit karena akses browser ke server lokal diblokir oleh kebijakan lingkungan (`ERR_BLOCKED_BY_ADMINISTRATOR`). Ini bukan error kompilasi aplikasi.

## Catatan penggunaan

Jalankan dari folder proyek:

```bash
npm run install-all
npm start
```

Konfigurasi database dan variabel lingkungan tetap mengikuti `.env.example` dan README proyek.
