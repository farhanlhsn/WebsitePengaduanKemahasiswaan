/**
 * Reproduksi bug pentest November 2026: kategori yang tidak ada di daftar kode
 * (mis. dibuat superadmin lewat UI) semuanya berkode "XX". Laporan pertama di
 * kategori kedua dulu mendapat XX/01 yang sama dengan kategori pertama dan
 * gagal dengan unique constraint.
 */

const { prisma, createUser, createCategory } = require('./helpers');
const reportServices = require('../../src/services/reportServices');

test('two categories without a code map entry both get unique XX numbers', async () => {
  const stamp = Date.now();
  const user = await createUser({ email: `reg-${stamp}@kampus.ac.id`, nim: `2024${stamp % 1e6}` });
  const catA = await createCategory({ name: `Baru A ${stamp}`, slug: `baru-a-${stamp}` });
  const catB = await createCategory({ name: `Baru B ${stamp}`, slug: `baru-b-${stamp}` });

  const first = await reportServices.createReport({ title: 'A', description: 'a', userId: user.id, categoryId: catA.id });
  const second = await reportServices.createReport({ title: 'B', description: 'b', userId: user.id, categoryId: catB.id });

  expect(first.registrationNumber).toMatch(/^XX\/\d{2,}\//);
  expect(second.registrationNumber).toMatch(/^XX\/\d{2,}\//);
  expect(second.registrationNumber).not.toBe(first.registrationNumber);
});

test('a permanently deleted report does not make the next number collide', async () => {
  const stamp = Date.now();
  const user = await createUser({ email: `reg2-${stamp}@kampus.ac.id`, nim: `2025${stamp % 1e6}` });
  const cat = await createCategory({ name: `Baru C ${stamp}`, slug: `baru-c-${stamp}` });

  const r1 = await reportServices.createReport({ title: '1', description: '1', userId: user.id, categoryId: cat.id });
  await reportServices.createReport({ title: '2', description: '2', userId: user.id, categoryId: cat.id });
  await prisma.report.delete({ where: { id: r1.id } });

  await expect(
    reportServices.createReport({ title: '3', description: '3', userId: user.id, categoryId: cat.id })
  ).resolves.toHaveProperty('registrationNumber');
});
