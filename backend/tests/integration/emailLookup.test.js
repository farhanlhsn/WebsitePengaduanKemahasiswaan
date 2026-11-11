/**
 * findUserByEmail di PostgreSQL sungguhan: tidak membedakan huruf besar/kecil,
 * tetapi `%` dan `_` tidak boleh bertindak sebagai wildcard (ILIKE).
 */

const { prisma, createUser } = require('./helpers');
const { findUserByEmail } = require('../../src/utils/emailLookup');

test('matches regardless of case but never as a LIKE pattern', async () => {
  const user = await createUser({ email: `budi.wild-${Date.now()}@kampus.ac.id`, nim: `2021${Date.now() % 1e6}` });
  const [local, domain] = user.email.split('@');

  expect((await findUserByEmail(prisma, user.email.toUpperCase()))?.id).toBe(user.id);
  expect(await findUserByEmail(prisma, `b_di${local.slice(4)}@${domain}`)).toBeNull();
  expect(await findUserByEmail(prisma, `%@${domain}`)).toBeNull();
  expect(await findUserByEmail(prisma, `${local.slice(0, 4)}%@${domain}`)).toBeNull();
});

test('prefers the active account when rows differ only in case', async () => {
  const stamp = Date.now();
  const deleted = await createUser({ email: `Dobel-${stamp}@kampus.ac.id`, nim: `2022${stamp % 1e6}` });
  await prisma.user.update({ where: { id: deleted.id }, data: { deletedAt: new Date() } });
  const active = await createUser({ email: `dobel-${stamp}@kampus.ac.id`, nim: `2023${stamp % 1e6}` });

  expect((await findUserByEmail(prisma, `DOBEL-${stamp}@kampus.ac.id`))?.id).toBe(active.id);
});
