# Audit Remediation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperbaiki seluruh temuan audit keamanan, bisnis flow, dan UI/UX (audit 2026-08-15) sehingga sistem aman untuk production.

**Architecture:** Perbaikan dilakukan berlapis per fase: (0) respon insiden secrets, (1) temuan CRITICAL, (2) HIGH, (3) MEDIUM backend, (4) MEDIUM/HIGH frontend, (5) LOW + hardening + verifikasi akhir. Setiap task mandiri dan bisa diverifikasi lewat quality gate repo.

**Tech Stack:** Node.js, Express, Prisma, PostgreSQL, Socket.IO, React, Material UI, Zustand

**Referensi:** Temuan lengkap ada di laporan audit (chat session audit 2026-08-15). ID temuan di bawah (C1, S1, B1, M*, H*, L*) merujuk ke laporan tersebut.

---

## Status Implementasi (update 2026-08-15, sesi eksekusi)

| Fase | Status | Bukti verifikasi |
|---|---|---|
| **Phase 0** — secrets/compose | ✅ Selesai (0.1 skipped keputusan owner; 0.2 compose wajib diisi) | `docker compose config` tanpa env → gagal |
| **Phase 1** — CRITICAL (C1, C2, C3, S1) | ✅ Selesai semua | unit 215 ✅, integration 36 ✅ |
| **Phase 2** — HIGH (B1–B5) | ✅ Selesai semua | unit + integration ✅ |
| **Phase 3** — MEDIUM backend | ✅ Selesai (kecuali 3.14 read-receipt & 3.18 alasan — butuh migrasi, lihat "Ditunda") | unit + integration ✅ |
| **Phase 4** — Frontend | 🟡 Sebagian besar selesai (semua HIGH 4.1–4.6 + 4.11/4.12/4.14). Sisanya UX enhancement, lihat "Ditunda" | lint ✅, build ✅, component test 25 ✅ |
| **Phase 5** — LOW + verifikasi | 🟡 Verifikasi gate lulus; item LOW backend (L3/L4/L5 dst) sebagian ikut tergarap di Phase 3 | gate README lulus |

**Ringkasan jumlah test:** backend unit 215, backend integration 36, frontend component 25 — semua hijau. Frontend `lint` & `build` bersih.

Bonus di luar plan (bug laten yang ditemukan & diperbaiki selama eksekusi):
- `RegisterPage.jsx`: import `AccountCircle` dari `@mui/material` (seharusnya `@mui/icons-material`) — pre-existing, merusak seluruh suite component test.
- `redis.js`: `log.error is not a function` saat Redis down → proses crash (pakai `{ getLogger }`).
- `prisma.js` & `server.js`: refactor pre-existing `const log = require('./logger')` memanggil `log.info(...)` yang `undefined` → backend crash saat startup; diperbaiki ke `getLogger(...)`.

---

## Global Constraints

- **Jangan ubah struktur response API** `{ status, message, data }` yang sudah ada; frontend bergantung padanya.
- **Schema database hanya boleh berubah di task yang secara eksplisit menuliskan migrasi** (T3.14 read-receipt, T3.18 opsional). Semua perbaikan lain tidak butuh migrasi.
- Setiap perubahan backend yang menyentuh authorization **wajib** ditambah/diperbarui unit test-nya di `backend/tests/unit`.
- Anonimitas pelapor adalah invariant absolut: setelah Phase 1 selesai, tidak boleh ada satu pun jalur (REST, socket, export, audit log, email) yang membocorkan identitas pelapor anonim.
- Commit kecil per task dengan pesan `fix(security):` / `fix(ux):` / `chore:`.

## Urutan & Dependensi

```
Phase 0 (secrets) ──> bisa paralel dengan semua phase
Phase 1 (CRITICAL) ──> Phase 2 ──> Phase 3 ──> Phase 5
                                  └> Phase 4 (paralel dengan Phase 3)
```

Estimasi total: 5–7 hari kerja (1 developer), atau ~2 hari jika 2 developer paralel (backend + frontend).

---

## Phase 0 — Respon Insiden Secrets (lakukan PERTAMA)

### Task 0.1: Kredensial di `backend/.env` — ~~rotasi~~ SKIPPED (keputusan owner)

**Konteks:** `.env` lokal berisi kredensial asli (Prisma Cloud, JWT secret, SMTP), tapi tidak ter-track git dan history sudah diverifikasi bersih. Owner memutuskan tidak merotasi (2026-08-15).

**Risiko diterima (accepted risk):** kredensial hanya aman selama file `backend/.env` tidak pernah disalin/dibagikan/terbackup ke tempat lain (laptop lain, cloud sync, chat, CI log). Jika suatu saat file ini bocor, rotasi tetap diperlukan.

- [x] ~~Rotasi kredensial~~ — **ditutup tanpa aksi** per keputusan owner.
- [ ] **Step 1 (murah, tetap disarankan):** pastikan `.env` tidak ikut ter-sync/ter-backup tak sengaja (mis. exclude dari backup cloud) dan pastikan `.gitignore` tetap memuat `.env*` (sudah ada — cukup diverifikasi sekali):
```bash
git check-ignore backend/.env frontend/.env  # harus menghasilkan kedua path
```

### Task 0.2: Hapus default lemah di `docker-compose.prod.yml`

**Files:** `docker-compose.prod.yml`

- [ ] **Step 1:** Baris 10 — ganti `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}` menjadi `POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD wajib diisi}` (compose gagal start jika kosong).
- [ ] **Step 2:** Baris 68 — ganti `SEED_SUPERADMIN_PASSWORD: ${SEED_SUPERADMIN_PASSWORD:-superadmin12345}` menjadi `${SEED_SUPERADMIN_PASSWORD:?...}` dengan pola sama.
- [ ] **Step 3:** Update `README.md` bagian Deployment: dokumentasikan kedua variabel wajib.
- [ ] **Step 4:** Verifikasi: `docker compose -f docker-compose.prod.yml config` tanpa env harus GAGAL; dengan env harus lulus.

