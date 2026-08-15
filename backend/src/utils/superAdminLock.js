/**
 * Audit B2: serialisasi semua mutasi yang berkaitan dengan guard
 * "superadmin terakhir" memakai advisory transaction lock PostgreSQL.
 *
 * Masalah lama: dua request konkuren (demote A + demote B, atau delete+demote)
 * bisa sama-sama menghitung "masih ada superadmin lain" sebelum salah satu
 * commit, sehingga sistem berakhir dengan NOL superadmin. Dengan lock ini,
 * transaksi kedua memblokir sampai transaksi pertama commit, lalu menghitung
 * ulang jumlah superadmin secara akurat.
 *
 * Lock otomatis lepas saat transaksi commit/rollback (pg_advisory_xact_lock).
 *
 * Catatan implementasi: `pg_advisory_xact_lock` mengembalikan void. Pakai
 * `$executeRaw` (bukan `$queryRaw`) karena `$queryRaw` mencoba deserialize
 * baris hasil dan gagal pada kolom bertipe void.
 *
 * @param {Prisma.TransactionClient} tx - client transaksi Prisma
 */
async function acquireSuperAdminGuardLock(tx) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('superadmin_guard'))`;
}

module.exports = { acquireSuperAdminGuardLock };
