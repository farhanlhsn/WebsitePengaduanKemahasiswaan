import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32', // Hijau yang lebih gelap dan formal dari logo
      light: '#4CAF50', // Hijau cerah dari logo untuk aksen
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FFC107', // Kuning/Emas dari logo
      contrastText: '#000000',
    },
    background: {
      default: '#f5f5f5', // Abu-abu sangat muda agar tidak terlalu silau
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Sedikit membulat agar modern
          textTransform: 'none', // Agar teks tombol tidak kapital semua
          fontWeight: 'bold',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        }
      }
    }
  },
});

export default theme;