---

## Phase 1 — CRITICAL (blokir semua sebelum lanjut)

### Task 1.1 (C2): Whitelist field `PUT /users/:id` + audit log

**Files:**
- Modify: `backend/src/controllers/userControllers.js` (updateUser)
- Modify: `backend/src/routes/userRoutes.js:50`
- Test: `backend/tests/unit/controllers/userControllers.test.js` (buat jika belum ada)

- [ ] **Step 1:** Di `updateUser`, ganti `userServices.updateUser(userId, req.body)` dengan konstruksi objek eksplisit:
```javascript
const updateData = {};
if (req.body.name !== undefined) updateData.name = req.body.name;
if (req.body.email !== undefined) updateData.email = req.body.email;
if (req.body.nim !== undefined) updateData.nim = req.body.nim;
if (Object.keys(updateData).length === 0) {
  return res.status(400).json(ResponseFormatter.error('Tidak ada field yang dapat diperbarui', 400));
}
const updatedUser = await userServices.updateUser(userId, updateData);
```
- [ ] **Step 2:** Sebagai defense-in-depth, tambahkan guard di `userServices.updateUser`: buang kunci terlarang sebelum Prisma:
```javascript
const FORBIDDEN = ['role','password','isVerified','tokenVersion','deletedAt','ktmPath','email','id'];
const safe = Object.fromEntries(Object.entries(data).filter(([k]) => !FORBIDDEN.includes(k) || ['name','nim'].includes(k)));
```
(Whitelist di controller tetap sumber kebenaran utama.)
- [ ] **Step 3:** Tambah audit log di controller (`entityType: 'USER', action: 'UPDATE', metadata: { fields: Object.keys(updateData) }`).
- [ ] **Step 4:** Test unit: ADMIN mengirim `{role:'SUPERADMIN'}` ke user MAHASISWA → role target TIDAK berubah (200 dengan hanya field sah, atau 400); kirim `{password:'x'}` → password tidak berubah.
- [ ] **Step 5:** Jalankan `cd backend && npm test -- --runInBand`.

### Task 1.2 (C3): Authorization & validasi bulk operations

**Files:**
- Modify: `backend/src/routes/bulkOperationsRoutes.js`
- Modify: `backend/src/services/bulkOperationsServices.js`
- Modify: `backend/src/controllers/bulkOperationsControllers.js`
- Test: `backend/tests/unit/services/bulkOperationsServices.test.js`

- [x] **Step 1 — Gate role:** ~~SUPERADMIN untuk user ops~~ **Revisi implementasi (2026-08-15):** user ops tetap tier ADMIN (konsisten dengan endpoint tunggal & README governance "Admin boleh kelola mahasiswa"), tapi tiap target divalidasi dengan `assertCanManageUser` yang sama persis dengan endpoint tunggal — ADMIN hanya bisa proses MAHASISWA, last-superadmin guard dihitung ulang per item, self-delete diblokir. Category ops = SUPERADMIN only.
- [ ] **Step 2 — Scoping laporan:** di `bulkUpdateReportStatus`, `bulkDeleteReports`, `bulkRestoreReports`: untuk SUPERADMIN loloskan semua; untuk ADMIN fetch dulu report-report target (`id in ids`), filter dengan `getAccessibleCategoryIds(actor)` (`adminGovernanceServices`), proses hanya yang lolos, kembalikan `results: [{id, ok, reason}]` + `skipped: [...]`.
- [ ] **Step 3 — State machine:** `bulkUpdateReportStatus` wajib menolak transisi ilegal memakai peta `validTransitions` yang sama dengan `reportControllers.updateReportStatus`; ekstrak peta ke `backend/src/utils/reportTransitions.js` agar satu sumber. Wajibkan `reason` untuk REJECTED/CANCELED (body validation di route).
- [ ] **Step 4 — Guard user:** `bulkVerifyUsers` tambah filter `role: 'MAHASISWA'` + `ktmPath != null` + `deletedAt = null`. `bulkDeleteUsers`/`bulkRestoreUsers`: blokir target SUPERADMIN (kecuali restore) dan terapkan logika last-superadmin.
- [ ] **Step 5 — Guard kategori:** `bulkDeleteCategories` tolak kategori yang punya laporan aktif (pakai guard sama dengan `categoryServices.js:326-347`).
- [ ] **Step 6 — Limit:** validasi `userIds/reportIds/categoryIds` max 100 item (`isArray({min:1, max:100})` di route).
- [ ] **Step 7 — Audit:** satu audit log per operasi dengan `metadata: { ids, affected, skipped }` (bukan `entityId: 0`).
- [ ] **Step 8:** Test unit: ADMIN scoped kategori A mencoba bulk status laporan kategori B → skipped; bulk delete berisi SUPERADMIN → ditolak; batch > 100 → 400.

### Task 1.3 (C1): Anonimitas di Socket.IO + pembatasan direktori user

**Files:**
- Modify: `backend/src/sockets/chatHandler.js` (room:joined :88-91, chat:typing :134-138)
- Modify: `backend/src/sockets/socketEmitters.js` (room:left :17-20)
- Modify: `backend/src/sockets/roomAccess.js` (sertakan `report.isAnonymous` + `report.userId` di hasil check)
- Modify: `backend/src/controllers/chatControllers.js` (emit `chat:read` :115-119; `chat:message` sudah benar)
- Modify: `backend/src/utils/accessPolicy.js` (canAccessUser :79-83)
- Test: `backend/tests/unit/` + `backend/tests/integration/` (chat socket)

