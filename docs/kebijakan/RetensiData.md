# Kebijakan Retensi Data

> **DRAF — belum berlaku.** Bagian 1 menggambarkan perilaku sistem saat ini, diperiksa dari kode (November 2026). Bagian 2 berisi usulan masa simpan yang harus ditetapkan kampus.

## 1. Perilaku sistem saat ini

### 1.1 Yang dihapus otomatis

Job harian pukul 03.00 WIB (`backend/src/jobs/cleanupJob.js`) menghapus:

| Data | Kapan dihapus |
| --- | --- |
| Refresh token (sesi login) | Setelah kedaluwarsa (7 hari sejak login atau sejak terakhir diperbarui) |
| Token reset password | 24 jam setelah kedaluwarsa atau dipakai |
| Berkas chat yang diunggah tetapi tidak jadi dikirim | Setelah 24 jam |

### 1.2 Yang tidak pernah dihapus otomatis

Akun, foto KTM, laporan, lampiran, pesan percakapan, dan audit log **disimpan tanpa batas waktu** sampai dihapus secara manual. Log kontainer Docker juga tidak dirotasi secara bawaan.

### 1.3 Cara menghapus yang tersedia

| Tindakan | Siapa | Akibat |
| --- | --- | --- |
| Hapus akun (sementara) | Admin untuk mahasiswa, superadmin untuk semua | Akun tidak bisa login dan disembunyikan dari daftar. Data masih ada dan bisa dipulihkan. |
| Hapus permanen akun | Superadmin | Baris akun dan foto KTM dihapus. Laporannya **tetap ada** tanpa pemilik (`userId` dikosongkan). **Semua pesan yang pernah dikirim akun itu ikut terhapus**, termasuk balasan admin di laporan mahasiswa lain. |
| Bersihkan akun terhapus > N hari (`POST /users/cleanup?daysOld=N`, bawaan 90) | Superadmin | Menghapus permanen semua akun yang sudah dihapus sementara lebih dari N hari. **Foto KTM akun-akun itu tidak ikut terhapus dari disk**; berkasnya harus dihapus manual (lihat 3.3). |
| Hapus laporan (sementara) | Admin di kategorinya | Laporan disembunyikan, bisa dipulihkan |
| Hapus permanen laporan | Admin | Laporan, lampiran (termasuk berkasnya), dan percakapannya dihapus |

Karena dua keterbatasan di atas, sebelum menghapus permanen akun **admin**, pertimbangkan cukup menghapusnya sementara atau menurunkan perannya, agar riwayat percakapan di laporan tetap utuh.

## 2. Usulan masa simpan

Masa simpan di bawah ini adalah **usulan** untuk didiskusikan. Kolom "Cara" menunjukkan apa yang bisa dilakukan dengan sistem saat ini.

| Data | Usulan masa simpan | Cara |
| --- | --- | --- |
| Foto KTM | [ISI: mis. sampai akun dihapus] | Ikut terhapus saat hapus permanen akun satu per satu; lewat cleanup massal, hapus berkas manual |
| Akun mahasiswa yang sudah lulus/tidak aktif | [ISI: mis. 1 tahun setelah lulus] | Hapus sementara, lalu cleanup setelah 90 hari |
| Laporan yang sudah ditutup (Selesai/Ditolak/Dibatalkan) | [ISI: mis. 5 tahun sejak ditutup] | Hapus permanen laporan |
| Laporan kekerasan seksual | [ISI: ikuti ketentuan satuan tugas] | Sama dengan di atas, setelah koordinasi dengan satuan tugas |
| Audit log | [ISI: mis. 2 tahun] | Belum ada menu; perlu perintah SQL oleh petugas TI (3.2) |
| Log server (Docker) | [ISI: mis. 30 hari] | Atur rotasi log Docker (3.4) |
| Backup database dan berkas | [ISI: mis. 30 hari, terenkripsi] | Prosedur backup di `docs/ProductionRunbook.md` |

Peninjauan: superadmin menjalankan jadwal ini setiap [ISI: tahun/semester] dan mencatatnya di [ISI: tempat pencatatan].

## 3. Prosedur

### 3.1 Permintaan penghapusan data dari pengguna

1. Terima permintaan lewat [ISI: email penanggung jawab pelindungan data]. Pastikan pengirim adalah pemilik akun (email yang sama dengan email akun).
2. Periksa apakah pengguna masih punya laporan yang sedang ditangani. Bila ya, jelaskan bahwa laporan itu disimpan sampai selesai, lalu dihapus atau dianonimkan sesuai bagian 2.
3. Hapus akun secara permanen dari menu manajemen pengguna (superadmin).
4. Bila laporan pengguna juga harus dihapus, hapus permanen laporan-laporannya **sebelum** menghapus akun: setelah akun dihapus, laporan tidak lagi terhubung ke pemiliknya dan sulit dicari.
5. Balas pemohon dalam [ISI] hari kerja dan catat permintaannya.

### 3.2 Menghapus audit log lama

Belum ada menu untuk ini. Petugas TI dapat menjalankan, setelah backup:

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U postgres -d pengaduan -c "DELETE FROM \"AuditLog\" WHERE \"createdAt\" < now() - interval '[ISI: mis. 2 years]';"
```

### 3.3 Menghapus foto KTM yang tidak lagi punya akun

Setelah `POST /users/cleanup`, cari berkas KTM yang tidak lagi tercatat di database:

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U postgres -d pengaduan -tAc "SELECT \"ktmPath\" FROM users WHERE \"ktmPath\" IS NOT NULL" \
  | sed 's|.*/||' | sort > /tmp/ktm-terpakai.txt
docker compose -f docker-compose.prod.yml exec -T backend ls uploads/ktm | sort > /tmp/ktm-di-disk.txt
comm -13 /tmp/ktm-terpakai.txt /tmp/ktm-di-disk.txt   # berkas tanpa akun
```

Periksa daftarnya, lalu hapus berkas tersebut dari `uploads/ktm` di kontainer backend.

### 3.4 Rotasi log Docker

Tambahkan di `/etc/docker/daemon.json` server, lalu restart Docker dan buat ulang kontainer (`docker compose -f docker-compose.prod.yml up -d --force-recreate`):

```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "[ISI: jumlah berkas]" }
}
```

Dengan `max-size` 10 MB, jumlah berkas menentukan berapa lama log tersimpan; sesuaikan dengan masa simpan log yang ditetapkan.
