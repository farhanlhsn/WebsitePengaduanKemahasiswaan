/**
 * OpenAPI / Swagger configuration.
 *
 * Endpoint documentation lives in YAML files under src/docs/openapi/ (one
 * file per module, shared schemas in components.yaml). Update the matching
 * file whenever a route, validator, or response shape changes.
 *
 * UI mounted at /api/docs in non-production environments by default.
 * Set ENABLE_SWAGGER=true to enable in production.
 * Static export: `npm run docs:openapi` -> docs/api/openapi.json.
 */

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Pengaduan Kemahasiswaan API',
    version: '1.0.0',
    description:
      'REST API untuk Sistem Pelaporan dan Pengaduan Kemahasiswaan Universitas Bung Hatta.\n\n' +
      '**Autentikasi**: login lewat `POST /v1/api/auth/login`, lalu kirim `accessToken` sebagai ' +
      'header `Authorization: Bearer <token>`. Klik tombol *Authorize* untuk memakainya di halaman ini.\n\n' +
      '**Peran**: `MAHASISWA`, `ADMIN` (dibatasi kategori yang ditugaskan), `SUPERADMIN` (akses penuh).\n\n' +
      '**Format respons**: sebagian besar endpoint memakai bungkus `{ status, statusCode, message, data, timestamp }`. ' +
      'Error validasi berisi array `errors` per field.\n\n' +
      '**Real-time**: event Socket.IO didokumentasikan di `docs/api/SocketEvents.md`.',
  },
  servers: [
    { url: '/', description: 'Host saat ini' },
    { url: 'http://localhost:6060', description: 'Backend lokal (npm run dev)' },
  ],
  tags: [
    { name: 'Auth', description: 'Registrasi, login, token, reset password, dan manajemen perangkat.' },
    {
      name: 'Users',
      description:
        'Profil, preferensi, verifikasi mahasiswa, dan manajemen pengguna. ADMIN hanya dapat mengelola akun MAHASISWA.',
    },
    {
      name: 'Categories',
      description: 'Kategori pengaduan. Daftar, pencarian, dan slug bersifat publik; perubahan hanya oleh SUPERADMIN.',
    },
    {
      name: 'Reports',
      description:
        'Laporan pengaduan. ADMIN hanya mengelola laporan pada kategori yang ditugaskan; identitas pelapor anonim selalu disamarkan.',
    },
    {
      name: 'Chat',
      description: 'Pesan per laporan antara pelapor dan admin. Pembaruan real-time lewat Socket.IO.',
    },
    { name: 'Admin', description: 'Dasbor dan ekspor CSV untuk ADMIN/SUPERADMIN.' },
    { name: 'Admin Governance', description: 'Khusus SUPERADMIN: peran admin dan penugasan kategori.' },
    { name: 'Audit Logs', description: 'Khusus SUPERADMIN: jejak aksi penting.' },
    {
      name: 'Bulk Operations',
      description: 'Operasi massal 1–100 item; item yang gagal dilaporkan di `skipped` tanpa menggagalkan item lain.',
    },
    { name: 'Health', description: 'Liveness dan readiness probe.' },
  ],
  security: [{ bearerAuth: [] }],
};

const options = {
  definition,
  apis: [path.resolve(__dirname, '../docs/openapi/*.yaml')],
};

const spec = swaggerJsdoc(options);

// Top-level `x-*` keys in the YAML files are only YAML anchors for reuse;
// drop them so they do not leak into the published spec.
for (const key of Object.keys(spec)) {
  if (key.startsWith('x-')) delete spec[key];
}

module.exports = spec;
