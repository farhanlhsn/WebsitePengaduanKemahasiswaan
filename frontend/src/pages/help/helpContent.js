// Konten Pusat Bantuan untuk mahasiswa dan admin.
//
// Isinya harus selaras dengan docs/UserManual.md. Bila alur aplikasi berubah
// (status laporan, batas unggah, verifikasi akun, dsb.), perbarui keduanya.

const CATEGORY_LABELS = {
  umum: 'Umum',
  akun: 'Akun & Masuk',
  laporan: 'Laporan',
  privasi: 'Privasi & Anonim',
  teknis: 'Teknis',
  pengguna: 'Verifikasi & Pengguna',
  superadmin: 'Khusus Superadmin',
};

const STUDENT_FAQ = [
  {
    category: 'umum',
    question: 'Apa itu portal pengaduan mahasiswa Universitas Bung Hatta?',
    answer:
      'Portal ini adalah sarana resmi untuk menyampaikan pengaduan akademik maupun non-akademik, misalnya sarana dan prasarana, administrasi, keuangan, atau kekerasan seksual, lalu memantau penanganannya sampai selesai.',
    tags: ['portal', 'pengaduan'],
  },
  {
    category: 'umum',
    question: 'Siapa saja yang bisa memakai portal ini?',
    answer:
      'Mahasiswa aktif Universitas Bung Hatta yang memiliki NIM, email kampus, dan foto KTM. Akun admin dan superadmin dibuat oleh pengelola sistem.',
    tags: ['mahasiswa', 'akses', 'syarat'],
  },
  {
    category: 'akun',
    question: 'Bagaimana cara mendaftar akun baru?',
    answer:
      'Klik "Daftar" di kanan atas. Langkah 1: isi NIM (minimal 8 digit), nama lengkap sesuai KTM, dan email kampus. Langkah 2: buat password minimal 8 karakter berisi huruf besar, huruf kecil, dan angka. Langkah 3: unggah foto KTM (JPG, PNG, atau WebP, maksimal 5 MB) yang terbaca jelas, lalu klik "Daftar Sekarang".',
    tags: ['registrasi', 'daftar', 'ktm'],
  },
  {
    category: 'akun',
    question: 'Kenapa saya belum bisa masuk setelah mendaftar?',
    answer:
      'Akun baru harus diverifikasi admin dengan mencocokkan data Anda dengan foto KTM. Anda menerima email saat akun diverifikasi, atau email berisi alasan bila pendaftaran ditolak (misalnya foto KTM buram) sehingga Anda bisa mendaftar ulang. Bila lebih dari 3 hari kerja belum ada kabar, hubungi Bagian Kemahasiswaan.',
    tags: ['verifikasi', 'ktm', 'login'],
  },
  {
    category: 'akun',
    question: 'Saya lupa password, bagaimana cara reset?',
    answer:
      'Klik "Lupa Password" di halaman masuk dan masukkan email terdaftar. Tautan reset berlaku 1 jam dan hanya bisa dipakai sekali. Setelah password diganti, Anda keluar dari semua perangkat. Bila email tidak datang dalam 10 menit, periksa folder spam.',
    tags: ['password', 'reset', 'lupa'],
  },
  {
    category: 'akun',
    question: 'Kenapa saya tiba-tiba keluar dari akun?',
    answer:
      'Ini terjadi bila password diganti, Anda menekan "Logout Perangkat Lain", atau akun masuk di lebih dari 3 perangkat (perangkat yang paling lama tidak dipakai dikeluarkan otomatis). Bila Anda tidak merasa melakukannya, segera ganti password dan periksa menu Perangkat.',
    tags: ['sesi', 'perangkat', 'keluar'],
  },
  {
    category: 'laporan',
    question: 'Bagaimana cara membuat laporan pengaduan?',
    answer:
      'Klik "Buat Laporan Baru", isi judul dan pilih kategori, lalu jelaskan masalahnya (kapan, di mana, dampaknya). Lampiran bersifat opsional: maksimal 10 berkas, masing-masing 5 MB, format JPG, PNG, WebP, PDF, DOC, atau DOCX. Setelah dikirim, laporan mendapat nomor registrasi, misalnya SP/01/08/10/2026. Satu akun dapat mengirim paling banyak 5 laporan per jam.',
    tags: ['laporan', 'membuat', 'lampiran'],
  },
  {
    category: 'laporan',
    question: 'Apa arti status laporan saya?',
    answer:
      'Menunggu: belum ditinjau. Ditinjau: sedang diperiksa petugas. Diproses: sedang ditindaklanjuti. Selesai: penanganan tuntas. Ditolak atau Dibatalkan: alasannya tampil di detail laporan. Anda menerima email setiap kali status berubah.',
    tags: ['status', 'pantau'],
  },
  {
    category: 'laporan',
    question: 'Berapa lama laporan saya ditanggapi?',
    answer:
      'Laporan ditangani petugas yang bertanggung jawab atas kategorinya. Sistem tidak menetapkan batas waktu otomatis. Pantau status di Dasbor; Anda juga menerima email saat status berubah atau petugas mengirim pesan. Gunakan menu Percakapan bila perlu menanyakan perkembangan.',
    tags: ['waktu', 'tanggapan', 'status'],
  },
  {
    category: 'laporan',
    question: 'Bisakah saya mengubah atau membatalkan laporan?',
    answer:
      'Laporan bisa diedit (judul, deskripsi, kategori) selama statusnya masih Menunggu, lewat tombol "Edit Laporan" di detail laporan. Untuk membatalkan, kirim pesan di percakapan laporan tersebut; petugas akan mengubah statusnya menjadi Dibatalkan beserta alasannya.',
    tags: ['edit', 'batal'],
  },
  {
    category: 'privasi',
    question: 'Bisakah saya melapor secara anonim?',
    answer:
      'Bisa, untuk kategori yang mengizinkannya. Secara bawaan: Kekerasan Seksual, Diskriminasi, Penyalahgunaan Wewenang Dosen/Staff, Korupsi, dan Pelanggaran Hak Asasi Manusia. Centang "Laporkan secara anonim" di bawah pilihan kategori. Nama, NIM, dan email Anda disembunyikan dari semua petugas, termasuk superadmin; Anda tampil sebagai "Anonim" tetapi tetap bisa memantau laporan dan membalas percakapan. Jangan menulis identitas Anda di isi laporan atau lampiran.',
    tags: ['anonim', 'identitas', 'rahasia'],
  },
  {
    category: 'privasi',
    question: 'Siapa yang bisa melihat laporan saya?',
    answer:
      'Hanya Anda, admin yang ditugaskan menangani kategori laporan tersebut, dan superadmin. Lampiran hanya bisa dibuka oleh pengguna yang berhak atas laporannya. Petugas tidak pernah meminta password Anda.',
    tags: ['privasi', 'rahasia', 'akses'],
  },
  {
    category: 'teknis',
    question: 'Berkas saya gagal diunggah',
    answer:
      'Pastikan ukuran tiap berkas di bawah 5 MB dan formatnya JPG, PNG, WebP, PDF, DOC, atau DOCX. Untuk foto KTM saat mendaftar, hanya JPG, PNG, atau WebP yang diterima.',
    tags: ['unggah', 'lampiran', 'berkas'],
  },
  {
    category: 'teknis',
    question: 'Pesan baru tidak langsung muncul atau halaman lambat',
    answer:
      'Klik ikon segarkan di daftar percakapan atau muat ulang halaman, dan pastikan koneksi internet stabil. Bila masih bermasalah, coba browser lain (Chrome, Edge, Firefox, atau Safari versi terbaru) atau hubungi Unit TI kampus.',
    tags: ['chat', 'koneksi', 'lambat'],
  },
];

