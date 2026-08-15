/**
 * OpenAPI / Swagger configuration.
 *
 * The spec is generated from JSDoc comments in route files.
 * UI mounted at /api/docs in non-production environments by default.
 * Set ENABLE_SWAGGER=true to enable in production.
 */

const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Pengaduan Kemahasiswaan API',
    version: '1.0.0',
    description:
      'REST API untuk Sistem Pelaporan dan Pengaduan Kemahasiswaan Universitas Bung Hatta. ' +
      'Sebagian besar endpoint memerlukan autentikasi via Bearer JWT (access token).',
  },
  servers: [
    { url: 'http://localhost:6060', description: 'Local development' },
    { url: '/', description: 'Current host' },
  ],
  tags: [
    { name: 'Auth', description: 'Login, register, token refresh, password reset' },
    { name: 'Users', description: 'Manajemen pengguna dan verifikasi mahasiswa' },
    { name: 'Categories', description: 'Kategori pengaduan' },
    { name: 'Reports', description: 'CRUD laporan pengaduan' },
    { name: 'Chat', description: 'Pesan per laporan' },
    { name: 'Audit Logs', description: 'Jejak audit aksi sensitif' },
    { name: 'Admin', description: 'Dashboard admin & analitik' },
    { name: 'Bulk Operations', description: 'Operasi massal' },
    { name: 'Health', description: 'Health checks (live, ready)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token. Login response berisi `accessToken`.',
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'httpOnly refresh token cookie, di-set otomatis saat login.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          statusCode: { type: 'integer', example: 400 },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      SuccessEnvelope: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string' },
          data: {},
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          nim: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['MAHASISWA', 'ADMIN'] },
          isVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Report: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          registrationNumber: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: {
            type: 'string',
            enum: ['PENDING', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELED'],
          },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          isAnonymous: { type: 'boolean' },
          userId: { type: 'integer', nullable: true },
          categoryId: { type: 'integer', nullable: true },
          assignedToId: { type: 'integer', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          slug: { type: 'string' },
          defaultPriority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          allowAnonymous: { type: 'boolean' },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          content: { type: 'string' },
          senderId: { type: 'integer' },
          reportId: { type: 'integer' },
          isRead: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          accessToken: { type: 'string' },
          data: { $ref: '#/components/schemas/User' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  definition,
  // Pull JSDoc from route files (and controllers if they have @swagger)
  apis: [
    path.resolve(__dirname, '../routes/*.js'),
    path.resolve(__dirname, '../controllers/*.js'),
  ],
};

const spec = swaggerJsdoc(options);

module.exports = spec;
