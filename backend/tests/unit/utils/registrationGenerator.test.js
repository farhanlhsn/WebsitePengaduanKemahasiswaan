/**
 * Nomor registrasi: {kode}/{urut}/{dd}/{mm}/{yyyy} menurut tanggal WIB.
 * Nomor urut melanjutkan nomor tertinggi untuk kode dan tanggal yang sama,
 * supaya kategori dengan kode sama (mis. "XX") dan laporan yang dihapus
 * permanen tidak menghasilkan nomor yang bertabrakan.
 */

jest.mock('../../../src/utils/prisma', () => ({
  report: { findMany: jest.fn() },
}));

const prisma = require('../../../src/utils/prisma');
const RegistrationGenerator = require('../../../src/utils/registrationGenerator');

// 11 Nov 2026 pukul 10.00 WIB
const NOW = new Date('2026-11-11T03:00:00Z');

beforeEach(() => jest.clearAllMocks());

test('first report of the day starts at 01', async () => {
  prisma.report.findMany.mockResolvedValue([]);
  await expect(RegistrationGenerator.generateRegistrationNumber('akademik', NOW)).resolves.toBe('AK/01/11/11/2026');
  expect(prisma.report.findMany).toHaveBeenCalledWith({
    where: { registrationNumber: { startsWith: 'AK/', endsWith: '/11/11/2026' } },
    select: { registrationNumber: true },
  });
});

test('two categories outside the code map share "XX" without colliding', async () => {
  // Kategori lain berkode XX sudah memakai nomor 01 hari ini.
  prisma.report.findMany.mockResolvedValue([{ registrationNumber: 'XX/01/11/11/2026' }]);
  await expect(RegistrationGenerator.generateRegistrationNumber('kategori-baru', NOW)).resolves.toBe('XX/02/11/11/2026');
});

test('continues after the highest number even when earlier ones were deleted', async () => {
  // AK/01 dihapus permanen; menghitung jumlah baris akan memberi 03 lagi.
  prisma.report.findMany.mockResolvedValue([
    { registrationNumber: 'AK/02/11/11/2026' },
    { registrationNumber: 'AK/03/11/11/2026' },
  ]);
  await expect(RegistrationGenerator.generateRegistrationNumber('akademik', NOW)).resolves.toBe('AK/04/11/11/2026');
});

test('goes past 99 without truncating', async () => {
  prisma.report.findMany.mockResolvedValue([{ registrationNumber: 'AK/99/11/11/2026' }]);
  await expect(RegistrationGenerator.generateRegistrationNumber('akademik', NOW)).resolves.toBe('AK/100/11/11/2026');
});

test('uses the WIB date, not the UTC date of the server', async () => {
  prisma.report.findMany.mockResolvedValue([]);
  // 10 Nov 2026 pukul 20.00 UTC = 11 Nov 2026 pukul 03.00 WIB
  const earlyMorningWib = new Date('2026-11-10T20:00:00Z');
  await expect(RegistrationGenerator.generateRegistrationNumber('akademik', earlyMorningWib)).resolves.toBe('AK/01/11/11/2026');
});
