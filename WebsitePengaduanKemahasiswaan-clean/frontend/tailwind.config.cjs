/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. Fix: Add proper content configuration for Tailwind
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{vue,svelte}',
    './public/**/*.html'
  ],
  
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
  
  // 4. Add safelist for dynamic classes that might be purged
  safelist: [
    'bg-primary-main',
    'text-primary-main',
    'border-primary-main',
    'bg-secondary-main',
    'text-secondary-main',
    'hover:bg-primary-main',
    'hover:text-white',
  ]
};