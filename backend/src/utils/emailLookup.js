/**
 * Pencarian akun berdasarkan email tanpa membedakan huruf besar/kecil.
 *
 * Kolom `email` unik secara case-sensitive, jadi tanpa ini `Budi@kampus.ac.id`
 * dan `budi@kampus.ac.id` bisa menjadi dua akun berbeda, dan login/reset
 * password bergantung pada huruf yang diketik pengguna.
 *
 * Jangan pakai `mode: 'insensitive'` milik Prisma: di PostgreSQL itu menjadi
 * `ILIKE`, sehingga `%` dan `_` (karakter sah di alamat email) bertindak
 * sebagai wildcard dan `b_di@kampus.ac.id` cocok dengan akun `budi@...`.
 */

function normalizeEmail(email) {
  if (typeof email !== 'string') return email;
  return email.trim().toLowerCase();
}

/**
 * Akun aktif didahulukan bila (data lama) ada beberapa baris yang hanya
 * berbeda kapitalisasi.
 */
async function findUserByEmail(prismaClient, email, select) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const rows = await prismaClient.$queryRaw`
    SELECT id FROM users
    WHERE LOWER(email) = ${normalized}
    ORDER BY ("deletedAt" IS NOT NULL), id
    LIMIT 1`;
  if (!rows || rows.length === 0) return null;
  return prismaClient.user.findUnique({
    where: { id: rows[0].id },
    ...(select ? { select } : {}),
  });
}

module.exports = { normalizeEmail, findUserByEmail };
