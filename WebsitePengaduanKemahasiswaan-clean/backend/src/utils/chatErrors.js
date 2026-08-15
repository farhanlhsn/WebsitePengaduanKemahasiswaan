class ChatError extends Error {
  constructor(code, statusCode = 400, message = null) {
    super(message || code);
    this.name = 'ChatError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

const MESSAGES = {
  ACCESS_DENIED: 'Akses ditolak.',
  INVALID_ATTACHMENT: 'Lampiran tidak valid atau sudah kedaluwarsa.',
  INVALID_REPLY: 'Balasan tidak valid.',
  TOO_MANY_ATTACHMENTS: 'Terlalu banyak lampiran per pesan.',
  ATTACHMENT_TOO_LARGE: 'Total ukuran lampiran melebihi batas.',
  PENDING_UPLOAD_LIMIT: 'Batas upload sementara tercapai. Coba lagi nanti.',
};

function chatError(code, statusCode) {
  return new ChatError(code, statusCode, MESSAGES[code] || code);
}

module.exports = { ChatError, chatError, MESSAGES };