- [ ] **Step 1:** Di `roomAccess.assertSocketEventAllowed`, fetch report dengan field `isAnonymous, userId` dan ikutkan di object `check` yang dikembalikan.
- [ ] **Step 2:** Buat helper `publicIdentity(check, actorRole)`:
```javascript
// Untuk report anonim: identitas pelapor menjadi pseudonim stabil
if (check.report?.isAnonymous && check.user.userId === check.report.userId) {
  return 'reporter';
}
return check.user.userId;
```
- [ ] **Step 3:** Terapkan helper di SEMUA emit yang memuat userId pelapor: `room:joined`, `chat:typing`, `room:left` (disconnect path), dan `chat:read` (`readByUserId` di `chatControllers.markAsRead`). `chat:message` sudah anonim via `anonPayload` — samakan format pseudonimnya.
- [ ] **Step 4 — Direktori user:** ubah `canAccessUser` (`accessPolicy.js:79-83`): ADMIN biasa hanya boleh membaca user MAHASISWA; membaca ADMIN/SUPERADMIN lain hanya untuk SUPERADMIN. Pastikan `userControllers.getUserById`, `getUserStatsById`, `getUserByEmail` memakainya.
- [ ] **Step 5:** Test integration: buat report anonim → pelapor join room + typing → assert payload yang diterima socket admin TIDAK berisi userId asli pelapor (berisi `'reporter'`).
- [ ] **Step 6:** Test unit: ADMIN memanggil `GET /users/:id` dengan id SUPERADMIN → 403.
- [ ] **Step 7:** Verifikasi manual: jalankan 2 browser (mahasiswa anonim + admin), buka chat, cek event via DevTools → Network → WS.

### Task 1.4 (S1): Perbaiki penanganan IP untuk rate limiting

**Files:**
- Modify: `backend/src/middlewares/deviceTrackingMiddleware.js`
- Modify (verify): `backend/src/app.js:23-35` (trust proxy)
- Test: `backend/tests/unit/middlewares/deviceTrackingMiddleware.test.js`

- [ ] **Step 1:** HAPUS override `req.ip = realIp` (baris 8-16). Biarkan Express menghitung `req.ip` berdasarkan `trust proxy`. Simpan `req.deviceInfo` seperti sekarang, tapi ambil IP dari `req.ip` (hasil trust-proxy-aware), bukan header mentah:
```javascript
const deviceTrackingMiddleware = (req, res, next) => {
  const extraFingerprint = {
    acceptLanguage: req.headers['accept-language'] || '',
    fingerprintId: req.headers['x-device-fingerprint'] || '',
  };
  req.deviceInfo = deviceDetection.getDeviceInfo(req, extraFingerprint); // pakai req.ip di dalamnya
  next();
};
```
- [ ] **Step 2:** Audit `backend/src/utils/deviceDetection.js` — pastikan `ipAddress` diambil dari `req.ip`, bukan `x-forwarded-for` mentah.
- [ ] **Step 3:** Di deployment (nginx), pastikan hanya ada SATU sumber X-Forwarded-For tepercaya. Karena `docker-compose.prod.yml` memakai `TRUST_PROXY: '2'` (external proxy → nginx → backend), dokumentasikan di `docs/ProductionRunbook.md` bahwa external LB harus menimpa (bukan append) XFF, atau set `TRUST_PROXY=1` jika nginx adalah hop pertama.
- [ ] **Step 4:** Test unit: request dengan header `X-Forwarded-For: 1.2.3.4` tanpa konfigurasi trust proxy → `req.ip` tetap IP socket, bukan `1.2.3.4`.
- [ ] **Step 5:** Verifikasi manual: 21x login gagal dari IP sama → response ke-21 adalah 429.

---

## Phase 2 — HIGH

### Task 2.1 (B1): Transisi status laporan atomik

**Files:** `backend/src/controllers/reportControllers.js` (updateReportStatus), `backend/src/services/reportServices.js:315-340`

- [ ] **Step 1:** Ubah `ReportServices.updateReportStatus` menjadi conditional update:
```javascript
const result = await prisma.report.updateMany({
  where: { id, status: expectedOldStatus, deletedAt: null },
  data: { status: newStatus, ...(closedStatus ? { closedAt: new Date() } : {}) },
});
if (result.count !== 1) { throw Object.assign(new Error('Status laporan berubah oleh proses lain. Muat ulang.'), { statusCode: 409 }); }
return prisma.report.findUnique({ where: { id } });
```
- [ ] **Step 2:** Controller mengirim `oldStatus` sebagai `expectedOldStatus`.
- [ ] **Step 3:** Set `closedAt` juga untuk REJECTED/CANCELED (saat ini hanya bulk RESOLVED yang mengisi — konsistensi, temuan I2).
- [ ] **Step 4:** Terapkan pola conditional-update yang sama di `editReport` (guard `status: 'PENDING'`) dan `deleteReport`/`restoreReport` mahasiswa.
- [ ] **Step 5:** Test unit: transisi konkuren disimulasikan (oldStatus tidak cocok) → 409 dengan pesan ramah.

### Task 2.2 (B2): Serialisasi guard superadmin-terakhir

**Files:** `backend/src/services/adminGovernanceServices.js` (demoteSuperAdmin :164-190), `backend/src/utils/userGovernancePolicy.js:77-89`, controller delete user

- [ ] **Step 1:** Buat helper `withSuperAdminLock(tx, fn)` yang menjalankan `SELECT pg_advisory_xact_lock(hashtext('superadmin_guard'))` di awal transaksi.
- [ ] **Step 2:** Bungkus `demoteSuperAdmin`, delete user (path yang bisa menghapus/demote superadmin), dan `demoteAdmin` jika relevan, dalam `$transaction` + advisory lock + hitung ulang jumlah superadmin DI DALAM lock.
- [ ] **Step 3:** Test integration (jika Postgres test container tersedia): dua demote paralel dengan 2 superadmin → tepat satu yang sukses, satu lagi error.

### Task 2.3 (B3): Wajibkan KTM di registrasi & verifikasi

**Files:** `backend/src/utils/fileValidation.js:127-140`, `backend/src/routes/authRoutes.js`, `backend/src/controllers/authControllers.js:100-107`, `backend/src/services/userServices.js` (verifyUser)

- [ ] **Step 1:** Di `authControllers.registerStudent`: jika `!req.file` → return 400 `'KTM wajib diunggah untuk registrasi'`.
- [ ] **Step 2:** `createValidateUploadedMiddleware(allowedMap, { required: true })` — tambah opsi `required` sehingga daftar file kosong = error. Pakai `{ required: true }` untuk KTM.
- [ ] **Step 3:** `verifyUser` (dan `bulkVerifyUsers` — sudah dicakup Task 1.2 Step 4): tolak jika `target.ktmPath == null` dengan pesan 'User tidak memiliki KTM'.
- [ ] **Step 4:** Test unit: register tanpa file → 400; verify user tanpa ktmPath → 400.

### Task 2.4 (B4): Tolak login user soft-deleted

**Files:** `backend/src/services/authServices.js:14-22`

- [ ] **Step 1:** `findUnique({ where: { email } })` → tambah pengecekan: `if (!user || user.deletedAt) throw new Error('email/password salah')` (pesan generik, jangan bocorkan status deleted).
- [ ] **Step 2:** Test unit: user deleted + password benar → 401 'email/password salah'.

### Task 2.5 (B5): Scoping endpoint statistik/export/direktori

**Files:**
- `backend/src/controllers/reportControllers.js` (getReportStats :588-597)
- `backend/src/services/adminDashboardServices.js` (getUsersStats :77-102)
- `backend/src/controllers/exportControllers.js` (exportUsers :110-160)
- `backend/src/services/categoryServices.js` (with-reports :141-193)
- `backend/src/routes/adminRoutes.js`, `categoryRoutes.js`

- [ ] **Step 1:** `GET /reports/stats`: scope by `getAccessibleCategoryIds` untuk ADMIN; global hanya SUPERADMIN.
- [ ] **Step 2:** `getUsersStats`: hormati parameter `scope` yang sudah dikirim (`adminRoutes.js:54`) atau gate SUPERADMIN — pilih gate SUPERADMIN (statistik user bukan domain admin kategori).
- [ ] **Step 3:** `GET /admin/export/users` → pindahkan ke `isSuperAdminMiddleware` di `adminRoutes.js`.
- [ ] **Step 4:** `GET /categories/with-reports`: untuk ADMIN hanyaembalikan kategori assignment-nya; atau hapus preview judul laporan (pilih salah satu; rekomend: scope kategori).
- [ ] **Step 5:** Test unit per endpoint: ADMIN tanpa assignment mendapat payload kosong/scoped, SUPERADMIN penuh.

---

## Phase 3 — MEDIUM Backend

> Setiap task kecil; kerjakan berurutan. Semua butuh minimal 1 test unit.

### Task 3.1 (M10): Whitelist filter query daftar laporan
- [ ] Di `reportControllers.getAllReportsPaginated` (:44-45) dan `getAllReportsByUserIdPaginated` (:141-142), ganti `{ ...rest }` dengan pemetaan eksplisit field yang diizinkan: `search, status, categoryId, createdAt` (sesuai yang sudah divalidasi express-validator di route). JANGAN spread `req.query` ke Prisma `where`. Khusus `/reports/user`: `userId` selalu dari `req.user.userId`, tidak boleh dari query.

### Task 3.2: Sanitizer tidak boleh mengubah password
- [ ] `sanitizeMiddleware.js`: skip key `password`, `currentPassword`, `newPassword` (rekursif di semua kedalaman). Password tetap dilindungi bcrypt; sanitasi HTML tidak relevan untuknya dan justru memodifikasi nilai (`&` → `&amp;`).

### Task 3.3 (M3): Idempotency chat yang benar
- [ ] `chatServices.js`: pindahkan dedupe ke dalam transaksi — coba create, catch `P2002` pada `@@unique([reportId, senderId, clientMessageId])`, lalu return baris existing dengan flag `replayed: true`.
- [ ] `chatControllers.sendMessage`: jika `replayed`, JANGAN emit `chat:message` ulang dan JANGAN jadwalkan email offline; kembalikan 200/201 dengan pesan existing.

### Task 3.4 (M4): Re-check status laporan tertutup saat kirim pesan
- [ ] Di transaksi create message (`chatServices.js:152-160`), baca ulang `report.status` (atau `findFirst` dengan `where: { id, status: { in: [...open] } }`); jika tertutup → batalkan dengan error kebijakan yang sudah ada.

### Task 3.5 (M5): Pesan terhapus benar-benar hilang
- [ ] `chatServices.js:17-23` (`MESSAGE_INCLUDE.replyTo`): setelah fetch, bila `replyTo.deletedAt` → ganti payload `replyTo` menjadi `{ id, content: '[pesan dihapus]', deleted: true }` di layer serializer.
- [ ] `fileAccessMiddleware.checkChatAttachmentOwnership`: tolak bila `attachment.message.deletedAt` terisi.
- [ ] Test: hapus pesan yang sudah dibalas → reply tidak lagi memuat konten asli; attachment pesan terhapus → 403/404.

### Task 3.6 (M6): Cabut akses sisa admin yang di-demote/revoke
- [ ] `adminGovernanceServices.demoteAdmin/revokeCategory`: (a) `UPDATE Report SET assignedToId = NULL WHERE assignedToId = userId AND category terdampak`, (b) emit via `req.app.get('io')` ke room `user_<id>` event `access:revoked` agar frontend disconnect/re-fetch, dan/atau simpan `assignmentVersion` yang dicek `roomAccess` tiap event.
- [ ] `chatOfflineNotificationService.js:56-66`: sebelum email ke `assignedToId`, verifikasi assignment masih aktif.
- [ ] Test: revoke kategori → socket pasif tidak lagi menerima `chat:message` report kategori itu (integration) ATAU event berikutnya ditolak (unit pada roomAccess).

### Task 3.7 (M7): Ganti email profil butuh password + domain check
- [ ] `userControllers.updateProfile`: jika `email` berubah → wajibkan `currentPassword` di body, verifikasi bcrypt, validasi `isAllowedDomain`, lalu naikkan `tokenVersion` + hapus refresh token (sesi lain mati) agar user login ulang dengan email baru. Sertakan pesan 'Email berubah, silakan login kembali'.

### Task 3.8 (M8): Izinkan daftar ulang user rejected/deleted
- [ ] `authServices.registerStudent` (:231-246): duplicate check dengan `where: { email, deletedAt: null }` dan `{ nim, deletedAt: null }`. Jika ada baris soft-deleted dengan email/NIM sama → hard delete baris lama (atau restore+reset) sebelum create, dalam satu transaksi.

### Task 3.9 (M9): editReport validasi ulang kategori & anonimitas
- [ ] `reportControllers.editReport`: jika `categoryId` berubah → fetch kategori baru dengan `deletedAt: null`; jika `report.isAnonymous && !category.allowAnonymous` → 400. Terapkan conditional update status PENDING (pola Task 2.1).
- [ ] `reportServices.createReport` (:279-282): filter `deletedAt: null` saat lookup kategori.

### Task 3.10 (M12): Bereskan endpoint hard-delete kategori yang terbalik
- [ ] `categoryControllers.js:224,:297`: ganti `if (req.user.role !== 'ADMIN')` → hapus cek itu (route sudah `isSuperAdminMiddleware`), ATAU ubah jadi `if (!isSuperAdmin(req.user))`. Tambah guard: hard-delete hanya boleh jika tidak ada report terkait (atau set null categoryId dengan audit log eksplisit). Tambahkan audit log HARD_DELETE.

### Task 3.11 (M14): File laporan/pesan terhapus tidak disajikan
- [ ] `accessPolicy.getReportForAccess`: bila dipanggil dari file middleware tanpa opsi, pastikan `deletedAt` report dicek (jangan return objek report mentah tanpa cek — `fileAccessMiddleware` menyerahkan objek report; tambahkan `if (report.deletedAt) deny`).
- [ ] Test: soft-delete report → request attachment-nya → 403/404.

### Task 3.12: Pin algoritma JWT
- [ ] Semua `jwt.verify(...)` tambahkan `{ algorithms: ['HS256'] }`: `authMiddleware.js:18`, `authControllers.js` (logout/refresh/devices), `uploadAuthMiddleware.js`, `socketAuth.js`.

### Task 3.13: Amankan geolocation IP
- [ ] `authServices.getLocationFromIP`: validasi `ipAddress` dengan regex IPv4/IPv6 sebelum dimasukkan ke URL; jika tidak valid → return `'Tidak Diketahui'` tanpa HTTP call. (Opsional: ganti `http://` ke `https://` pro.ip-api.com, atau buat fitur ini opt-in.)

### Task 3.14 (M2): Read receipt per-user — BUTUH KEPUTUSAN
**Opsi A (rekomendasi, benar):** migrasi schema `MessageRead { messageId, userId, readAt, @@unique([messageId,userId]) }`; `markAsRead` upsert; unread count = pesan tanpa baris MessageRead untuk user ini. Estimasi 1–2 hari termasuk migrasi + update query chat.
**Opsi B (cepat, parsial):** pertahankan flag tunggal tapi ubah semantics: `isRead` hanya di-set oleh sisi lawan bicara (admin menandai pesan mahasiswa, dan sebaliknya), dan hitung unread per role. Tetap tidak akurat untuk multi-admin per kategori.
- [ ] Putuskan opsi bersama owner produk, lalu implementasikan + test.

### Task 3.15 (L2): Tutup gap audit log
- [ ] Tambah `createAuditLog` di: `PUT /users/:id` (sudah di Task 1.1), `updateProfile` (perubahan email), `editReport`, `assignReport`, `updateReportPriority`, `deleteMessage` chat, dan `POST /audit-logs/cleanup` (aksi cleanup harus tercatat, metadata jumlah row dihapus).

### Task 3.16 (M1): Retry nomor registrasi
- [ ] `reportServices.createReport`: bungkus create dalam loop retry (max 3) — tangkap P2002 pada `registrationNumber`, hitung ulang nomor via `registrationGenerator`, coba lagi.

### Task 3.17 (L1): Cleanup job yang aman
- [ ] `chatPendingUploadService.cleanupExpiredChatPendingUploads`: naikkan `take` (mis. 500) + loop sampai habis per run.
- [ ] `reconcileOrphanChatPendingFiles`: hanya hapus file yang baris DB-nya tidak ada DAN umur file > 1 jam (hindari race dengan upload yang belum commit).
- [ ] `cleanupJob.js`: guard multi-instance dengan `pg_try_advisory_lock` atau Redis `SET NX EX`.

### Task 3.18: Rapikan `closedAt` & alasan reject/cancel
- [ ] Pastikan semua path penutupan (single update, bulk, delete-as-cancel mahasiswa) mengisi `closedAt`.
- [ ] Simpan `rejectedReason`/`canceledReason` sebagai field Report (migrasi kecil) agar tidak hanya hidup di metadata audit log. *(Jika tidak mau migrasi, minimal dokumentasikan bahwa alasan hanya ada di audit log.)*

---

## Phase 4 — Frontend (paralel dengan Phase 3)

### Task 4.1 (H1): Ubah password admin sungguhan
- [ ] `AdminSettingsPage.jsx:94-112`: panggil `authApi.changePassword` (pola `SettingsPage.jsx:102-134`), tambah loading state, error snackbar, dan handle `requireReLogin` (redirect ke /login dengan pesan). Hapus `alert()`.

