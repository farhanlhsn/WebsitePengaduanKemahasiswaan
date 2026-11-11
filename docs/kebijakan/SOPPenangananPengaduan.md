# SOP Penanganan Pengaduan Kemahasiswaan

> **DRAF — belum berlaku.** Disusun dari alur yang didukung sistem. Target waktu, unit tujuan, dan penanggung jawab harus ditetapkan Bagian Kemahasiswaan.

Berlaku sejak: [ISI: tanggal]  ·  Pemilik SOP: [ISI: jabatan]  ·  Ditinjau ulang: setiap [ISI: mis. tahun ajaran]

## 1. Tujuan dan ruang lingkup

SOP ini mengatur cara admin dan superadmin menangani laporan yang masuk lewat Sistem Pengaduan Kemahasiswaan: dari verifikasi akun pelapor sampai laporan ditutup. Cara memakai menu aplikasi dijelaskan di [User Manual](../UserManual.md); SOP ini mengatur **apa yang harus dilakukan dan kapan**.

## 2. Peran

| Peran | Tanggung jawab |
| --- | --- |
| Mahasiswa (pelapor) | Membuat laporan, melengkapi informasi bila diminta, membatalkan laporan yang masih Menunggu |
| Admin | Menangani laporan di kategori yang ditugaskan kepadanya; memverifikasi akun mahasiswa |
| Superadmin | Menugaskan kategori ke admin, mengelola akun dan kategori, memantau audit log, menangani eskalasi |
| Unit tindak lanjut | Unit di luar sistem yang menindaklanjuti laporan sesuai kewenangannya: [ISI: daftar unit per kategori] |
| Satuan tugas kekerasan seksual | Menangani laporan kategori Kekerasan Seksual: [ISI: nama satuan tugas, kontak] (Permendikbudristek No. 55 Tahun 2024) |

## 3. Target waktu

| Tahap | Target | Catatan |
| --- | --- | --- |
| Verifikasi akun mahasiswa baru | [ISI] hari kerja | Mahasiswa belum bisa login sebelum diverifikasi |
| Laporan prioritas URGENT (bawaan: Kekerasan Seksual) dari Menunggu ke Ditinjau | [ISI] jam | Termasuk di luar jam kerja? [ISI: ya/tidak] |
| Laporan lain dari Menunggu ke Ditinjau | [ISI] hari kerja | |
| Pembaruan ke pelapor selama Ditinjau/Diproses | Paling lambat setiap [ISI] hari kerja | Lewat percakapan, walaupun belum ada perkembangan |
| Penyelesaian | [ISI, atau "sesuai kompleksitas"] | Bila melewati target, beri tahu pelapor perkiraan waktunya |

Jangan menjanjikan waktu yang tidak ditetapkan di tabel ini kepada pelapor.

## 4. Alur penanganan

```
Menunggu ──► Ditinjau ──► Diproses ──► Selesai
   │            │            │            │
   ├──► Ditolak ◄────────────┘            └──► Ditinjau (dibuka kembali)
   └──► Dibatalkan (oleh pelapor, atau petugas dari Ditinjau/Diproses)
```

### 4.1 Verifikasi akun

1. Buka **Pengguna Belum Verifikasi**, klik **Lihat KTM**, dan cocokkan nama serta NIM pendaftar dengan foto KTM.
2. Bila cocok dan KTM terbaca jelas, **Verifikasi**.
3. Bila tidak, **Tolak** dengan alasan yang jelas (mis. "Foto KTM buram, unggah ulang foto yang terbaca"). Alasan dikirim ke email pendaftar.
4. Jangan menyimpan, memotret, atau meneruskan foto KTM ke luar sistem.

### 4.2 Menunggu → Ditinjau

1. Baca laporan dan lampirannya. Pastikan kategorinya tepat.
2. Bila kategori salah, [ISI: prosedur, mis. minta superadmin atau pelapor memindahkan kategori].
3. Ubah status ke **Ditinjau** dan kirim pesan pembuka di percakapan: laporan diterima, siapa yang menangani (cukup jabatan), dan langkah berikutnya.
4. Bila laporan bukan wewenang layanan ini, atau tidak bisa ditindaklanjuti sama sekali, ubah ke **Ditolak** dengan alasan dan, bila ada, arahkan ke saluran yang tepat.

