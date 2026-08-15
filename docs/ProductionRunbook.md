# Production Runbook — Sistem Pengaduan Kemahasiswaan

Dokumen operasional untuk deploy, pemulihan, dan pemeliharaan lingkungan produksi.

## 1. Pre-deployment Checklist

- [ ] Semua migrasi Prisma diuji di staging (`npx prisma migrate deploy`)
- [ ] Secret JWT (`JWT_SECRET`, `JWT_REFRESH_SECRET`) ≥ 32 karakter, unik per lingkungan
- [ ] `NODE_ENV=production` pada backend
- [ ] `FRONTEND_URL` mengarah ke domain HTTPS frontend yang benar
- [ ] SMTP dikonfigurasi jika notifikasi email diperlukan
- [ ] `REDIS_URL` tersedia untuk rate limiting terdistribusi
- [ ] Backup database terbaru tersedia dan pernah diuji restore
- [ ] Health check `/api/health/ready` merespons 200
- [ ] Build frontend sukses dengan `VITE_API_URL` yang benar
- [ ] TLS/HTTPS aktif di reverse proxy
- [ ] Seed bootstrap SUPERADMIN hanya dijalankan sekali secara eksplisit (lihat §6)

## 2. TLS / HTTPS

### Reverse proxy (nginx contoh)

```nginx
server {
    listen 443 ssl http2;
    server_name pengaduan.example.ac.id;

    ssl_certificate     /etc/letsencrypt/live/pengaduan.example.ac.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pengaduan.example.ac.id/privkey.pem;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /v1/api/ {
        proxy_pass http://backend:6060;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /socket.io/ {
        proxy_pass http://backend:6060;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### Certbot (Let's Encrypt)

```bash
sudo certbot certonly --nginx -d pengaduan.example.ac.id
```

Pastikan cookie refresh token memakai `secure: true` (otomatis saat `NODE_ENV=production`).

## 3. Secrets Management

| Secret | Lokasi | Rotasi |
|--------|--------|--------|
| `JWT_SECRET` | `.env` / secret manager | `npm run rotate-secrets` di backend |
| `JWT_REFRESH_SECRET` | `.env` / secret manager | Bersamaan dengan JWT_SECRET |
| `DATABASE_URL` | `.env` / secret manager | Saat rotasi kredensial DB |
| `SMTP_PASS` | `.env` / secret manager | Sesuai kebijakan email |
| `SEED_SUPERADMIN_PASSWORD` | Hanya saat seed awal | Ganti segera setelah login pertama |

**Praktik:**
- Jangan commit `.env` ke git
- Gunakan secret manager (GitHub Secrets, Vault, Doppler) di CI/CD
- Rotasi JWT mem-bump `tokenVersion` — semua sesi lama otomatis invalid

## 4. Database Backup & Restore

### Backup harian

```bash
pg_dump -h <host> -U <user> -d pengaduan -F c -f "pengaduan-$(date +%Y%m%d).dump"
```

### Restore

```bash
pg_restore -h <host> -U <user> -d pengaduan --clean --if-exists pengaduan-YYYYMMDD.dump
```

### Verifikasi pasca-restore

1. `npx prisma migrate status` — pastikan schema sesuai
2. Hit `/api/health/ready`
3. Login SUPERADMIN smoke test
4. Cek jumlah record kritis (users, reports)

## 5. Monitoring Dasar

| Metrik | Threshold | Aksi |
|--------|-----------|------|
| `/api/health/live` | Non-200 > 1 menit | Restart container backend |
| `/api/health/ready` | DB atau Redis error | Cek koneksi Postgres dan Redis |
| Disk uploads | > 80% | Archiving / cleanup job |
| Error rate 5xx | > 1% | Cek log Winston di `backend/logs/` |
| Redis down | Readiness 503; rate limit fallback memory | Restore Redis segera; jangan deploy tanpa Redis di production |

**Log:** Winston daily rotate di backend. Pantau `error` dan `warn` level.

**Uptime:** Gunakan health check eksternal (UptimeRobot, Pingdom) ke `/api/health/live`.

## 6. Seed Bootstrap (Idempotent)

Seed hanya membuat SUPERADMIN jika belum ada:

```bash
cd backend
export DATABASE_URL="postgresql://..."
export SEED_SUPERADMIN_EMAIL="admin@kampus.ac.id"
export SEED_SUPERADMIN_PASSWORD="<strong-password>"
npx prisma migrate deploy
npm run seed
```

Perilaku `prisma/seed.js`:
- Jika sudah ada SUPERADMIN → **skip** (idempotent)
- Membuat kategori default dengan `skipDuplicates: true`
- **Tidak** mempromosikan ADMIN lama ke SUPERADMIN

Jalankan seed hanya saat first deploy atau recovery — bukan setiap restart container.

## 7. Rollback Procedure

1. **Hentikan traffic** — set maintenance mode di reverse proxy
2. **Rollback aplikasi:**
   ```bash
   docker compose pull   # tag versi sebelumnya
   docker compose up -d --no-build
   ```
3. **Rollback database** (jika migrasi bermasalah):
   - Restore dari backup pra-deploy
   - Atau jalankan migrasi down manual (hindari di produksi kecuali darurat)
4. **Verifikasi** health check + login smoke
5. **Buka traffic** kembali
6. **Post-mortem** — dokumentasikan root cause

## 8. Deploy Standar (Docker Compose)

### Development (semua service exposed)

```bash
git pull origin main
docker compose build
docker compose run --rm migrate
docker compose up -d
docker compose ps
curl -f http://localhost:6060/api/health/ready
```

### Production (`docker-compose.prod.yml`)

Hanya frontend/reverse proxy yang diekspos ke publik. Backend, PostgreSQL, dan Redis pada jaringan internal.

```bash
export POSTGRES_PASSWORD='<strong-password>'        # WAJIB (compose gagal tanpanya)
export SEED_SUPERADMIN_PASSWORD='<strong-password>' # WAJIB (compose gagal tanpanya)
export JWT_SECRET='<min-32-chars>'
export JWT_REFRESH_SECRET='<min-32-chars>'
export FRONTEND_URL='https://pengaduan.example.ac.id'
export REDIS_URL='redis://redis:6379'
export TRUST_PROXY='1'

git pull origin main
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm migrate
docker compose -f docker-compose.prod.yml up -d
curl -f https://pengaduan.example.ac.id/api/health/ready
```

**Readiness (`/api/health/ready`):** memverifikasi koneksi PostgreSQL **dan** Redis. Jika Redis down, readiness mengembalikan 503.

**Trust proxy & X-Forwarded-For (audit S1):** set `TRUST_PROXY` sesuai jumlah hop proxy di depan backend (mis. `1` jika hanya ada nginx compose). Rate limiter kunci-IP dan audit log memakai `req.ip` yang dihitung Express dari header `X-Forwarded-For` **hanya** sebanyak hop tepercaya. Pastikan LB/reverse proxy terluar **menimpa** (bukan append) header `X-Forwarded-For` dengan IP klien asli — jika LB append, klien bisa menyisipkan IP palsu di elemen pertama dan mem-bypass rate limit. Backend tidak lagi membaca elemen pertama header secara mentah.

## 9. Migrasi Token Hash (Juni 2026)

Migrasi `20260607130000_token_hash_migration`:
- Menyimpan refresh token sebagai SHA-256 hash (`tokenHash`), bukan plaintext
- **Semua sesi refresh existing di-invalidate** — pengguna harus login ulang setelah deploy
- Reset password token juga single-use via hash

**Pre-deploy communication:** informasikan user bahwa sesi aktif akan berakhir saat maintenance window.

## 10. Troubleshooting Cepat

| Gejala | Kemungkinan | Solusi |
|--------|-------------|--------|
| Login gagal semua user | JWT secret berubah | Pastikan env konsisten; user login ulang |
| Upload gagal | Permission `uploads/` | `chown` / volume mount |
| Chat tidak connect | Socket.IO proxy | Cek header Upgrade di nginx |
| Email tidak terkirim | SMTP kosong | Set `SMTP_*` env vars |
| 429 Too Many Requests | Rate limit | Cek Redis; pastikan `TRUST_PROXY` benar di belakang reverse proxy |

## 11. Kontak & Eskalasi

| Level | Kontak | Kapan |
|-------|--------|-------|
| L1 | Tim dev on-call | Error aplikasi, deploy |
| L2 | DBA / Infra | Database, TLS, jaringan |
| L3 | Security | Insiden keamanan, kebocoran data |

---

*Terakhir diperbarui: Juni 2026*
