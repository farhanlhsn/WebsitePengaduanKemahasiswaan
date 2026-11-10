#!/usr/bin/env bash
# Tes regresi batas ukuran unggahan di frontend/nginx.conf.
#
# Aplikasi mengizinkan 10 berkas x 5 MB per permintaan (Multer di backend), jadi
# Nginx di kontainer frontend harus meneruskan permintaan sekitar 51 MB. Tanpa
# client_max_body_size, Nginx memakai batas bawaan 1 MB dan menolak dengan 413.
#
# Tes menjalankan nginx.conf asli di image nginx:alpine (sama dengan Dockerfile).
# Host "backend" diarahkan ke 127.0.0.1 tanpa layanan apa pun, sehingga:
#   - permintaan yang diterima Nginx berakhir 502 (Nginx sudah membaca badan
#     permintaan lalu gagal menghubungi backend);
#   - permintaan yang terlalu besar langsung ditolak 413.
#
# Pemakaian: npm run test:nginx   (dari folder frontend; butuh Docker)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF="$SCRIPT_DIR/../nginx.conf"
IMAGE="${NGINX_TEST_IMAGE:-nginx:alpine}"
PORT="${NGINX_TEST_PORT:-18085}"
NAME="nginx-upload-limit-test-$$"
MIB=$((1024 * 1024))

WORKDIR="$(mktemp -d)"
cleanup() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

docker run -d --rm --name "$NAME" \
  -p "127.0.0.1:$PORT:80" \
  --add-host backend:127.0.0.1 \
  -v "$CONF:/etc/nginx/conf.d/default.conf:ro" \
  "$IMAGE" >/dev/null

ready=0
for _ in $(seq 1 30); do
  if curl -s -o /dev/null "http://127.0.0.1:$PORT/"; then
    ready=1
    break
  fi
  sleep 0.5
done
if [ "$ready" -ne 1 ]; then
  echo "Nginx tidak siap. Log kontainer:" >&2
  docker logs "$NAME" >&2 || true
  exit 1
fi

# post <path> <ukuran MiB>: cetak kode status HTTP
post() {
  local file="$WORKDIR/body-$2.bin"
  [ -f "$file" ] || head -c $(($2 * MIB)) /dev/zero >"$file"
  curl -s -o /dev/null -w '%{http_code}' -X POST \
    -H 'Content-Type: application/octet-stream' \
    --data-binary "@$file" "http://127.0.0.1:$PORT$1" || true
}

failures=0
check() {
  local desc="$1" path="$2" size="$3" expect="$4" code
  code="$(post "$path" "$size")"
  if { [ "$expect" = "diterima" ] && [ "$code" != "413" ] && [ "$code" != "000" ]; } ||
    { [ "$expect" = "ditolak" ] && [ "$code" = "413" ]; }; then
    echo "OK    $desc ($size MiB ke $path): HTTP $code"
  else
    echo "GAGAL $desc ($size MiB ke $path): HTTP $code, seharusnya $expect" >&2
    failures=$((failures + 1))
  fi
}

check "Pendaftaran dengan KTM 5 MB" /v1/api/auth/registerStudent 6 diterima
check "Lampiran laporan 10 x 5 MB" /v1/api/reports/1/attachments 51 diterima
check "Unggahan chat 10 x 5 MB" /v1/api/chat/reports/1/upload 51 diterima
check "Permintaan di atas batas 55 MB" /v1/api/reports/1/attachments 56 ditolak

if [ "$failures" -gt 0 ]; then
  echo "$failures pemeriksaan gagal." >&2
  exit 1
fi
echo "Semua pemeriksaan batas unggah lulus."
