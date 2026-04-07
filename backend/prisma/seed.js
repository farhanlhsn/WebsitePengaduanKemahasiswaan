const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Helper function untuk membuat slug dari string.
 * @param {string} text - Teks yang akan diubah menjadi slug.
 * @returns {string} - Slug yang sudah diformat.
 */
function generateSlug(text) {
  return text
    .toString() // Pastikan input adalah string
    .toLowerCase() // 1. Ubah ke huruf kecil
    .replace(/\s+/g, '-') // 2. Ganti spasi dengan -
    .replace(/[^\w\-]+/g, '') // 3. Hapus semua karakter non-kata (selain huruf, angka, _) dan non-hyphen
    .replace(/\-\-+/g, '-') // 4. Ganti beberapa - dengan satu -
    .replace(/^-+/, '') // 5. Hapus - di awal
    .replace(/-+$/, ''); // 6. Hapus - di akhir
}

async function main() {
  console.log('Start seeding ...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@kampus.ac.id';
  const adminName = process.env.ADMIN_NAME || 'Admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin12345';

  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password: adminPasswordHash,
      role: 'ADMIN',
      isVerified: true,
    },
    create: {
      name: adminName,
      email: adminEmail,
      password: adminPasswordHash,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  const categories = [
    'Kekerasan Seksual',
    'Sarana dan Prasarana',
    'Pelanggaran Kode Etik',
    'Akademik',
    'Administrasi',
    'Keuangan',
    'Kesehatan',
    'Lingkungan Hidup',
    'Kebijakan Kampus',
    'Diskriminasi',
    'Penyalahgunaan Wewenang Dosen/Staff',
    'Korupsi',
    'Pelanggaran Hak Asasi Manusia',
    'Pendidikan Inklusif',
    'Kebebasan Berekspresi',
    'Kesejahteraan Mahasiswa',
    'Keamanan Kampus',
    'Layanan Mahasiswa',
    'Kegiatan Kemahasiswaan',
    'Pengelolaan Organisasi Mahasiswa',
    'Penyalahgunaan Sistem IT Kampus',
    'Kebijakan Privasi',
    'Lainnya',
  ];

  // Ubah array of strings menjadi array of objects dengan name dan slug
  const categoryData = categories.map(name => ({
    name: name,
    slug: generateSlug(name),
  }));

  await prisma.category.createMany({
    data: categoryData,
    skipDuplicates: true,
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });