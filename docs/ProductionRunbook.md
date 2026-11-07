# Production Runbook — Sistem Pengaduan Kemahasiswaan

*Diperbarui 7 November 2026*

Dokumen ini adalah **acuan utama** untuk deploy, pembaruan, backup, dan pemulihan di produksi. README dan `docs/SerahTerima.md` hanya meringkas dan merujuk ke sini. Bila ada perbedaan, ikuti dokumen ini dan perbaiki dokumen lainnya.

Semua perintah dijalankan dari folder root repositori di server.

## 1. Gambaran

```
Internet ──HTTPS──► Reverse proxy kampus (TLS) ──HTTP──► 127.0.0.1:8085 (PUBLIC_HTTP_PORT)
                                                         │
                     ┌───────────── jaringan internal Docker ─────────────┐
                     │ frontend (Nginx)                                    │
                     │   /                → berkas statis React            │
                     │   /v1/api, /api,   ┐                                │
                     │   /socket.io,      ├─► backend :6060 ─► db (PostgreSQL 16)
                     │   /uploads         ┘                 ─► redis (Redis 7)
                     │                                      ─► volume upload_data
                     └────────────────────────────────────────────────────┘
                                                  backend ──► server SMTP kampus
```

`docker-compose.prod.yml` menjalankan lima kontainer: `db`, `redis`, `migrate` (sekali jalan, `npx prisma migrate deploy`), `backend`, dan `frontend`. Hanya `frontend` yang membuka port ke host. Image dibangun langsung di server dari kode di repositori; tidak ada registry image.

## 2. Prasyarat

- Server Linux dengan minimal 2 vCPU, 4 GB RAM, dan disk 40 GB. Batas sumber daya di compose berjumlah sekitar 2,5 vCPU dan 1,3 GB RAM.
- Docker Engine dengan Docker Compose v2, serta Git.
- Domain dan reverse proxy HTTPS (Nginx, Caddy, atau load balancer kampus). **HTTPS wajib**: di produksi cookie refresh token bertanda `Secure`, sehingga lewat HTTP biasa pengguna akan keluar setiap kali memuat ulang halaman.
- Akun SMTP resmi kampus untuk email reset password dan notifikasi.

## 3. Konfigurasi

Ada dua berkas konfigurasi. Keduanya tidak masuk Git; buat dari contohnya, batasi aksesnya (`chmod 600`), dan simpan salinannya di brankas kata sandi kampus.

| Berkas | Dibaca oleh | Dibuat dari |
| --- | --- | --- |
| `.env` (root) | Docker Compose: password database, port, akun superadmin awal, tautan Pusat Bantuan | `.env.example` |
| `backend/.env` | Kontainer backend (`env_file`): rahasia JWT, SMTP, opsi aplikasi | `backend/.env.example` |

### 3.1 `.env` (root)

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `FRONTEND_URL` | Ya | Alamat HTTPS publik, mis. `https://pengaduan.bunghatta.ac.id`. Dipakai untuk CORS dan tautan di email; harus sama persis dengan alamat yang dibuka pengguna. Boleh beberapa, dipisah koma. |
| `POSTGRES_PASSWORD` | Ya | Compose menolak start bila kosong. Tetapkan sebelum `up` pertama: nilai ini hanya dipakai saat volume `pgdata` pertama kali dibuat (cara menggantinya di bagian 10). |
| `POSTGRES_USER`, `POSTGRES_DB` | Tidak | Default `postgres` dan `pengaduan`. Perintah backup di bawah memakai nilai default. |
| `PUBLIC_HTTP_PORT` | Tidak | Default `8085`. Bila reverse proxy berada di server yang sama, isi `127.0.0.1:8085` agar port ini tidak bisa diakses langsung dari luar. |
| `SEED_SUPERADMIN_EMAIL`, `SEED_SUPERADMIN_NAME` | Tidak | Akun superadmin pertama. |
| `SEED_SUPERADMIN_PASSWORD` | Ya | Compose menolak start bila kosong; seed menolak password di bawah 12 karakter. Ganti lewat aplikasi setelah login pertama, tetapi variabel ini tetap harus terisi. |
| `VITE_USER_MANUAL_URL`, `VITE_PRIVACY_POLICY_URL` | Tidak | Tautan "Panduan Pengguna" dan "Kebijakan Privasi" di Pusat Bantuan. Dibaca saat **build** image frontend; setelah mengubahnya, jalankan ulang `up -d --build`. Kosong berarti tautan disembunyikan. |

### 3.2 `backend/.env`

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Ya | Masing-masing minimal 32 karakter dan berbeda. Buat dengan `openssl rand -hex 64`. Backend menolak start di produksi bila terlalu pendek, dan `JWT_SECRET` juga ditolak bila mengandung kata seperti `secret` atau `change-me` (nilai di `.env.example` pasti ditolak). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Sangat disarankan | Tanpa SMTP, reset password dan semua notifikasi email tidak berfungsi. Port `465` memakai TLS langsung. |
| `ALLOWED_EMAIL_DOMAINS` | Tidak | Batasi domain email pendaftar, mis. `mahasiswa.bunghatta.ac.id,bunghatta.ac.id`. |
| `TZ` | Tidak | Zona waktu job pembersihan harian 03.00. Default `Asia/Jakarta`. |
| `LOG_LEVEL` | Tidak | Default `info`. |
| `ENABLE_SWAGGER` | Tidak | `true` mengaktifkan `/api/docs` di produksi. Aktifkan sementara saja karena memperlihatkan seluruh permukaan API. |

Variabel berikut **diatur oleh `docker-compose.prod.yml`** dan menimpa nilai di `backend/.env`, jadi tidak perlu diisi di sana: `NODE_ENV=production`, `DATABASE_URL`, `REDIS_URL`, `TRUST_PROXY=2`, `FRONTEND_URL`, dan `SEED_SUPERADMIN_*`.

### 3.3 `TRUST_PROXY`

Backend menghitung IP klien (untuk rate limit dan audit log) dari header `X-Forwarded-For`, dengan mempercayai sejumlah proxy terakhir. Compose produksi memakai `TRUST_PROXY: '2'`, artinya tepat dua proxy: reverse proxy HTTPS kampus dan Nginx di kontainer frontend.

- Bila jumlah proxy berbeda (mis. ada load balancer tambahan di depan reverse proxy), ubah nilai itu di `docker-compose.prod.yml`.
- Port `PUBLIC_HTTP_PORT` **tidak boleh** bisa diakses langsung dari internet. Bila bisa, klien dapat melewati proxy kampus, memalsukan IP lewat header, dan menghindari rate limit.

## 4. Reverse Proxy HTTPS

Nginx di kontainer frontend sudah meneruskan `/v1/api`, `/api`, `/socket.io`, dan `/uploads` ke backend. Reverse proxy kampus cukup meneruskan semua permintaan ke `PUBLIC_HTTP_PORT`, dengan dukungan WebSocket untuk chat. Contoh Nginx:

```nginx
# Di blok http { }
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    server_name pengaduan.example.ac.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pengaduan.example.ac.id;

    ssl_certificate     /etc/letsencrypt/live/pengaduan.example.ac.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pengaduan.example.ac.id/privkey.pem;

    # Unggahan: maksimal 10 berkas × 5 MB per permintaan
    client_max_body_size 55m;

    location / {
        proxy_pass http://127.0.0.1:8085;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;   # timpa, jangan teruskan header dari klien
        proxy_set_header X-Forwarded-Proto https;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:8085;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 86400;
    }
}
```

Sertifikat Let's Encrypt: `sudo certbot --nginx -d pengaduan.example.ac.id`.

Menutup akses langsung ke port aplikasi:

- **Proxy di server yang sama:** isi `PUBLIC_HTTP_PORT=127.0.0.1:8085` di `.env` root.
- **Proxy di server lain:** izinkan port tersebut hanya dari IP proxy. Port yang dipublikasikan Docker melewati aturan `ufw`, jadi pakai chain `DOCKER-USER` di iptables atau firewall jaringan/cloud.

> **Masalah yang diketahui:** Nginx di dalam kontainer frontend (`frontend/nginx.conf`) belum mengatur `client_max_body_size`, sehingga memakai batas bawaan Nginx 1 MB per permintaan. Unggahan yang lebih besar, misalnya PDF 3 MB atau beberapa foto sekaligus, ditolak dengan HTTP 413 walaupun proxy luar sudah 55 MB (sudah diuji). Lihat `docs/DeveloperGuide.md` bagian 8.

## 5. Deploy Pertama

```bash
git clone https://github.com/farhanlhsn/WebsitePengaduanKemahasiswaan.git
cd WebsitePengaduanKemahasiswaan

cp .env.example .env                    # isi sesuai bagian 3.1
cp backend/.env.example backend/.env    # isi sesuai bagian 3.2
chmod 600 .env backend/.env

docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps        # db, redis, backend, frontend "healthy"; migrate "exited (0)"

# Kategori bawaan + superadmin pertama. Cukup sekali; aman bila terulang.
docker compose -f docker-compose.prod.yml exec backend npm run seed

curl -f http://127.0.0.1:8085/api/health/ready
```

Kontainer `migrate` menjalankan migrasi database otomatis sebelum backend start, baik saat deploy pertama maupun setiap pembaruan. Seed hanya membuat superadmin bila belum ada superadmin, dan membuat kategori yang belum ada.

Setelah itu:

1. Pasang reverse proxy HTTPS (bagian 4), lalu buka `https://<domain>`.
2. Login sebagai superadmin dan segera ganti password lewat **Pengaturan → Keamanan Akun → Ubah Password Admin**.
3. Angkat superadmin kedua dan admin per unit (lihat `docs/UserManual.md` bagian 5.2).
4. Uji email lewat **Lupa Password**.
5. Pasang backup terjadwal (bagian 8) dan pemantauan uptime (bagian 9).
6. Catat commit yang di-deploy, mis. `git log -1 --oneline >> ~/riwayat-deploy.txt`.

## 6. Pembaruan Versi

1. Bila pembaruan membawa migrasi database, umumkan jadwal pemeliharaan.
2. Buat backup database dan lampiran (bagian 8.1).
3. Catat commit saat ini untuk rollback: `git rev-parse HEAD > ~/commit-sebelumnya.txt`.
4. Ambil kode dan periksa apakah ada migrasi baru:

   ```bash
   git pull origin main
   git diff --stat "$(cat ~/commit-sebelumnya.txt)" HEAD -- backend/prisma/migrations
   ```

5. Bangun dan jalankan ulang (migrasi berjalan otomatis):

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   curl -f http://127.0.0.1:8085/api/health/ready
   ```

6. Uji singkat: login superadmin, buka daftar laporan, kirim satu pesan chat uji.
7. Catat commit baru di riwayat deploy.

## 7. Rollback

Image dibangun dari kode, jadi rollback berarti kembali ke commit sebelumnya lalu membangun ulang.

**Tanpa migrasi baru** (langkah 4 di bagian 6 tidak menampilkan berkas):

```bash
git checkout "$(cat ~/commit-sebelumnya.txt)"
docker compose -f docker-compose.prod.yml up -d --build
```

**Dengan migrasi baru:** migrasi Prisma tidak dibatalkan otomatis, dan versi lama tidak boleh dijalankan di atas skema baru. Pulihkan database dari backup yang dibuat sebelum pembaruan:

```bash
docker compose -f docker-compose.prod.yml stop backend frontend
git checkout "$(cat ~/commit-sebelumnya.txt)"
# pulihkan database sesuai bagian 8.2
docker compose -f docker-compose.prod.yml up -d --build
```

Data yang masuk setelah backup akan hilang, jadi putuskan rollback secepatnya. Setelah masalah diperbaiki di `main`, kembali dengan `git checkout main` lalu ikuti bagian 6. Catat penyebab masalah sebagai bahan evaluasi.

## 8. Backup dan Restore

Database dan lampiran (termasuk foto KTM) berisi data pribadi dan laporan sensitif. Simpan backup terenkripsi dan salin ke luar server.

### 8.1 Backup

```bash
mkdir -p ~/backup
# Database. Opsi -T wajib agar berkas biner tidak rusak oleh TTY.
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U postgres -F c pengaduan > ~/backup/pengaduan-$(date +%Y%m%d).dump

# Lampiran dan KTM (volume <nama-proyek>_upload_data)
VOL=$(docker volume ls -q | grep '_upload_data$')
docker run --rm -v "$VOL":/data:ro -v ~/backup:/backup alpine \
  tar czf /backup/uploads-$(date +%Y%m%d).tgz -C /data .
```

Jalankan setiap hari, mis. lewat cron pukul 02.00, dan hapus backup lokal yang lebih tua dari 14 hari (`find ~/backup -mtime +14 -delete`) setelah salinannya aman di luar server. Periksa sesekali bahwa ukuran berkas backup masuk akal (tidak 0 byte).

### 8.2 Restore

```bash
docker compose -f docker-compose.prod.yml stop backend frontend

docker compose -f docker-compose.prod.yml exec -T db \
  pg_restore -U postgres -d pengaduan --clean --if-exists < ~/backup/pengaduan-YYYYMMDD.dump

VOL=$(docker volume ls -q | grep '_upload_data$')
docker run --rm -v "$VOL":/data -v ~/backup:/backup alpine \
  sh -c 'rm -rf /data/* && tar xzf /backup/uploads-YYYYMMDD.tgz -C /data'

docker compose -f docker-compose.prod.yml up -d
```

Verifikasi setelah restore:

1. `docker compose -f docker-compose.prod.yml run --rm migrate npx prisma migrate status`: skema sesuai kode.
2. `curl -f http://127.0.0.1:8085/api/health/ready`.
3. Login superadmin, buka beberapa laporan dan lampirannya.

Uji restore ke server uji minimal sekali per semester.

## 9. Pemantauan dan Log

| Yang dipantau | Batas | Tindakan |
| --- | --- | --- |
| `https://<domain>/api/health/live` | Tidak 200 lebih dari 1 menit | `docker compose -f docker-compose.prod.yml restart backend`, lalu periksa log |
| `/api/health/ready` | 503 | Database atau Redis tidak terjangkau; periksa kontainer `db` dan `redis` |
| Disk server dan volume `upload_data` | Di atas 80% | Tambah disk atau arsipkan lampiran lama |
| Error 5xx di log | Di atas 1% permintaan | Periksa log backend |

Pemantauan uptime eksternal (mis. UptimeRobot) cukup diarahkan ke `/api/health/live`.

Log aplikasi dibaca lewat Docker:

```bash
docker compose -f docker-compose.prod.yml logs -f --tail=200 backend
```

Backend juga menulis berkas log harian di `/app/logs` di dalam kontainer, tetapi folder itu bukan volume dan hilang setiap kontainer dibuat ulang. Andalkan log Docker, dan batasi ukurannya di `/etc/docker/daemon.json`:

```json
{ "log-driver": "json-file", "log-opts": { "max-size": "20m", "max-file": "5" } }
```

## 10. Rotasi Rahasia

Mengubah `backend/.env` atau `.env` baru berlaku setelah kontainer **dibuat ulang**; `docker compose restart` tidak membaca ulang berkas env.

