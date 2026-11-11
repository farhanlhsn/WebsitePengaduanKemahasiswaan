/**
 * Memutus koneksi Socket.IO saat sesi atau hak akses berubah.
 *
 * Akses socket hanya diperiksa ketika klien mengirim event, sedangkan
 * broadcast ke room `report_<id>` terkirim ke siapa pun yang sudah bergabung.
 * Tanpa pemutusan dari server, socket yang diam tetap menerima pesan chat
 * setelah password diganti, akun dihapus, atau kategori dicabut.
 *
 * Klien yang sesinya masih sah menyambung ulang dengan token terbaru dan
 * bergabung ulang ke room, sehingga hak aksesnya diperiksa dari awal.
 */

function emitAndDisconnect(io, room, code) {
  io.in(room).emit('chat:error', {
    code,
    message: 'Sesi socket diperbarui.',
    timestamp: new Date().toISOString(),
  });
  io.in(room).disconnectSockets(true);
}

/** Putus semua socket milik satu user. */
function disconnectUserSockets(io, userId, code = 'SESSION_CHANGED') {
  if (!io || userId == null) return;
  emitAndDisconnect(io, `user_${userId}`, code);
}

/** Putus semua socket yang sedang berada di room chat sebuah laporan. */
function disconnectReportRoom(io, reportId, code = 'ACCESS_CHANGED') {
  if (!io || reportId == null) return;
  emitAndDisconnect(io, `report_${reportId}`, code);
}

module.exports = { disconnectUserSockets, disconnectReportRoom };