### 4.3 Ditinjau → Diproses

1. Bila perlu informasi tambahan, tanyakan lewat percakapan. Jangan meminta pelapor datang langsung atau menghubungi lewat kanal pribadi kecuali pelapor sendiri memintanya.
2. Teruskan ke unit tindak lanjut hanya informasi yang diperlukan. Untuk laporan anonim, lihat bagian 5.
3. Ubah ke **Diproses** saat tindak lanjut sudah berjalan, dan catat di percakapan apa yang sedang dilakukan.

### 4.4 Menutup laporan

- **Selesai**: tulis ringkasan hasil penanganan di percakapan sebelum mengubah status.
- **Ditolak**: alasan wajib diisi dan terlihat oleh pelapor. Tulis dengan bahasa yang sopan dan spesifik.
- **Dibatalkan oleh petugas**: hanya bila pelapor meminta lewat percakapan, atau laporan ganda. Alasan wajib diisi.
- Laporan yang sudah ditutup bisa dibuka kembali (kembali ke Ditinjau) bila ada informasi baru.

### 4.5 Operasi massal

Ubah status secara massal hanya untuk laporan yang memang sejenis (mis. laporan ganda tentang kejadian yang sama), dan isi alasan yang berlaku untuk semuanya.

## 5. Laporan anonim dan laporan sensitif

- **Jangan mencoba mencari tahu identitas pelapor anonim**: tidak menebak dari gaya bahasa, tidak menanyakan identitas, tidak meminta petugas TI membuka database. Pelanggaran dicatat sebagai pelanggaran SOP: [ISI: sanksi].
- Bila pelapor anonim memerlukan tindak lanjut yang mensyaratkan identitas (mis. pendampingan), jelaskan kebutuhannya di percakapan dan biarkan pelapor sendiri yang memutuskan untuk mengungkap identitasnya.
- **Kekerasan seksual**: teruskan ke [ISI: satuan tugas] paling lambat [ISI] jam setelah laporan masuk, lewat [ISI: kanal resmi]. Jangan meneruskan lampiran lewat aplikasi pesan pribadi atau email pribadi.
- **Konflik kepentingan**: bila laporan menyangkut diri Anda sendiri atau orang yang dekat dengan Anda, jangan menanganinya. Laporkan ke superadmin agar ditangani admin lain.
- **Bahaya mendesak** (ancaman keselamatan, rencana bunuh diri, kekerasan yang sedang berlangsung): jangan menunggu alur sistem. Hubungi [ISI: kontak darurat kampus/keamanan/layanan konseling] saat itu juga, lalu catat tindakan di percakapan.

## 6. Kerahasiaan

- Akses Sistem hanya dari akun sendiri; jangan berbagi akun atau password.
- Jangan menyalin isi laporan, lampiran, atau tangkapan layar ke grup pesan, email pribadi, atau perangkat pribadi.
- Ekspor CSV hanya untuk keperluan yang disetujui [ISI: jabatan], disimpan di [ISI: lokasi resmi], dan dihapus setelah tidak diperlukan.
- Logout dari perangkat bersama. Tinjau **Perangkat Aktif** bila curiga akun dipakai orang lain, klik **Logout Perangkat Lain**, lalu ganti password.

## 7. Tugas superadmin

| Kapan | Tugas |
| --- | --- |
| Saat ada admin baru atau pindah tugas | Beri atau cabut kategori. Admin yang keluar diturunkan perannya atau dihapus akunnya pada hari yang sama |
| Setiap [ISI: bulan] | Tinjau daftar admin dan kategorinya; tinjau audit log untuk tindakan yang tidak wajar (mis. banyak `VIEW_ANONYMOUS`, ekspor, atau penghapusan) |
| Setiap [ISI: bulan/semester] | Laporkan statistik penanganan ke [ISI: pimpinan] dari menu Analitik |
| Setiap [ISI: tahun] | Jalankan jadwal retensi data (`RetensiData.md`) dan tinjau ulang SOP ini |

## 8. Riwayat perubahan

| Versi | Tanggal | Perubahan |
| --- | --- | --- |
| [ISI] | [ISI] | Versi pertama |
