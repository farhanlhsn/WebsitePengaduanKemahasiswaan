# Catatan Perencanaan Internal (Arsip)

Folder ini berisi spesifikasi dan rencana kerja yang dipakai tim selama pengembangan, sebagian disusun bersama asisten AI. Isinya adalah **riwayat keputusan**, bukan dokumentasi kondisi sistem saat ini, dan tidak diperbarui setelah pekerjaannya selesai.

| Berkas | Isi | Status |
| --- | --- | --- |
| `specs/2026-08-08-sso-and-audit-design.md` | Desain tombol SSO opsional di frontend dan perbaikan hasil audit kode | Tombol SSO di frontend sudah ada (`VITE_ENABLE_SSO`), tetapi **backend SSO belum diimplementasikan**; biarkan `VITE_ENABLE_SSO=false` |
| `plans/2026-08-08-sso-and-audit-plan.md` | Rencana kerja untuk spesifikasi di atas | Tombol SSO opsional sudah ada di frontend. Kotak centang per langkah tidak diperbarui, jadi jangan dipakai sebagai daftar sisa pekerjaan |
| `plans/2026-08-15-audit-remediation-plan.md` | Rencana remediasi audit keamanan, alur bisnis, dan UI/UX 15 Agustus 2026 | Status per fase ada di bagian "Status Implementasi" berkas itu. Butir yang di sana ditunda (mis. read receipt per pengguna, alasan penolakan) diselesaikan di PR #7–#8 (lihat `CHANGELOG.md`) |

Untuk kondisi sistem saat ini, gunakan:

- [`docs/DeveloperGuide.md`](../DeveloperGuide.md): struktur kode dan bug yang diketahui
- [`docs/SerahTerima.md`](../SerahTerima.md): ringkasan sistem dan keterbatasan
- [`CHANGELOG.md`](../../CHANGELOG.md): apa yang sudah berubah
