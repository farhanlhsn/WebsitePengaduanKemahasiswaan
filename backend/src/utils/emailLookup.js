/**
 * Pencarian akun berdasarkan email tanpa membedakan huruf besar/kecil.
 *
 * Kolom `email` unik secara case-sensitive, jadi tanpa ini `Budi@kampus.ac.id`
 * dan `budi@kampus.ac.id` bisa menjadi dua akun berbeda, dan login/reset
 * password bergantung pada huruf yang diketik pengguna.
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
  return prismaClient.user.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' } },
    orderBy: [{ deletedAt: { sort: 'asc', nulls: 'first' } }, { id: 'asc' }],
    ...(select ? { select } : {}),
  });
}

module.exports = { normalizeEmail, findUserByEmail };
