# Spesifikasi Desain: SSO Opsional & Audit Kode

## Tujuan
1. Menambahkan tombol Login SSO di frontend yang bersifat opsional (dikendalikan via environment variable) tanpa mengganggu alur login yang sudah ada.
2. Memperbaiki *technical debt* dan kode yang "jelek" hasil dari audit.

## Pendekatan
Kita menggunakan **Environment Variable Flag** (`VITE_ENABLE_SSO`) di sisi Frontend karena sistem SSO sebenarnya masih dikerjakan vendor. Ini memberikan kontrol yang fleksibel tanpa perlu mengubah arsitektur backend saat ini.

## Detail Implementasi

### 1. Fitur SSO (Opsional)
- **Environment:** Tambahkan `VITE_ENABLE_SSO=false` pada `frontend/.env` dan `frontend/.env.example`.
- **UI (LoginPage.jsx):** 
  - Render tombol "Login dengan SSO Kampus" di bawah tombol login reguler, hanya jika `import.meta.env.VITE_ENABLE_SSO === 'true'`.
  - Jika tombol SSO diklik, tampilkan *Snackbar / Alert* (sementara) yang memberitahu bahwa fitur sedang dalam pengembangan, atau arahkan ke sebuah *mock function* jika diperlukan nanti.
- **State (authStore.js):**
  - Buat kerangka fungsi `loginSSO()` kosong atau *mock* untuk mempermudah integrasi saat vendor sudah siap.

### 2. Hasil Audit & Refactoring
- **Frontend - Theme (`frontend/src/theme.jsx`):** 
  - Hapus duplikasi array `shadows` yang sangat panjang. Gunakan `createTheme` default bayangan Mui atau potong array yang *redundant* agar file lebih ringkas dan mudah dipelihara.
- **Backend - Auth Controller (`backend/src/controllers/authControllers.js`):**
  - Bersihkan logika blok *try-catch* yang kotor. 
  - Perbaiki konsistensi pengembalian error format (pastikan API membalas dengan struktur `{ status: 'error', message: '...' }`).
- **Frontend - Login State:**
  - Pastikan *error state* dibersihkan (*cleared*) dengan sempurna setiap masuk atau keluar komponen halaman Login untuk mencegah *stale error* muncul.

## Pertimbangan Lain
Karena vendor masih mengerjakan SSO, kita tidak mengubah skema database (`User`) sekarang (misalnya menambahkan `ssoProviderId`). Skema akan dibiarkan hingga vendor menentukan format datanya (apakah OAuth2 claim, SAML, dsb).
