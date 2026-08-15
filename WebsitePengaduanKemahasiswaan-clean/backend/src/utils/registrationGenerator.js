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

  static async generateRegistrationNumber(categorySlug) {
    try {
      // Ambil kode aduan berdasarkan category slug
      const categoryCode = this.categoryCodeMap[categorySlug] || 'XX';
      
      // Tanggal hari ini
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      
      // Awal dan akhir hari ini untuk query
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      // Hitung berapa dokumen yang sudah dibuat hari ini untuk category ini
      const todayCount = await prisma.report.count({
        where: {
          category: {
            slug: categorySlug
          },
          createdAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      });
      
      // Nomor urut dokumen hari ini (mulai dari 01)
      const docNumber = String(todayCount + 1).padStart(2, '0');
      
      // Format: {kode aduan}/{dokumen ke berapa hari ini}/{hari}/{bulan}/{tahun}
      return `${categoryCode}/${docNumber}/${day}/${month}/${year}`;
      
    } catch (error) {
      throw new Error('Error generating registration number: ' + error.message);
    }
  }
}

module.exports = RegistrationGenerator; 