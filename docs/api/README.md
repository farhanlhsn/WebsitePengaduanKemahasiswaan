# Dokumentasi API

Referensi lengkap 85 endpoint REST tersedia dalam format OpenAPI 3.0. Halaman ini menjelaskan cara membacanya, konvensi yang berlaku di semua endpoint, dan cara memperbaruinya.

| Kebutuhan | Tempat |
| --- | --- |
| Mencoba endpoint di browser | Swagger UI di `http://localhost:6060/api/docs` (backend `npm run dev`) |
| Berkas spesifikasi untuk Postman/Insomnia | [`openapi.json`](openapi.json) |
| Sumber dokumentasi (yang diedit) | `backend/src/docs/openapi/*.yaml` |
| Event real-time chat | [`SocketEvents.md`](SocketEvents.md) |

Swagger UI aktif otomatis di luar produksi. Di produksi hanya aktif bila `ENABLE_SWAGGER=true`. Aktifkan sementara saja, karena halaman ini memperlihatkan seluruh permukaan API.

## Memulai dalam 3 langkah

```bash
# 1. Login, simpan access token dan cookie refresh token
curl -s -c cookies.txt -X POST http://localhost:6060/v1/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@kampus.ac.id","password":"<password>"}'
# -> { "accessToken": "<access-token-jwt>", "data": { "role": "SUPERADMIN", ... } }

# 2. Panggil endpoint dengan token
curl -s http://localhost:6060/v1/api/reports/stats -H "Authorization: Bearer $TOKEN"

# 3. Access token berlaku 15 menit. Saat kedaluwarsa (401), minta token baru memakai cookie
curl -s -b cookies.txt -c cookies.txt -X POST http://localhost:6060/v1/api/auth/refresh-token
```

Mengimpor ke Postman: **Import → File → `docs/api/openapi.json`**, lalu isi variabel `baseUrl` dan token Bearer di tab *Authorization* koleksi.

## Peran dan cakupan akses

| Peran | Cakupan |
| --- | --- |
| `MAHASISWA` | Hanya data milik sendiri. Harus terverifikasi (`isVerified`) untuk login, membuat laporan, dan mengirim chat. |
| `ADMIN` | Laporan, chat, statistik, dan ekspor hanya untuk kategori di `admin_category_assignments`. Admin tanpa penugasan melihat daftar kosong. Hanya bisa mengelola akun MAHASISWA. |
| `SUPERADMIN` | Semua data, ditambah kategori, tata kelola admin, audit log, ekspor pengguna, dan hapus permanen. |

Pemeriksaan akses terpusat ada di `backend/src/utils/accessPolicy.js`, `rbac.js`, dan `userGovernancePolicy.js`. Gunakan fungsi yang sama saat menambah endpoint baru.

Identitas pelapor **laporan anonim** selalu disamarkan untuk semua peran, termasuk SUPERADMIN: `userId` bernilai `null` dan `user.name` diisi `"Anonim"`. Setiap kali admin membuka laporan anonim, aksi itu dicatat di audit log sebagai `VIEW_ANONYMOUS`.

## Konvensi respons

Sebagian besar endpoint memakai bungkus dari `utils/responseFormatter.js`:

```json
{ "status": "success", "statusCode": 200, "message": "...", "data": { }, "timestamp": "2026-10-08T08:09:23.305Z" }
```

```json
{ "status": "error", "statusCode": 400, "message": "Invalid value",
  "errors": [ { "field": "title", "message": "Invalid value", "location": "body", "value": "ab" } ] }
```

Pengecualian yang perlu diketahui (perilaku saat ini, belum diseragamkan):

- Middleware autentikasi mengembalikan `{ "error": "Access token required" }` (401) tanpa bungkus standar.
- Endpoint `/auth/*` mengembalikan `{ status, message, data }` tanpa `statusCode`/`timestamp`; `refresh-token` hanya `{ accessToken, data }`.
- `POST /reports/{reportId}/attachments` mengembalikan `{ attachments: [...] }`.
- Beberapa endpoint pembuatan data mengirim HTTP 201 tetapi `statusCode` di body bernilai 200, dan transisi status yang ditolak mengirim HTTP 400 dengan `statusCode` 500 di body. **Selalu gunakan kode status HTTP**, bukan field `statusCode`.

## Paginasi

| Gaya | Dipakai di | Parameter | Info halaman |
| --- | --- | --- | --- |
| Kursor | `GET /reports`, `GET /reports/user` | `limit` (≤100), `lastItemId` | `pagination.hasNextPage`, `pagination.lastItemId` |
| Halaman | `GET /chat/reports`, `GET /chat/reports/{id}/messages` | `page`, `limit` | `pagination.totalPages` |
| Offset | `GET /audit-logs` | `limit` (≤200), `offset` | `pagination.hasMore` |
| Tanpa paginasi | Daftar pengguna, kategori, admin | — | — |

## Rate limit

Penyimpanan counter memakai Redis (`REDIS_URL`). Kunci IP dihitung dari `X-Forwarded-For` sesuai `TRUST_PROXY`.

| Batas | Nilai | Kunci |
| --- | --- | --- |
| Global (semua request) | 500 / 15 menit | IP |
| Login gagal | 20 / 15 menit | IP |
| Registrasi | 20 / jam | IP |
| Lupa / reset password | 3 / 15 menit | IP |
| Refresh token | 60 / 15 menit | IP |
| Buat laporan | 5 / jam | Pengguna |
| Unggah berkas | 10 / menit | Pengguna |
| Event `chat:typing` (socket) | 120 / menit | Socket |

Respons 429 berisi pesan berbahasa Indonesia dan header standar `RateLimit-*`.

> **Catatan (Oktober 2026):** sebelum PR #10, semua limiter berbasis IP berbagi satu key Redis (`rl:<ip>`), sehingga counter global ikut menghabiskan kuota login, registrasi, dan lupa password. PR #10 memberi setiap limiter prefix sendiri (`rl:<nama>:`). Hapus catatan ini setelah PR #10 digabung.

## Unggah berkas

| Konteks | Endpoint | Field | Tipe | Batas |
| --- | --- | --- | --- | --- |
| KTM | `POST /auth/registerStudent` | `ktm` | JPEG, PNG, WebP | 5 MB |
| Lampiran laporan | `POST /reports/{id}/attachments` | `files` (maks. 10) | JPEG, PNG, WebP, PDF, DOC, DOCX | 5 MB/berkas |
| Lampiran chat | `POST /chat/reports/{id}/upload` lalu `attachmentTokens` saat kirim pesan | `files` (maks. 10) | sama | 5 MB/berkas |

Validasi dilakukan pada MIME, ekstensi, dan *magic bytes* (`utils/fileValidation.js`). Gambar dikompresi dengan Sharp. Berkas disajikan di `/uploads/...` hanya untuk pengguna login: dengan header Bearer, atau dengan cookie refresh token untuk tag `<img>` di browser. `fileAccessMiddleware` lalu memeriksa kepemilikan atau hak akses laporan. Berkas selain gambar dikirim sebagai unduhan. Path `/uploads/chat-pending` tidak dapat diakses langsung.

## Memperbarui dokumentasi

Setiap kali menambah atau mengubah route, validator, atau bentuk respons:

1. Edit file modul yang sesuai di `backend/src/docs/openapi/`:

   | File | Isi |
   | --- | --- |
   | `components.yaml` | Skema bersama (`User`, `Report`, `Message`, ...), parameter umum, respons error standar |
   | `auth.yaml` | `/auth/*` |
   | `users.yaml` | `/users/*` |
   | `categories.yaml` | `/categories/*` |
   | `reports.yaml` | `/reports/*` |
   | `chat.yaml` | `/chat/*` |
   | `admin.yaml` | `/admin/*`, `/admin-governance/*`, `/audit-logs/*`, `/bulk-operations/*`, `/api/health*` |

2. Ekspor ulang berkas statis: `cd backend && npm run docs:openapi`.
3. Validasi: `npx @redocly/cli lint docs/api/openapi.json`. Peringatan `no-ambiguous-paths` dan `operation-4xx-response` pada health check memang sudah diketahui dan aman diabaikan.
4. Pastikan semua route terdokumentasi. Jumlah operasi yang dicetak langkah 2 harus sama dengan jumlah route di `backend/src/routes/` ditambah tiga health check.

Aturan penulisan YAML:

- Jangan memakai anchor/alias YAML (`&nama` / `*nama`); parser swagger-jsdoc mengabaikan file yang memakainya tanpa pesan error.
- Beri tanda kutip pada teks yang mengandung koma atau titik dua di dalam `{ ... }`.
- Tag (kelompok endpoint) didefinisikan dan diurutkan di `backend/src/config/swagger.js`.