### Task 4.2 (H2): Feedback error chat
- [ ] `ChatInterface.jsx:169-195`: catch `handleSendMessage` → snackbar 'Gagal mengirim pesan. Coba lagi.'; state `isSending` disable tombol send + indikator 'mengirim…'; kegagalan `chatApi.uploadFile` → snackbar dengan nama file.

### Task 4.3 (H3): Propagasi error registrasi
- [ ] `services/api.js:32-38`: jangan `throw new Error(message)` — biarkan error axios asli mengalir, atau sertakan `error.response` di error baru.
- [ ] `authStore.js:105-109`: fallback pesan `error.response?.data?.message || error.response?.data?.error || error.message || 'Registrasi gagal'` (semua Bahasa Indonesia).

### Task 4.4 (H4/H5): Konfirmasi semua aksi destruktif
- [ ] Buat komponen reusable `ConfirmDialog` (MUI Dialog: judul, deskripsi konsekuensi, tombol Batal/Aksi dengan color sesuai severity).
- [ ] Pasang di: delete user (row menu `AdminDataTable.jsx:223-229` + `UserDetailModal.jsx:267-271`), bulk verify/delete/restore (`AdminDataTable.handleBulkAction` + `AdminUsersPage.jsx:80-111`), demote admin & superadmin + revoke kategori (`AdminManagementPage.jsx:76-80,298-338`), delete kategori, permanent delete.
- [ ] Semua aksi bulk: snackbar hasil ('5 berhasil, 2 gagal: ...').

### Task 4.5 (H6): Migrasi MUI v7 Grid
- [ ] Ganti `<Grid item xs={...} md={...}>` → `<Grid size={{xs: ..., md: ...}}>` di: `ImprovedStudentDashboard.jsx`, `StudentChatPage.jsx`, `ReportDetailPage.jsx`, `AdminReportDetailPage.jsx`, `AdminDashboardStats.jsx`, `ProfilePage.jsx`, `SettingsPage.jsx`, `HelpPage`, `UserDetailModal.jsx`, `UserStatistics`, `AuditLogFilters`, `AuditLogDetailModal`, `DeviceManagement`.
- [ ] Verifikasi visual per halaman di breakpoint xs/md (Playwright screenshot atau manual).

### Task 4.6 (H7): Gate tombol SSO
- [ ] `LoginPage.jsx:162-189` & `RegisterPage.jsx:490-519`: render tombol hanya jika `import.meta.env.VITE_ENABLE_SSO === 'true'`. Sampai backend SSO siap, biarkan false. (Jika mau dirapikan total: hapus tombol + `loginSSO` stub sampai fitur benar-benar ada.)

### Task 4.7 (M1): Keyboard accessibility sidebar
- [ ] `StudentSidebar.jsx` & `AdminSidebar.jsx`: ganti `ListItem` + `onClick` dengan `ListItemButton` (focusable, Enter/Space bawaan) atau `<button>` ber-`role` benar; pastikan visible focus ring.

### Task 4.8 (M2/M4): Typing indicator, status koneksi, unread count
- [ ] `chatStore.js`: subscribe `chat:typing` (isi/kosongkan `typingUsers` per reportId dengan timeout 3s), subscribe `disconnected`/`connectionError` dari `socketService.js:43-46` ke state `connectionStatus`.
- [ ] `ChatInterface.jsx`: render '…sedang mengetik' dan banner 'Koneksi terputus, menyambung ulang…' bila relevan.
- [ ] Implementasikan `getUnreadCount` (stub di `chatStore.js:298`) memakai `chatApi.getUnreadCount` (`chatApi.js:45-52`); panggil saat init & setelah `chat:list:update`; hubungkan badge `StudentSidebar.jsx:169,226`.

### Task 4.9 (M3): Auto-scroll chat yang sopan
- [ ] `ChatInterface.jsx:164-167`: simpan posisi scroll; auto-scroll hanya jika user berada ≤ 150px dari bawah; jika tidak, tampilkan tombol melayang '↓ Pesan baru'.

### Task 4.10 (M9/M8): Satu sumber status & bahasa
- [ ] Buat `frontend/src/utils/statusConfig.js`: `STATUS_CONFIG = { PENDING: {label:'Menunggu', color:'#FFC107'}, ... }` dipakai `StatusBadge`, `ChatList`, `StatusChart`, `AdminDashboardPage`, `AdminAnalyticsPage`, `ReportDetailPage`. Fix bug pulse animation `StatusBadge.jsx:79-81`.
- [ ] Terjemahkan string English yang tersisa (`BulkOperationsToolbar`, `SystemSecurityPage`, status di `ChatList.jsx:70-77`, `window.confirm` di `AuditLogPage.jsx:108`).

### Task 4.11 (M7): Helper pesan error API
- [ ] Buat `utils/getApiErrorMessage.js` (prioritas: `response.data.message` → `response.data.error` → fallback Indonesia). Pakai di `UnverifiedUsersPage`, `CategoryManagementPage`, `AuditLogPage`, `SystemSecurityPage`, `AdminReportsPage`, dan semua catch yang memakai `error.message` mentah.

### Task 4.12 (M10): Ganti prompt/confirm/alert native
- [ ] `AdminReportDetailPage.jsx:107-113`: `window.prompt` alasan REJECTED/CANCELED → Dialog dengan TextField (wajib diisi untuk REJECTED/CANCELED, sinkron dengan aturan backend).
- [ ] Ganti `alert()` di `SettingsPage.jsx` & `AdminSettingsPage.jsx` dengan Snackbar; `window.confirm` di `CategoryManagementPage.jsx:188` dengan `ConfirmDialog` (Task 4.4).

