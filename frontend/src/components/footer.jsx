import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Link as MuiLink, 
  Grid, 
  Divider,
  IconButton,
  useTheme,
  alpha,
  Avatar
} from '@mui/material';
import { 
  Email, 
  Phone, 
  LocationOn, 
  Facebook, 
  Instagram, 
  Language,
  School,
  Support,
  Info,
  Twitter,
  LinkedIn
} from '@mui/icons-material';

// Add TikTok custom icon component since MUI doesn't have it
const TikTokIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

export default function Footer() {
  const theme = useTheme();

  return (
    <Box 
      component="footer" 
      sx={{ 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        pt: { xs: 3, md: 4 },
        pb: { xs: 2, md: 2 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M30 30c0-9.94-8.06-18-18-18s-18 8.06-18 18h18zm0-18c0 9.94 8.06 18 18 18s18-8.06 18-18H30zM12 30c0-9.94 8.06-18 18-18s18 8.06 18 18H12zm18 18c0-9.94-8.06-18-18-18s-18 8.06-18 18h18z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.3
        }
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 2, md: 3 } }}>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.25rem', md: '1.75rem' } }}
          >
            Layanan Pengaduan Mahasiswa
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ opacity: 0.9, maxWidth: 500, mx: 'auto', fontWeight: 400 }}
          >
            Universitas Bung Hatta
          </Typography>
        </Box>

        <Grid container spacing={2} justifyContent="center">
          {/* Informasi Kontak */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ 
              background: alpha(theme.palette.common.white, 0.08),
              borderRadius: 3,
              p: 2,
              height: '100%',
              border: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
              display: 'flex',
              flexDirection: 'column',
              textAlign: { xs: 'center', md: 'left' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, mb: 1.5 }}>
                <LocationOn sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Kontak
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: { xs: 'center', md: 'flex-start' }, mb: 1 }}>
                <LocationOn sx={{ mr: 1, fontSize: 16, mt: 0.2, opacity: 0.7 }} />
                <Typography variant="caption" sx={{ opacity: 0.9, lineHeight: 1.4 }}>
                  Jl. Bagindo Aziz Chan No. 8, Padang
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, mb: 1 }}>
                <Phone sx={{ mr: 1, fontSize: 16, opacity: 0.7 }} />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  (0751) 7051266
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Email sx={{ mr: 1, fontSize: 16, opacity: 0.7 }} />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  kemahasiswaan@bunghatta.ac.id
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Link Cepat */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ 
              background: alpha(theme.palette.common.white, 0.08),
              borderRadius: 3,
              p: 2,
              height: '100%',
              border: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
              display: 'flex',
              flexDirection: 'column',
              textAlign: { xs: 'center', md: 'left' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, mb: 1.5 }}>
                <School sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Link Cepat
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <MuiLink href="https://bunghatta.ac.id/" color="inherit" underline="none" target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', py: 0.5, px: 1, borderRadius: 1.5, fontSize: '0.8rem', transition: 'all 0.2s', '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.1) } }}>
                  <Language sx={{ mr: 1, fontSize: 14 }} />
                  Website UBH
                </MuiLink>
                <MuiLink href="#" color="inherit" underline="none" sx={{ display: 'flex', alignItems: 'center', py: 0.5, px: 1, borderRadius: 1.5, fontSize: '0.8rem', transition: 'all 0.2s', '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.1) } }}>
                  <Support sx={{ mr: 1, fontSize: 14 }} />
                  Panduan
                </MuiLink>
                <MuiLink href="#" color="inherit" underline="none" sx={{ display: 'flex', alignItems: 'center', py: 0.5, px: 1, borderRadius: 1.5, fontSize: '0.8rem', transition: 'all 0.2s', '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.1) } }}>
                  <Info sx={{ mr: 1, fontSize: 14 }} />
                  FAQ
                </MuiLink>
              </Box>
            </Box>
          </Grid>

          {/* Media Sosial */}
          <Grid size={{ xs: 12, sm: 12, md: 4 }}>
            <Box sx={{ 
              background: alpha(theme.palette.common.white, 0.08),
              borderRadius: 3,
              p: 2,
              height: '100%',
              border: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'center'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Ikuti Kami
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                <IconButton size="small" href="https://www.facebook.com/bunghatta.univ" target="_blank" sx={{ color: 'white', background: alpha(theme.palette.common.white, 0.1) }}><Facebook fontSize="small" /></IconButton>
                <IconButton size="small" href="https://www.instagram.com/universitasbunghatta/" target="_blank" sx={{ color: 'white', background: alpha(theme.palette.common.white, 0.1) }}><Instagram fontSize="small" /></IconButton>
                <IconButton size="small" href="https://twitter.com/beritabunghatta" target="_blank" sx={{ color: 'white', background: alpha(theme.palette.common.white, 0.1) }}><Twitter fontSize="small" /></IconButton>
                <IconButton size="small" href="https://www.tiktok.com/@universitasbunghatta" target="_blank" sx={{ color: 'white', background: alpha(theme.palette.common.white, 0.1) }}><TikTokIcon /></IconButton>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2, borderColor: alpha(theme.palette.common.white, 0.1) }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" display="block" sx={{ fontWeight: 500, opacity: 0.9 }}>
            © {new Date().getFullYear()} Muhammad Farhan Al Hasan
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}