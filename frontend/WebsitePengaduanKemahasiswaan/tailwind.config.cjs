/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Beri tahu Tailwind file mana saja yang menggunakan class-nya
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  
  // 2. PENTING: Matikan Preflight agar tidak bentrok dengan CssBaseline MUI
  corePlugins: {
    preflight: false,
  },
  
  theme: {
    // 3. (Opsional tapi sangat direkomendasikan)
    //    Masukkan warna tema MUI Anda ke Tailwind
    extend: {
      colors: {
        primary: {
          main: '#2E7D32', // Warna dari theme.js
          light: '#4CAF50',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#FFC107', // Warna dari theme.js
          contrastText: '#000000',
        },
      },
    },
  },
  plugins: [],
};