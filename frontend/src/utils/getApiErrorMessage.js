/**
 * Fix M7: satu helper untuk membaca pesan error dari respons API secara
 * konsisten. Sebelumnya tiap halaman memakai `error.message` mentah (axios)
 * yang menghasilkan pesan generik Inggris seperti "Request failed with
 * status code 400", bukan pesan backend berbahasa Indonesia.
 *
 * Prioritas:
 *   1. `error.response.data.message`  (format ResponseFormatter backend)
 *   2. `error.response.data.error`    (beberapa endpoint lama)
 *   3. `error.message`                (error non-HTTP, mis. network)
 *   4. fallback Indonesia
 *
 * @param {unknown} error - error yang ditangkap (biasanya dari axios)
 * @param {string} [fallback] - pesan fallback bila semua sumber kosong
 * @returns {string} pesan yang aman ditampilkan ke pengguna
 */
export function getApiErrorMessage(error, fallback = 'Terjadi kesalahan. Silakan coba lagi.') {
  if (!error) return fallback;

  const data = error?.response?.data;
  if (data) {
    if (typeof data.message === 'string' && data.message.trim()) return data.message;
    if (typeof data.error === 'string' && data.error.trim()) return data.error;
  }

  if (typeof error.message === 'string' && error.message.trim()) {
    // axios menyertakan pesan teknis yang tidak ramah pengguna; petakan ke
    // pesan generik Indonesia untuk kasus jaringan.
    if (/network error|timeout|failed to fetch|ERR_NETWORK/i.test(error.message)) {
      return 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
    }
    return error.message;
  }

  return fallback;
}

export default getApiErrorMessage;