| Rahasia | Cara mengganti | Dampak |
| --- | --- | --- |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Buat nilai baru (`openssl rand -hex 64`, atau `npm run rotate-secrets` di mesin yang punya Node.js), isi `backend/.env`, lalu `docker compose -f docker-compose.prod.yml up -d --force-recreate backend` | Semua pengguna keluar dan perlu login ulang |
| `SMTP_PASS` | Isi `backend/.env`, lalu buat ulang backend seperti di atas | — |
| `POSTGRES_PASSWORD` | Ubah dulu di database: `docker compose -f docker-compose.prod.yml exec db psql -U postgres -c "ALTER USER postgres PASSWORD '<baru>'"`, lalu ganti di `.env` root dan jalankan `docker compose -f docker-compose.prod.yml up -d` | Backend tersambung ulang |
| Password superadmin | Lewat aplikasi (Ubah Password) | `SEED_SUPERADMIN_PASSWORD` hanya dipakai seed pertama |

Rotasi rahasia JWT setidaknya setahun sekali, atau segera bila ada dugaan kebocoran.

## 11. Gangguan Umum

| Gejala | Penyebab umum | Solusi |
| --- | --- | --- |
| Compose gagal: `POSTGRES_PASSWORD wajib diisi` / `SEED_SUPERADMIN_PASSWORD wajib diisi` | `.env` root belum dibuat atau kosong | Isi sesuai bagian 3.1 |
| Compose gagal: `env file ... backend/.env not found` | `backend/.env` belum dibuat | `cp backend/.env.example backend/.env`, lalu isi |
| Backend berhenti dengan `FATAL: JWT_SECRET ...` | Rahasia JWT terlalu pendek atau masih nilai contoh | Buat dengan `openssl rand -hex 64` |
| Kontainer `migrate` gagal | Migrasi bermasalah atau database tidak siap | `docker compose -f docker-compose.prod.yml logs migrate` |
| Login gagal dengan error CORS | `FRONTEND_URL` tidak sama persis dengan alamat yang dibuka (skema, domain, port) | Samakan, lalu buat ulang backend |
| Pengguna keluar setiap memuat ulang halaman | Situs dibuka lewat HTTP, cookie `Secure` tidak tersimpan | Akses hanya lewat HTTPS |
| Semua pengguna harus login ulang | Rahasia JWT berubah | Perilaku normal setelah rotasi |
| Chat tidak tersambung atau terus terputus | Reverse proxy tidak meneruskan WebSocket | Pastikan blok `/socket.io/` di bagian 4 |
| Unggah berkas ditolak 413 | Batas ukuran permintaan di proxy | `client_max_body_size` di proxy luar; lihat juga catatan di bagian 4 |
| Banyak pengguna sekaligus mendapat 429 | Semua permintaan terbaca dari IP proxy | Sesuaikan `TRUST_PROXY` (bagian 3.3) |
| Email tidak terkirim | `SMTP_*` kosong atau salah | Perbaiki `backend/.env`, buat ulang backend, periksa log |
| Unggah berkas gagal dengan error izin | Volume `upload_data` tidak dapat ditulis user `node` | Periksa kepemilikan isi volume |

## 12. Catatan Migrasi Penting

- `20260607130000_token_hash_migration` (Juni 2026): refresh token disimpan sebagai hash. Saat menaikkan versi dari sebelum Juni 2026, semua sesi lama berakhir dan pengguna perlu login ulang.

## 13. Kontak dan Eskalasi

Diisi pihak kampus saat serah terima.

| Level | Peran | Nama / kontak | Kapan |
| --- | --- | --- | --- |
| L1 | Petugas TI aplikasi | *(diisi kampus)* | Aplikasi error, deploy, pembaruan |
| L2 | Infrastruktur / DBA | *(diisi kampus)* | Server, database, jaringan, TLS |
| L3 | Keamanan informasi | *(diisi kampus)* | Dugaan kebocoran data atau akun disalahgunakan |
