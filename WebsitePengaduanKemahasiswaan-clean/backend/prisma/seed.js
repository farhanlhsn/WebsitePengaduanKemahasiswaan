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

/**
 * Bootstrap a SUPERADMIN account on first seed.
 *
 * Strategy:
 *   - If at least one SUPERADMIN already exists, do nothing.
 *   - Otherwise, read SEED_SUPERADMIN_EMAIL / SEED_SUPERADMIN_PASSWORD /
 *     SEED_SUPERADMIN_NAME from env.
 *   - If those env vars are missing, fall back to ADMIN_EMAIL/PASSWORD/NAME for
 *     dev convenience (preserves prior seeding behavior in local dev) but the
 *     account is created as SUPERADMIN, not ADMIN.
 *
 * Migration of existing admins (per BE-6 plan, opsi C): existing ADMIN
 * accounts are NOT auto-promoted. They keep their role; SUPERADMIN must grant
 * them category access explicitly.
 */
async function ensureSuperAdmin() {
  const existing = await prisma.user.count({
    where: { role: 'SUPERADMIN', deletedAt: null },
  });
  if (existing > 0) {
    console.log(`SUPERADMIN already exists (${existing}), skipping bootstrap.`);
    return;
  }

  const email =
    process.env.SEED_SUPERADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'superadmin@kampus.ac.id';
  const name =
    process.env.SEED_SUPERADMIN_NAME ||
    process.env.ADMIN_NAME ||
    'Super Admin';
  const password =
    process.env.SEED_SUPERADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    'superadmin12345';

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hash,
      role: 'SUPERADMIN',
      isVerified: true,
    },
    create: {
      name,
      email,
      password: hash,
      role: 'SUPERADMIN',
      isVerified: true,
    },
  });
  console.log(`SUPERADMIN bootstrapped: ${email}`);
}

async function main() {
  console.log('Start seeding ...');

  await ensureSuperAdmin();

  const categories = [
    { name: 'Kekerasan Seksual', priority: 'URGENT', anonymous: true },
    { name: 'Sarana dan Prasarana', priority: 'MEDIUM', anonymous: false },
    { name: 'Pelanggaran Kode Etik', priority: 'HIGH', anonymous: false },
    { name: 'Akademik', priority: 'MEDIUM', anonymous: false },
    { name: 'Administrasi', priority: 'MEDIUM', anonymous: false },
    { name: 'Keuangan', priority: 'MEDIUM', anonymous: false },
    { name: 'Kesehatan', priority: 'MEDIUM', anonymous: false },
    { name: 'Lingkungan Hidup', priority: 'MEDIUM', anonymous: false },
    { name: 'Kebijakan Kampus', priority: 'MEDIUM', anonymous: false },
    { name: 'Diskriminasi', priority: 'HIGH', anonymous: true },
    { name: 'Penyalahgunaan Wewenang Dosen/Staff', priority: 'HIGH', anonymous: true },
    { name: 'Korupsi', priority: 'HIGH', anonymous: true },
    { name: 'Pelanggaran Hak Asasi Manusia', priority: 'HIGH', anonymous: true },
    { name: 'Pendidikan Inklusif', priority: 'MEDIUM', anonymous: false },
    { name: 'Kebebasan Berekspresi', priority: 'MEDIUM', anonymous: false },
    { name: 'Kesejahteraan Mahasiswa', priority: 'MEDIUM', anonymous: false },
    { name: 'Keamanan Kampus', priority: 'HIGH', anonymous: false },
    { name: 'Layanan Mahasiswa', priority: 'MEDIUM', anonymous: false },
    { name: 'Kegiatan Kemahasiswaan', priority: 'LOW', anonymous: false },
    { name: 'Pengelolaan Organisasi Mahasiswa', priority: 'LOW', anonymous: false },
    { name: 'Penyalahgunaan Sistem IT Kampus', priority: 'HIGH', anonymous: false },
    { name: 'Kebijakan Privasi', priority: 'MEDIUM', anonymous: false },
    { name: 'Lainnya', priority: 'LOW', anonymous: false },
  ];

  const categoryData = categories.map(cat => ({
    name: cat.name,
    slug: generateSlug(cat.name),
    defaultPriority: cat.priority,
    allowAnonymous: cat.anonymous,
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
