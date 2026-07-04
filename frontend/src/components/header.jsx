import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Tooltip,
  Container,
  useTheme,
  alpha
} from '@mui/material';
import { Link } from 'react-router-dom';
import { Login, PersonAdd, Home, AccountCircle, HelpOutline, Dashboard } from '@mui/icons-material';
import useAuthStore from '../stores/authStore';
import UBHLogo from './ui/UBHLogo';

export default function Header() {
  const theme = useTheme();
  const { isLoggedIn, user } = useAuthStore();

  const getDashboardLink = () => {
    if (['ADMIN', 'SUPERADMIN'].includes(user?.role)) {
      return '/admin';
    }
    return '/dashboard';
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        background: `linear-gradient(145deg, 
          ${alpha(theme.palette.background.paper, 0.95)}, 
          ${alpha(theme.palette.background.paper, 0.98)})`,
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        color: 'text.primary',
        boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Link 
              to="/" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                textDecoration: 'none', 
                color: 'inherit' 
              }}
            >
              <UBHLogo
                size="medium"
                style={{
                  marginRight: 16,
                  filter: `drop-shadow(0 4px 12px ${alpha(theme.palette.primary.main, 0.3)})`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                className="hover:scale-105 hover:drop-shadow-lg"
                loading="eager"
              />
              <Box>
                <Typography 
                  variant="h6" 
                  component="div"
                  sx={{ 
                    fontWeight: 800,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: { xs: 'none', sm: 'block' },
                    fontSize: { sm: '1.1rem', md: '1.3rem' },
                    lineHeight: 1.2,
                    letterSpacing: '-0.01em'
                  }}
                >
                  Pengaduan Mahasiswa
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    display: { xs: 'none', md: 'block' },
                    fontWeight: 500
                  }}
                >
                  Universitas Bung Hatta
                </Typography>
              </Box>
            </Link>
          </Box>

          {/* Navigation Buttons for larger screens */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            <Button 
              component={Link} 
              to="/help" 
              color="primary" 
              variant="text"
              startIcon={<HelpOutline />}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              Bantuan
            </Button>

            {isLoggedIn ? (
              <Button 
                component={Link} 
                to={getDashboardLink()} 
                variant="contained" 
                color="primary"
                startIcon={<Dashboard />}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  fontWeight: 700,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Dasbor
              </Button>
            ) : (
              <>
                <Button 
                  component={Link} 
                  to="/login" 
                  color="primary" 
                  variant="outlined"
                  startIcon={<Login />}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      backgroundColor: 'primary.main',
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Masuk
                </Button>
                <Button
                  component={Link} 
                  to="/register" 
                  variant="contained" 
                  color="primary"
                  startIcon={<PersonAdd />}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    fontWeight: 700,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.5)}`,
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  Daftar
                </Button>
              </>
            )}
          </Box>

          {/* Icon Buttons for smaller screens */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
            <Tooltip title="Beranda" arrow>
              <IconButton 
                component={Link} 
                to="/" 
                color="primary"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <Home />
              </IconButton>
            </Tooltip>
            <Tooltip title="Bantuan" arrow>
              <IconButton 
                component={Link} 
                to="/help" 
                color="primary"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <HelpOutline />
              </IconButton>
            </Tooltip>
            {isLoggedIn ? (
              <Tooltip title="Dasbor" arrow>
                <IconButton 
                  component={Link} 
                  to={getDashboardLink()} 
                  sx={{ 
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    color: 'white',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': { 
                      transform: 'scale(1.05)',
                      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <Dashboard />
                </IconButton>
              </Tooltip>
            ) : (
              <>
                <Tooltip title="Masuk" arrow>
                  <IconButton 
                    component={Link} 
                    to="/login" 
                    color="primary"
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      border: `2px solid ${theme.palette.primary.main}`,
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Login />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Daftar" arrow>
                  <IconButton 
                    component={Link} 
                    to="/register" 
                    sx={{ 
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      color: 'white',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': { 
                        transform: 'scale(1.05)',
                        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <PersonAdd />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}