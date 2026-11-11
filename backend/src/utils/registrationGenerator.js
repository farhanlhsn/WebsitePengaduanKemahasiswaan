const prisma = require('./prisma');

class RegistrationGenerator {
  // Mapping category slug ke kode aduan
  static categoryCodeMap = {
    'kekerasan-seksual': 'KS',
    'sarana-dan-prasarana': 'SP',
    'pelanggaran-kode-etik': 'KE',
    'akademik': 'AK',
    'administrasi': 'AD',
    'keuangan': 'KU',
    'kesehatan': 'KH',
    'lingkungan-hidup': 'LH',
    'kebijakan-kampus': 'KK',
    'diskriminasi': 'DS',
    'penyalahgunaan-wewenang-dosenstaff': 'PW',
    'korupsi': 'KR',
    'pelanggaran-hak-asasi-manusia': 'HAM',
    'pendidikan-inklusif': 'PI',
    'kebebasan-berekspresi': 'KB',
    'kesejahteraan-mahasiswa': 'KM',
    'keamanan-kampus': 'AM',
    'layanan-mahasiswa': 'LM',
    'kegiatan-kemahasiswaan': 'KG',
    'pengelolaan-organisasi-mahasiswa': 'PO',
    'penyalahgunaan-sistem-it-kampus': 'IT',
    'kebijakan-privasi': 'PR',
    'lainnya': 'LN'
  };

  /**
   * Tanggal (dd, mm, yyyy) menurut WIB. Kontainer produksi berjalan di UTC,
   * jadi tanpa ini laporan yang dibuat pukul 00.00–07.00 WIB tercatat dengan
   * tanggal kemarin.
   */
  static jakartaDateParts(date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type).value;
    return { day: get('day'), month: get('month'), year: get('year') };
  }

  /**
   * Format: {kode aduan}/{nomor urut hari ini}/{hari}/{bulan}/{tahun}.
   *
   * Nomor urut dihitung dari nomor tertinggi yang sudah ada untuk awalan kode
   * dan tanggal yang sama, bukan dari jumlah laporan kategori ini hari ini.
   * Cara lama bertabrakan bila (1) dua kategori memakai kode yang sama, mis.
   * semua kategori baru buatan superadmin mendapat "XX", atau (2) laporan hari
   * ini ada yang dihapus permanen. Tabrakan karena dua laporan dibuat
   * bersamaan ditangani retry di reportServices.createReport.
   */
  static async generateRegistrationNumber(categorySlug, now = new Date()) {
    try {
      const categoryCode = this.categoryCodeMap[categorySlug] || 'XX';
      const { day, month, year } = this.jakartaDateParts(now);
      const prefix = `${categoryCode}/`;
      const suffix = `/${day}/${month}/${year}`;

      const existing = await prisma.report.findMany({
        where: { registrationNumber: { startsWith: prefix, endsWith: suffix } },
        select: { registrationNumber: true },
      });

      const highest = existing.reduce((max, { registrationNumber }) => {
        const seq = Number.parseInt(registrationNumber.slice(prefix.length, -suffix.length), 10);
        return Number.isFinite(seq) && seq > max ? seq : max;
      }, 0);

      const docNumber = String(highest + 1).padStart(2, '0');
      return `${categoryCode}/${docNumber}${suffix}`;
    } catch (error) {
      throw new Error('Error generating registration number: ' + error.message);
    }
  }
}

module.exports = RegistrationGenerator; 