const ADMIN_FAQ = [
  {
    category: 'laporan',
    question: 'Kenapa daftar laporan saya kosong?',
    answer:
      'Admin hanya melihat laporan dari kategori yang ditugaskan kepadanya. Admin tanpa penugasan kategori melihat daftar kosong. Minta superadmin memberikan kategori di menu Kelola Admin.',
    tags: ['kosong', 'penugasan kategori'],
  },
  {
    category: 'laporan',
    question: 'Perpindahan status apa saja yang diizinkan?',
    answer:
      'Menunggu → Ditinjau, Ditolak, atau Dibatalkan. Ditinjau → Diproses, Selesai, Ditolak, atau Dibatalkan. Diproses → Selesai, Ditolak, atau Dibatalkan. Selesai atau Ditolak → Ditinjau (dibuka kembali). Dibatalkan → Menunggu (diajukan ulang). Alasan wajib diisi untuk Ditolak dan Dibatalkan, dan akan dibaca pelapor, jadi tulis dengan jelas dan sopan. Pelapor menerima email setiap perubahan status.',
    tags: ['status', 'alasan', 'transisi'],
  },
  {
    category: 'laporan',
    question: 'Bagaimana mengatur prioritas dan petugas laporan?',
    answer:
      'Buka detail laporan, lalu gunakan panel "Prioritas & Penugasan". Prioritas awal mengikuti pengaturan kategori. Catatan versi ini: nama petugas yang sudah ditugaskan belum ditampilkan kembali di kolom tersebut; gunakan tombol "Ditugaskan kepada saya" di daftar laporan untuk melihat laporan Anda.',
    tags: ['prioritas', 'petugas', 'assign'],
  },
  {
    category: 'laporan',
    question: 'Mahasiswa meminta laporannya dibatalkan',
    answer:
      'Mahasiswa belum punya tombol pembatalan di aplikasi, sehingga permintaan biasanya datang lewat percakapan. Ubah status laporan menjadi Dibatalkan dan tuliskan alasannya, misalnya "Dibatalkan atas permintaan pelapor".',
    tags: ['batal', 'pelapor'],
  },
  {
    category: 'laporan',
    question: 'Bagaimana memakai operasi massal?',
    answer:
      'Centang beberapa laporan di daftar, lalu pilih Ubah Status, Hapus, atau Pulihkan di bilah aksi (maksimal 100 laporan sekaligus). Laporan yang tidak memenuhi syarat, misalnya perpindahan statusnya tidak diizinkan, dilewati dan jumlah yang berhasil diproses ditampilkan.',
    tags: ['massal', 'bulk'],
  },
  {
    category: 'pengguna',
    question: 'Bagaimana memverifikasi akun mahasiswa?',
    answer:
      'Buka "Pengguna Belum Verifikasi", klik "Lihat KTM", lalu cocokkan nama dan NIM dengan data pendaftar. Pilih Verifikasi bila cocok, atau Tolak dengan menuliskan alasan; pendaftar menerima email berisi alasan tersebut. Untuk banyak akun sekaligus, centang beberapa baris lalu pilih Verifikasi di bilah aksi.',
    tags: ['verifikasi', 'ktm', 'mahasiswa'],
  },
  {
    category: 'pengguna',
    question: 'Bagaimana mengekspor data?',
    answer:
      'Di Manajemen Pengguna, klik Ekspor untuk mengunduh daftar pengguna yang sedang tampil sebagai CSV. Ekspor laporan ke CSV belum memiliki tombol di aplikasi; untuk sementara minta tim TI menjalankannya lewat API.',
    tags: ['ekspor', 'csv'],
  },
  {
    category: 'privasi',
    question: 'Bagaimana menangani laporan anonim?',
    answer:
      'Kolom pelapor bertuliskan "Identitas disembunyikan" untuk semua petugas, termasuk superadmin. Gunakan percakapan bila memerlukan keterangan tambahan dan jangan meminta pelapor membuka identitasnya. Setiap kali admin membuka laporan anonim, sistem mencatatnya di audit log.',
    tags: ['anonim', 'audit'],
  },
  {
    category: 'superadmin',
    question: 'Bagaimana mengangkat admin dan memberi penugasan kategori?',
    answer:
      'Calon admin mendaftar dan diverifikasi seperti mahasiswa. Buka Manajemen Pengguna → Lihat Detail → "Jadikan Admin". Lalu di Kelola Admin, pada kartu admin tersebut pilih "Berikan kategori" untuk setiap kategori yang menjadi tanggung jawabnya. Mencabut kategori akan melepas laporan kategori itu yang sedang ditugaskan kepadanya.',
    tags: ['admin', 'penugasan kategori', 'promosi'],
  },
  {
    category: 'superadmin',
    question: 'Saya membuat kategori baru, kenapa laporannya tidak ditangani?',
    answer:
      'Kategori baru tidak otomatis ditangani siapa pun. Selama belum ada admin yang diberi penugasan kategori tersebut, laporannya hanya terlihat oleh superadmin. Segera berikan kategori itu ke admin yang tepat di Kelola Admin.',
    tags: ['kategori', 'penugasan kategori'],
  },
  {
    category: 'superadmin',
    question: 'Bisakah superadmin diturunkan atau dihapus?',
    answer:
      'Bisa, kecuali superadmin terakhir. Sebaiknya selalu ada minimal dua superadmin aktif agar pengelolaan tidak bergantung pada satu orang. Admin yang diturunkan kehilangan semua penugasan kategorinya dan langsung dikeluarkan dari sistem.',
    tags: ['superadmin', 'demosi'],
  },
  {
    category: 'superadmin',
    question: 'Kapan boleh memakai Pembersihan Basis Data?',
    answer:
      'Menu Sistem & Keamanan dapat menghapus permanen pengguna yang sudah dihapus dan log audit lama. Tindakan ini tidak dapat dibatalkan, jadi jalankan hanya sesuai kebijakan retensi kampus dan setelah tim TI membuat cadangan database.',
    tags: ['pembersihan', 'retensi', 'backup'],
  },
];

