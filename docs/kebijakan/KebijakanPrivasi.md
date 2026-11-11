# Kebijakan Privasi Layanan Pengaduan Kemahasiswaan Universitas Bung Hatta

> **DRAF — belum berlaku.** Perlu ditinjau bagian hukum dan disahkan pimpinan. Acuan: Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.

Berlaku sejak: [ISI: tanggal pengesahan]
Versi: [ISI: 1.0]

## 1. Tentang kebijakan ini

Kebijakan ini menjelaskan data pribadi apa yang dikumpulkan oleh Sistem Pengaduan Kemahasiswaan Universitas Bung Hatta ("Sistem"), untuk apa data itu dipakai, siapa yang dapat melihatnya, berapa lama disimpan, dan hak Anda atas data tersebut.

Sistem dikelola oleh Bagian Kemahasiswaan Universitas Bung Hatta.

| | |
| --- | --- |
| Pengelola | Bagian Kemahasiswaan, Universitas Bung Hatta |
| Alamat | Jl. Bagindo Aziz Chan No. 8, Padang |
| Email | kemahasiswaan@bunghatta.ac.id |
| Telepon | (0751) 7051266 |
| Penanggung jawab pelindungan data | [ISI: nama/jabatan] — [ISI: email khusus permintaan data] |

## 2. Data yang kami kumpulkan

| Jenis data | Contoh | Dari mana |
| --- | --- | --- |
| Data akun | Nama, NIM, email kampus, peran (mahasiswa/admin), status verifikasi, preferensi tampilan | Formulir pendaftaran dan profil |
| Password | Hanya disimpan dalam bentuk *hash* (bcrypt); petugas tidak dapat melihat password Anda | Formulir pendaftaran |
| Foto Kartu Tanda Mahasiswa (KTM) | Gambar KTM | Formulir pendaftaran |
| Isi laporan | Judul, deskripsi, kategori, prioritas, status, alasan penolakan atau pembatalan | Formulir laporan, tindakan petugas |
| Lampiran | Foto dan dokumen (PDF, Word) | Unggahan Anda di laporan dan percakapan |
| Percakapan | Isi pesan, lampiran, dan siapa yang sudah membaca pesan | Fitur percakapan |
| Sesi dan perangkat | Jenis perangkat/browser, alamat IP, waktu terakhir dipakai | Otomatis saat Anda login |
| Riwayat aktivitas (audit log) | Tindakan seperti mengubah status laporan, memverifikasi akun, menghapus data, beserta waktu, alamat IP, dan browser pelakunya | Otomatis |
| Log server | Alamat IP, waktu, dan alamat halaman/API yang diminta | Otomatis oleh server |

Foto yang Anda unggah diperkecil otomatis, dan dalam proses itu **metadata foto (termasuk lokasi GPS dan model kamera) dihapus**. Dokumen PDF dan Word **disimpan apa adanya**: properti dokumen sering memuat nama penulis.

## 3. Untuk apa data dipakai

- Memastikan pengguna adalah mahasiswa Universitas Bung Hatta (verifikasi KTM).
- Menerima, meneruskan ke petugas yang berwenang, dan menindaklanjuti laporan Anda.
- Berkomunikasi dengan Anda tentang laporan, termasuk mengirim email pemberitahuan perubahan status, pesan baru, dan reset password.
- Menjaga keamanan Sistem: mencegah penyalahgunaan, membatasi percobaan login, dan menelusuri tindakan petugas.
- Menyusun statistik penanganan pengaduan untuk pimpinan. Statistik tidak memuat identitas pelapor.
- [ISI: kewajiban hukum lain bila ada, mis. permintaan resmi aparat penegak hukum]

Data **tidak** dijual, **tidak** dipakai untuk iklan, dan **tidak** dipakai untuk tujuan lain di luar layanan pengaduan tanpa persetujuan Anda.

## 4. Siapa yang dapat melihat data Anda

| Pihak | Yang dapat dilihat |
| --- | --- |
| Anda sendiri | Semua data akun dan laporan Anda, termasuk laporan anonim |
| Admin (petugas kategori) | Laporan **hanya** di kategori yang ditugaskan kepadanya, beserta identitas pelapor (kecuali laporan anonim), lampiran, dan percakapannya. Admin juga melihat data akun mahasiswa untuk verifikasi, termasuk foto KTM. |
| Superadmin | Semua laporan, semua akun, dan audit log, **kecuali** identitas pelapor laporan anonim |
| Petugas TI pengelola server | Secara teknis dapat mengakses database dan berkas. Akses dibatasi pada petugas yang ditunjuk: [ISI: jabatan/unit] |
| Unit tindak lanjut | Bila laporan perlu ditangani unit lain (mis. satuan tugas kekerasan seksual), petugas meneruskan informasi yang diperlukan saja, sesuai SOP penanganan |