### Task 4.13 (M14): Empty state & scroll tabel
- [ ] `AdminDataTable.jsx:463-535`: baris empty state ('Belum ada data' + CTA bila relevan); `TableContainer sx={{ overflowX: 'auto' }}` + `minWidth` tabel. Berlakukan juga di `UnverifiedUsersPage`, `CategoryManagementPage`, `AuditLogList`.

### Task 4.14 (M12/M13): Perbaikan dashboard mahasiswa & detail laporan
- [ ] `ImprovedStudentDashboard.jsx:113-115`: teruskan filter aktif ke `handleLoadMore`.
- [ ] `ReportDetailPage.jsx:212-232`: error state + tombol 'Coba Lagi' & 'Kembali'; try/catch + snackbar di `handleDelete`/`handleRestore` (:322-334).
- [ ] `CreateReportModal.jsx:209-245`: tampilkan `reportStore.error` di dalam modal + character counter judul/deskripsi.

### Task 4.15 (M15): KTM upload drag-drop & preview
- [ ] `RegisterKtmUpload.jsx:102-117`: implementasikan `onDragOver`/`onDrop` sungguhan (atau hapus klaim 'drag & drop'); tambah preview gambar via `URL.createObjectURL` (revoke saat unmount); luruskan teks batas ukuran dengan kenyataan kompresi.

### Task 4.16 (M5/M6/M16): Sesi, guard role, & socket lifecycle
- [ ] `axiosClient.js` + `authStore.js`: pilih SATU mekanisme single-flight refresh (rekomendasi: interceptor axios); store cukup memanggil.
- [ ] `AuthProvider.jsx:51-72`: jangan render children sebelum keputusan auth selesai (hindari flash konten terproteksi); saat sesi habis → snackbar 'Sesi Anda telah berakhir' sebelum redirect.
- [ ] `routes.jsx:136-157`: tambah wrapper `<RequireRole roles={['SUPERADMIN']}>` untuk AuditLogPage, CategoryManagementPage, SystemSecurityPage, AdminManagementPage → halaman 403/redirect konsisten (bukan hanya sembunyikan menu).
- [ ] `chatStore.initialize()`: simpan referensi listener dan `off()` saat cleanup; guard inisialisasi ganda; batasi panjang `processedNewMessageIds`.

### Task 4.17 (M17/M18): Dead affordances & export
- [ ] Hapus bell notifikasi non-fungsional (`AdminSectionHeader.jsx:69-73`) atau implementasikan; hapus `EmptyState` jika tetap tak dipakai.
- [ ] Fitur backend tanpa UI (`assignReport`, `updateReportPriority`, `editReport`, `getMyAssignedReports`): putuskan — pasang UI-nya di `AdminReportDetailPage` (assignee dropdown + priority select) atau hapus endpoint-nya. Rekomendasi: pasang UI, fitur sudah ada di backend.
- [ ] Export CSV: pakai endpoint server (`exportReportsCsv`/`exportUsersCsv`), toast sukses/gagal, ganti nama `exportUsersToExcel` sesuai kenyataan.

### Task 4.18 (M19): Kontras & dark mode
- [ ] `theme.jsx` + `ImprovedReportsTable.jsx:142-163`: teks warning `#FF9800` di putih → minimal `#B45309` (AA 4.5:1).
- [ ] Ganti warna hardcode `THEME_COLORS` (`ReportDetailPage.jsx:76-85`, `ReportInfoSidebar.jsx`) dengan token theme agar dark mode bekerja.

---

## Phase 5 — LOW, Hardening & Verifikasi Akhir

### Task 5.1: Sapu jagat LOW backend
- [ ] (L4) `fileAccessMiddleware`: ganti `filePath: { contains: filename }` dengan kecocokan exact (`endsWith('/' + filename)` atau simpan kolom filename terpisah).
- [ ] (L5) Rename kategori: pertahankan `code` lama untuk `registrationGenerator` (simpan field `code` di Category, jangan derive dari slug) — atau dokumentasikan fallback 'XX'.
- [ ] (L6) Promosi chat-pending: pindahkan `promotePendingToAttachment` ke dalam transaksi kirim pesan; jika gagal → rollback pesan atau tandai attachment error.
- [ ] (L7) Hard-delete user: bersihkan `AdminCategoryAssignment.assignedBy` sebelum delete (atau tambah `onDelete: SetNull` — butuh migrasi kecil).
- [ ] (L9) `GET /categories/search`: hormati `includeDeleted` hanya untuk SUPERADMIN.
- [ ] (L10) `GET /reports/:id?includeDeleted=true`: cabut untuk jalur owner mahasiswa.
- [ ] (L11) Rate-limit `VIEW_ANONYMOUS`: pindahkan cache ke Redis (atau terima sebagai limitasi single-instance — dokumentasikan).
- [ ] (L3) Export CSV: escape semua field (`escapeCsv`), validasi `status`/`categoryId` sebelum menulis header, tambah audit log export.

### Task 5.2: Sapu jagat LOW frontend
- [ ] Hapus `console.log` (`userStore.js:74`, `reportStore.js:167`).
- [ ] `LoadingSpinner.jsx`: `role="status"` + `aria-live="polite"`; ganti `Math.random()` gradientId dengan ID statis.
- [ ] aria-label icon-only buttons (MoreVert chat, row menu, toggle sidebar).
- [ ] `ChatInterface.jsx:686` `onKeyPress` → `onKeyDown`; tooltip timestamp absolut; sembunyikan menu hapus untuk pesan orang lain; terjemahkan error rollback.
- [ ] Bundle pdf.js worker lokal (jangan CDN) — `ReportDetailPage.jsx:67`, `AdminReportDetailPage.jsx:22`.
- [ ] Landing page: ganti statistik & testimonial fiktif (`HomePage.jsx:90-139`) dengan data API atau hapus.
- [ ] `AppThemeProvider`: listener `matchMedia('(prefers-color-scheme: dark)')` untuk mode auto.
- [ ] Batasi hover `translateY` hanya CTA besar (`theme.jsx:79-82`).
- [ ] Fix prop `showFullButton` `RichTextDisplay` atau hapus pemakaiannya.
- [ ] `AuditLogPage` double-fetch; `SettingsPage` logout-all pakai API batch; tombol SSO di success screen register; `NotFoundPage` dalam Layout; guard `WaitingVerificationPage`.

