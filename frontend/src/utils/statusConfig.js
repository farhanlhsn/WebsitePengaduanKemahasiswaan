// ─────────────────────────────────────────────────────────────────────────────
// Konfigurasi status terpusat (satu-satunya sumber kebenaran).
//
// Label (Bahasa Indonesia), warna utama (`color`), dan warna latar
// (`bgColor`) untuk setiap status laporan/pengguna. Palet warna mengikuti
// definisi asli `components/ui/StatusBadge.jsx` agar konsisten di seluruh
// aplikasi (badge, chat, dasbor, analitik, dsb.).
// ─────────────────────────────────────────────────────────────────────────────

export const STATUS_CONFIG = {
  PENDING: { label: 'Menunggu', color: '#FF9800', bgColor: '#FFF3E0' },
  IN_REVIEW: { label: 'Ditinjau', color: '#2196F3', bgColor: '#E3F2FD' },
  IN_PROGRESS: { label: 'Diproses', color: '#FF9800', bgColor: '#FFF3E0' },
  RESOLVED: { label: 'Selesai', color: '#4CAF50', bgColor: '#E8F5E8' },
  REJECTED: { label: 'Ditolak', color: '#F44336', bgColor: '#FFEBEE' },
  CANCELED: { label: 'Dibatalkan', color: '#9E9E9E', bgColor: '#F5F5F5' },
  DELETED: { label: 'Dihapus', color: '#F44336', bgColor: '#FFEBEE' },
  ACTIVE: { label: 'Aktif', color: '#4CAF50', bgColor: '#E8F5E8' },
};

// Fallback netral untuk status yang tidak dikenal.
export const DEFAULT_STATUS_CONFIG = {
  label: 'Tidak Diketahui',
  color: '#757575',
  bgColor: '#EEEEEE',
};

/**
 * Ambil konfigurasi `{ label, color, bgColor }` untuk sebuah status.
 * Mengembalikan fallback netral bila status tidak dikenali.
 */
export const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || DEFAULT_STATUS_CONFIG;

export default STATUS_CONFIG;