## 5. Laporan anonim dan batasnya

Untuk kategori tertentu (secara bawaan: Kekerasan Seksual, Diskriminasi, Penyalahgunaan Wewenang Dosen/Staff, Korupsi, Pelanggaran Hak Asasi Manusia), Anda dapat melapor secara anonim.

Pada laporan anonim:

- Nama, NIM, dan email Anda **disembunyikan dari semua petugas di aplikasi, termasuk superadmin**. Pesan Anda di percakapan tampil sebagai "Anonim", dan tindakan Anda atas laporan itu tercatat di audit log sebagai "Anonim" tanpa alamat IP.
- Laporan **tetap terhubung ke akun Anda di database**, agar Anda bisa memantau dan membalas pesan. Artinya anonimitas berlaku terhadap petugas di aplikasi, bukan terhadap petugas TI yang mengakses database secara langsung. Akses langsung semacam itu hanya boleh dilakukan untuk pemeliharaan teknis dan tidak untuk mencari tahu identitas pelapor.
- Identitas Anda tetap bisa terungkap dari **isi laporan atau lampiran** yang Anda tulis sendiri, misalnya nama, NIM, tanda tangan, wajah di foto, atau nama penulis di properti dokumen PDF/Word.

## 6. Pihak ketiga

| Pihak | Data yang diterima | Keterangan |
| --- | --- | --- |
| Penyedia email (SMTP): [ISI: nama layanan] | Alamat email, nama, judul laporan, isi pemberitahuan | Untuk mengirim email pemberitahuan dan reset password |
| Google Fonts | Alamat IP dan jenis browser Anda | Browser Anda mengunduh huruf (font) tampilan langsung dari server Google |
| ip-api.com | Alamat IP perangkat Anda | **Tidak aktif secara bawaan.** Hanya dipakai bila pengelola mengaktifkan perkiraan lokasi di daftar perangkat aktif; bila diaktifkan, bagian ini harus diperbarui |
| Penyedia server/hosting: [ISI: nama atau "server milik kampus"] | Seluruh data Sistem | Tempat Sistem dijalankan |

## 7. Penyimpanan dan keamanan

- Sistem diakses lewat HTTPS. Password disimpan sebagai *hash*. Berkas lampiran dan KTM hanya bisa dibuka oleh pengguna yang login dan berhak.
- Tindakan petugas tercatat di audit log.
- Data disimpan di [ISI: lokasi server]. Backup disimpan [ISI: lokasi, terenkripsi atau tidak] selama [ISI: masa simpan backup].
- Masa simpan setiap jenis data diatur di dokumen retensi data: [ISI: tautan ke kebijakan retensi yang disahkan].

## 8. Hak Anda

Sesuai UU Pelindungan Data Pribadi, Anda berhak:

- **mengakses** data pribadi Anda dan mendapatkan salinannya;
- **memperbaiki** data yang salah. Nama, NIM, dan email bisa Anda ubah sendiri di halaman Profil;
- **meminta penghapusan** akun dan data Anda;
- **menarik persetujuan** dan **mengajukan keberatan** atas pemrosesan data;
- **mengadu** bila Anda menilai data Anda disalahgunakan.

Ajukan permintaan ke [ISI: email penanggung jawab pelindungan data] dengan menyebut nama, NIM, dan email akun. Kami menanggapi dalam [ISI: jumlah] hari kerja.

Catatan penghapusan: laporan yang sedang ditangani, atau yang wajib disimpan untuk kepentingan penanganan dan pertanggungjawaban, dapat tetap disimpan tanpa identitas Anda sampai masa simpannya berakhir. Rinciannya ada di dokumen retensi data.

## 9. Perubahan kebijakan

Kebijakan ini dapat diperbarui bila fitur Sistem atau ketentuan hukum berubah. Versi terbaru selalu tersedia di [ISI: alamat halaman kebijakan privasi], dengan tanggal berlaku di bagian atas. Perubahan penting diumumkan lewat [ISI: kanal pengumuman].