### Task 5.3: Verifikasi akhir (quality gates repo)
- [x] `cd backend && npm test -- --runInBand` — hijau. **(215 test lulus)**
- [x] `cd backend && npm run test:integration` — hijau (butuh Docker). **(36 test lulus)**
- [x] `cd frontend && npm run lint -- --max-warnings=0` — hijau.
- [x] `cd frontend && npm run test:run` — hijau. **(25 test lulus)**
- [x] `cd frontend && npm run build` — sukses.
- [ ] `cd frontend && npm run test:e2e` — hijau. *(belum dijalankan di sesi ini — butuh Playwright browser; jalankan sebelum deploy)*
- [x] `docker compose config && docker compose -f docker-compose.prod.yml config` — valid; prod config tanpa `POSTGRES_PASSWORD`/`SEED_SUPERADMIN_PASSWORD` harus GAGAL (Task 0.2). **(diverifikasi gagal tanpa env)**

### Task 5.4: Penetration test ringan manual (checklist)
- [ ] Brute force: >20 login gagal dari 1 IP → 429; dengan header `X-Forwarded-For` acak → tetap 429 (bukti Task 1.4 bekerja).
- [ ] Mass assignment: `PUT /users/:id` dengan `{role:'SUPERADMIN'}` sebagai ADMIN → tidak berubah.
- [ ] Bulk: ADMIN kategori A mengubah laporan kategori B → skipped/ditolak.
- [ ] Anonimitas: sebagai pelapor anonim, buka chat; admin tidak melihat userId asli di WS frames, REST message, typing, read, export CSV, audit log.
- [ ] IDOR: mahasiswa A membuka laporan mahasiswa B → 404/403; admin tanpa assignment membuka laporan → 403.
- [ ] File: akses `/uploads/ktm/<file>` tanpa auth → 401; KTM user lain (sebagai mahasiswa) → 403; lampiran laporan terhapus → 403.
- [ ] Password reset: token dipakai 2x → yang kedua gagal; ganti password → semua sesi lain mati.
- [ ] Last superadmin: dua tab mencoba demote 2 superadmin bersamaan → tersisa minimal 1.

### Task 5.5: Dokumentasi
- [ ] Update `README.md` bagian Keamanan (tambahkan catatan: KTM wajib, bulk ops superadmin-only, read-receipt per-user jika Task 3.14 opsi A).
- [ ] Update `docs/ProductionRunbook.md`: trust proxy & XFF (Task 1.4 Step 3), variabel wajib compose (Task 0.2).
- [ ] Simpan laporan audit + plan ini sebagai baseline audit berikutnya.

---

## Definition of Done (keseluruhan)

1. Semua checklist di atas tercentang, atau item yang ditunda tercatat di bagian "Ditunda" dengan alasan + tanggal review.
2. Quality gate README lulus 100%.
3. Checklist Task 5.4 lulus tanpa pengecualian.
4. Tidak ada temuan CRITICAL/HIGH terbuka.

## Ditunda / Keputusan Produk

| Item | Alasan | Keputusan dibutuhkan |
|---|---|---|
| Task 3.14 read receipt per-user (M2) | Butuh migrasi schema | Pilih Opsi A/B |
| Task 3.18 field alasan reject/cancel di Report | Butuh migrasi kecil | Ya/tidak |
| Task 4.17 UI assign/priority | Fitur backend ada, UI tidak ada | Pasang UI atau hapus endpoint |
| SSO (4.6) | Backend belum ada (tombol sudah di-gate `VITE_ENABLE_SSO`) | Jadwalkan fitur terpisah |
| Task 5.4 pentest manual | Butuh eksekusi manual terhadap server jalan | Jadwalkan sebelum go-live |

### Phase 4 — sisa UX enhancement (belum dikerjakan, prioritas rendah–menengah)

Semua item di bawah tidak memblokir keamanan/fungsi inti; cocok sebagai backlog UX berikutnya:

- **4.7** Sidebar `ListItemButton` (keyboard/screen-reader navigation) — `StudentSidebar.jsx`, `AdminSidebar.jsx`.
- **4.8** Typing indicator + banner status koneksi socket + badge unread (`chatStore` subscribe `chat:typing`/`disconnected`, implementasi `getUnreadCount`).
- **4.9** Auto-scroll chat "stick to bottom only if near bottom" + tombol "↓ pesan baru".
- **4.10** Sentralisasi `STATUS_CONFIG` (label+warna satu sumber) + terjemahkan string English tersisa (`SystemSecurityPage`, status `ChatList`).
- **4.13** Empty state & `overflowX` untuk tabel admin (`AdminDataTable`, `UnverifiedUsersPage`, `CategoryManagementPage`, `AuditLogList`).
- **4.15** KTM upload: implementasi drag-drop sungguhan + preview gambar + luruskan teks batas ukuran.
- **4.16** Satu mekanisme single-flight refresh (interceptor vs store), gate render `AuthProvider` (hindari flash konten), wrapper `<RequireRole>` route SUPERADMIN, cleanup listener socket (`off()`).
- **4.17** Hapus bell notifikasi non-fungsional / pasang UI assign+priority; export CSV pakai endpoint server + toast.
- **4.18** Kontras teks warning (≥4.5:1), ganti warna hardcode `THEME_COLORS` dengan token theme agar dark mode bekerja.
- **Frontend LOW (5.2)**: hapus `console.log`, `role="status"` spinner, aria-label icon-only buttons, timestamp absolut tooltip, bundle pdf.js worker lokal, statistik landing page dari API, dsb.
