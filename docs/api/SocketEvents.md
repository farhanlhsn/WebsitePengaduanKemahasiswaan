# Event Socket.IO — Chat Real-time

Chat memakai Socket.IO 4 di jalur `/socket.io/` pada host backend (di Docker dan produksi diteruskan oleh Nginx). REST tetap jadi sumber kebenaran: **kirim pesan, tandai dibaca, dan hapus pesan lewat REST** (lihat tag *Chat* di Swagger). Socket hanya dipakai untuk menerima pembaruan dan mengirim indikator mengetik.

Implementasi: `backend/src/sockets/` (server) dan `frontend/src/services/socketService.js` (klien).

## Koneksi dan autentikasi

```js
import { io } from 'socket.io-client';

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  auth: { token: accessToken },        // atau header Authorization: Bearer <token>
});

socket.on('connect_error', (err) => {
  // err.data.code: AUTH_REQUIRED | AUTH_INVALID | USER_DELETED | AUTH_REVOKED
});
```

Setelah terautentikasi, socket otomatis masuk ke ruang pribadi `user_<userId>`. Ruang ini dipakai untuk notifikasi daftar chat dan pencabutan akses.

Saat access token diperbarui, putuskan koneksi lalu sambungkan ulang dengan token baru. Token yang dicabut (logout semua perangkat, ganti password, diturunkan perannya) menghasilkan `AUTH_REVOKED`.

## Event dari klien ke server

| Event | Payload | Ack (callback) | Keterangan |
| --- | --- | --- | --- |
| `joinRoom` | `{ reportId: number }` | `{ ok: true, roomId: "report_1" }` atau `{ ok: false, code, message }` | Masuk ke ruang chat laporan. Hak akses diperiksa sama seperti REST. Satu socket hanya berada di satu ruang laporan; ruang sebelumnya otomatis ditinggalkan. |
| `leaveRoom` | `{ reportId: number }` | `{ ok: true }` atau `{ ok: false, code: "ROOM_NOT_JOINED" }` | Keluar dari ruang laporan. |
| `chat:typing` | `{ reportId: number, isTyping: boolean }` | — | Hanya setelah `joinRoom`. Batas 120 event per menit per socket. |

## Event dari server ke klien

| Event | Dikirim ke | Payload | Pemicu |
| --- | --- | --- | --- |
| `chat:message` | Ruang `report_<id>` | Objek pesan lengkap (sama dengan respons `POST .../messages`) + `reportId`, `timestamp` | Pesan baru terkirim lewat REST. Replay idempoten (`clientMessageId` sama) tidak memancarkan ulang. |
| `chat:read` | Ruang `report_<id>` | `{ reportId, readByUserId, timestamp }` | `PATCH .../messages/read` |
| `chat:message:deleted` | Ruang `report_<id>` | `{ messageId, reportId, deletedBy, timestamp }` | `DELETE /chat/messages/{id}` |
| `chat:typing` | Peserta lain di ruang | `{ userId, isTyping, timestamp }` | Klien lain mengirim `chat:typing` |
| `room:joined` | Peserta lain di ruang | `{ userId, timestamp }` | Seseorang `joinRoom` |
| `room:left` | Peserta lain di ruang | `{ userId, timestamp }` | `leaveRoom`, pindah ruang, atau terputus |
| `chat:list:update` | Ruang `user_<id>` setiap peserta yang berhak | `{ reportId, hasNew: true, timestamp }` | Ada pesan baru; klien memuat ulang daftar chat / jumlah belum dibaca |
| `access:revoked` | Ruang `user_<id>` admin terkait | `{ reason: "DEMOTED" \| "CATEGORY_REVOKED", categoryId }` | Admin diturunkan (socket langsung diputus) atau akses kategori dicabut |
| `chat:error` | Socket pengirim | `{ code, message, timestamp }` | Payload salah, akses ditolak, atau rate limit |

### Kode error

| Kode | Arti |
| --- | --- |
| `AUTH_REQUIRED` | Token tidak dikirim saat koneksi |
| `AUTH_INVALID` | Token tidak valid atau kedaluwarsa |
| `AUTH_REVOKED` | Token sudah dicabut (`tokenVersion` berubah); socket diputus |
| `USER_DELETED` | Akun dihapus; socket diputus |
| `ACCESS_DENIED` | Tidak berhak atas laporan tersebut |
| `ROOM_NOT_JOINED` | Event ruang dikirim sebelum `joinRoom` |
| `INVALID_PAYLOAD` | `reportId` / `isTyping` tidak valid |
| `RATE_LIMITED` | Terlalu banyak event `chat:typing` |

## Anonimitas

Untuk laporan anonim, semua identitas pelapor yang dipancarkan lewat socket (`userId` di `chat:typing`, `room:joined`, `room:left`, `readByUserId`, `deletedBy`) diganti dengan string `"reporter"`. Data pengirim di `chat:message` juga disamarkan. Jangan menampilkan atau menyimpan identitas pelapor anonim di klien.

## Alur yang disarankan di klien

1. Login lewat REST, lalu sambungkan socket dengan `accessToken`.
2. Dengarkan `chat:list:update` untuk memperbarui badge pesan belum dibaca (`GET /v1/api/chat/unread-count`).
3. Saat membuka percakapan: `GET /v1/api/chat/reports/{id}/messages` untuk riwayat, lalu `joinRoom`, lalu `PATCH .../messages/read`.
4. Kirim pesan dengan `POST .../messages` (sertakan `clientMessageId` unik); tampilkan pesan dari respons REST atau dari event `chat:message` (cocokkan dengan `clientMessageId` agar tidak dobel).
5. Saat menutup percakapan: `leaveRoom`.
