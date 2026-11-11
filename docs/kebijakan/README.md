# Draf Kebijakan Layanan Pengaduan

> **Status: DRAF.** Belum berlaku. Ketiga dokumen di folder ini disusun oleh tim pengembang dari perilaku sistem yang sebenarnya, sebagai bahan awal. Isinya harus ditinjau, dilengkapi, dan disahkan oleh Bagian Kemahasiswaan, bagian hukum, dan pimpinan Universitas Bung Hatta sebelum diumumkan.

| Dokumen | Untuk siapa | Isi |
| --- | --- | --- |
| [KebijakanPrivasi.md](KebijakanPrivasi.md) | Mahasiswa dan semua pengguna | Data apa yang disimpan, untuk apa, siapa yang bisa melihatnya, batas anonimitas, pihak ketiga, dan hak pengguna |
| [SOPPenangananPengaduan.md](SOPPenangananPengaduan.md) | Admin dan superadmin | Alur status laporan, target waktu, penanganan laporan anonim dan kekerasan seksual, kerahasiaan |
| [RetensiData.md](RetensiData.md) | Superadmin dan petugas TI | Apa yang dihapus otomatis oleh sistem, apa yang tidak, usulan masa simpan, dan cara menghapus data atas permintaan |

## Yang harus diisi kampus

Semua isian ditandai `[ISI: ...]`. Cari dengan:

```bash
grep -n "\[ISI" docs/kebijakan/*.md
```

Isian terpenting:

- **Penanggung jawab pelindungan data** dan alamat email untuk permintaan pengguna (akses, perbaikan, penghapusan data).
- **Target waktu penanganan**, misalnya verifikasi akun, tinjauan awal, dan laporan berprioritas `URGENT`.
- **Unit tujuan eskalasi** untuk laporan kekerasan seksual. Mengacu Permendikbudristek No. 55 Tahun 2024; nama dan kontak satuan tugas di UBH perlu dipastikan.
- **Masa simpan** laporan, foto KTM, audit log, log server, dan backup.
- **Penyedia email (SMTP)** dan **tempat server** dijalankan.

## Setelah disahkan

1. Publikasikan kebijakan privasi sebagai halaman yang bisa dibuka tanpa login, misalnya di situs kampus.
2. Isi `VITE_PRIVACY_POLICY_URL` di `.env` root dengan alamat halaman itu, lalu bangun ulang image frontend (`docker compose -f docker-compose.prod.yml up -d --build`). Tautan **Kebijakan Privasi** akan muncul di Pusat Bantuan.
3. Bagikan SOP ke semua admin, dan tinjau ulang setiap kali alur penanganan atau fitur sistem berubah.
4. Centang butir kebijakan privasi di checklist serah terima (`docs/SerahTerima.md`).

## Acuan perilaku sistem

Dokumen ini menggambarkan sistem setelah PR #18 (penyamaran identitas pelapor anonim di audit log) dan PR #19 (geolokasi IP mati secara bawaan). Bila salah satu PR itu belum digabung, sesuaikan bagian terkait.
