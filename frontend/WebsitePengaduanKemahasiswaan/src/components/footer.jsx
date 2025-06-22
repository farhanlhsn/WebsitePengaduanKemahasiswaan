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
        background: `linear-gradient(135deg, 
          ${theme.palette.primary.main} 0%, 
          ${theme.palette.primary.dark} 50%,
          ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
        color: 'white',
        pt: { xs: 4, md: 6 },
        pb: { xs: 2, md: 3 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5
        }
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Simplified Header Section */}
        <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: '1.5rem', md: '2rem' }
            }}
          >
            Layanan Pengaduan Mahasiswa
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              opacity: 0.9,
              maxWidth: 500,
              mx: 'auto',
              fontWeight: 400,
              fontSize: { xs: '0.9rem', md: '1rem' }
            }}
          >
            Universitas Bung Hatta
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center" alignItems="stretch">
          {/* Informasi Kontak - More Compact */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              background: alpha(theme.palette.common.white, 0.08),
              borderRadius: 3,
              p: { xs: 2.5, md: 3 },
              height: '100%',
              border: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
              display: 'flex',
              flexDirection: 'column',
              textAlign: { xs: 'center', md: 'left' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, mb: 2 }}>
                <LocationOn sx={{ mr: 1.5, fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                  Kontak
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: { xs: 'center', md: 'flex-start' }, mb: 2 }}>
                <LocationOn sx={{ mr: 1.5, fontSize: 18, mt: 0.2, opacity: 0.7 }} />
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.5, fontSize: { xs: '0.85rem', md: '0.9rem' } }}>
                    Jl. Bagindo Aziz Chan No. 8<br />
                    Padang, Sumatera Barat
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, mb: 2 }}>
                <Phone sx={{ mr: 1.5, fontSize: 18, opacity: 0.7 }} />
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.85rem', md: '0.9rem' } }}>
                  (0751) 7051266
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Email sx={{ mr: 1.5, fontSize: 18, opacity: 0.7 }} />
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.85rem', md: '0.9rem' } }}>
                  kemahasiswaan@bunghatta.ac.id
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Link Cepat - More Compact */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              background: alpha(theme.palette.common.white, 0.08),
              borderRadius: 3,
              p: { xs: 2.5, md: 3 },
              height: '100%',
              border: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
              display: 'flex',
              flexDirection: 'column',
              textAlign: { xs: 'center', md: 'left' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, mb: 2 }}>
                <School sx={{ mr: 1.5, fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                  Link Cepat
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: { xs: 'center', md: 'stretch' } }}>
                <MuiLink 
                  href="https://bunghatta.ac.id/" 
                  color="inherit" 
                  underline="none"
                  target="_blank" 
                  rel="noopener"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'center', md: 'flex-start' },
                    py: 0.8,
                    px: 1.5,
                    borderRadius: 2,
                    fontSize: { xs: '0.85rem', md: '0.9rem' },
                    transition: 'all 0.2s ease',
                    maxWidth: { xs: 'fit-content', md: '100%' },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.common.white, 0.1),
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <Language sx={{ mr: 1.5, fontSize: 16 }} />
                  Website Utama UBH
                </MuiLink>
                
                <MuiLink 
                  href="#" 
                  color="inherit" 
                  underline="none"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'center', md: 'flex-start' },
                    py: 0.8,
                    px: 1.5,
                    borderRadius: 2,
                    fontSize: { xs: '0.85rem', md: '0.9rem' },
                    transition: 'all 0.2s ease',
                    maxWidth: { xs: 'fit-content', md: '100%' },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.common.white, 0.1),
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <Support sx={{ mr: 1.5, fontSize: 16 }} />
                  Panduan Penggunaan
                </MuiLink>
                
                <MuiLink 
                  href="#" 
                  color="inherit" 
                  underline="none"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: { xs: 'center', md: 'flex-start' },
                    py: 0.8,
                    px: 1.5,
                    borderRadius: 2,
                    fontSize: { xs: '0.85rem', md: '0.9rem' },
                    transition: 'all 0.2s ease',
                    maxWidth: { xs: 'fit-content', md: '100%' },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.common.white, 0.1),
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                  <Info sx={{ mr: 1.5, fontSize: 16 }} />
                  FAQ & Bantuan
                </MuiLink>
              </Box>
            </Box>
          </Grid>

          {/* Media Sosial - More Compact */}
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              background: alpha(theme.palette.common.white, 0.08),
              borderRadius: 3,
              p: { xs: 2.5, md: 3 },
              height: '100%',
              border: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'center'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Instagram sx={{ mr: 1, fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                  Ikuti Kami
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ 
                mb: 2.5, 
                opacity: 0.9, 
                lineHeight: 1.5,
                fontSize: { xs: '0.85rem', md: '0.9rem' }
              }}>
                Terhubung dengan komunitas UBH
              </Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 1.5, 
                justifyItems: 'center',
                mt: 'auto',
                maxWidth: '160px',
                mx: 'auto'
              }}>
                <IconButton 
                  href="https://www.facebook.com/bunghatta.univ" 
                  target="_blank"
                  sx={{ 
                    width: 44,
                    height: 44,
                    background: alpha(theme.palette.common.white, 0.15),
                    color: 'white',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                    '&:hover': { 
                      backgroundColor: '#1877F2',
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${alpha('#1877F2', 0.4)}`
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Facebook fontSize="small" />
                </IconButton>
                
                <IconButton 
                  href="https://www.instagram.com/universitasbunghatta/" 
                  target="_blank"
                  sx={{ 
                    width: 44,
                    height: 44,
                    background: alpha(theme.palette.common.white, 0.15),
                    color: 'white',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                    '&:hover': { 
                      background: 'linear-gradient(45deg, #E4405F, #C13584)',
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${alpha('#E4405F', 0.4)}`
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Instagram fontSize="small" />
                </IconButton>
                
                <IconButton 
                  href="https://twitter.com/beritabunghatta" 
                  target="_blank"
                  sx={{ 
                    width: 44,
                    height: 44,
                    background: alpha(theme.palette.common.white, 0.15),
                    color: 'white',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                    '&:hover': { 
                      backgroundColor: '#1DA1F2',
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${alpha('#1DA1F2', 0.4)}`
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Twitter fontSize="small" />
                </IconButton>
                
                <IconButton 
                  href="https://www.linkedin.com/school/universitasbunghatta/" 
                  target="_blank"
                  sx={{ 
                    width: 44,
                    height: 44,
                    background: alpha(theme.palette.common.white, 0.15),
                    color: 'white',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                    '&:hover': { 
                      backgroundColor: '#0077B5',
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${alpha('#0077B5', 0.4)}`
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <LinkedIn fontSize="small" />
                </IconButton>
                
                <IconButton 
                  href="https://www.tiktok.com/@universitasbunghatta" 
                  target="_blank"
                  sx={{ 
                    width: 44,
                    height: 44,
                    background: alpha(theme.palette.common.white, 0.15),
                    color: 'white',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                    '&:hover': { 
                      backgroundColor: '#000000',
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${alpha('#000000', 0.4)}`
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <TikTokIcon />
                </IconButton>
                
                <IconButton 
                  href="https://bunghatta.ac.id/" 
                  target="_blank"
                  sx={{ 
                    width: 44,
                    height: 44,
                    background: alpha(theme.palette.common.white, 0.15),
                    color: 'white',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                    '&:hover': { 
                      backgroundColor: theme.palette.secondary.main,
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.4)}`
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Language fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ 
          my: { xs: 3, md: 4 }, 
          borderColor: alpha(theme.palette.common.white, 0.2)
        }} />
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body1" sx={{ 
            mb: 1, 
            fontWeight: 500,
            fontSize: { xs: '0.9rem', md: '1rem' }
          }}>
            © {new Date().getFullYear()} Divisi Kemahasiswaan Universitas Bung Hatta
          </Typography>
          <Typography variant="body2" sx={{ 
            opacity: 0.8, 
            maxWidth: 500, 
            mx: 'auto',
            fontSize: { xs: '0.8rem', md: '0.9rem' }
          }}>
            Dikembangkan untuk melayani aspirasi mahasiswa dengan lebih baik
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}