const HELP_CONTENT = {
  mahasiswa: STUDENT_FAQ,
  admin: ADMIN_FAQ,
};

/**
 * Kembalikan FAQ dan label kategori untuk audiens tertentu.
 * @param {'mahasiswa'|'admin'} audience
 */
export function getHelpContent(audience = 'mahasiswa') {
  const faqs = HELP_CONTENT[audience] ?? STUDENT_FAQ;
  return { faqs, categoryLabels: CATEGORY_LABELS };
}

// Hanya http(s) absolut atau path relatif satu-domain ("/..."), bukan "//host".
const isSafeHref = (value) => /^https?:\/\//i.test(value) || /^\/(?!\/)/.test(value);

/**
 * Tautan dokumen yang URL-nya ditentukan kampus saat build
 * (VITE_USER_MANUAL_URL, VITE_PRIVACY_POLICY_URL). Tautan tanpa URL tidak ditampilkan.
 */
export function getResourceLinks(env = import.meta.env) {
  const candidates = [
    { key: 'manual', text: 'Panduan Pengguna (User Manual)', href: env?.VITE_USER_MANUAL_URL },
    { key: 'privacy', text: 'Kebijakan Privasi', href: env?.VITE_PRIVACY_POLICY_URL },
  ];
  return candidates
    .map((link) => ({ ...link, href: typeof link.href === 'string' ? link.href.trim() : '' }))
    .filter((link) => link.href && isSafeHref(link.href));
}
