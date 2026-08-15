import React from 'react';
import { Box, Container, Typography, Button, Alert, alpha } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

/**
 * Catches render errors in its subtree and shows a recovery UI.
 *
 * Props:
 *  - name?: string — label used in the fallback message ("memuat <name>")
 *  - fallback?: ({ error, reset }) => ReactNode — custom fallback renderer
 *  - variant?: 'default' | 'inline' — display style for the error fallback
 *  - children: ReactNode
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Hook for external error reporting
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback, name, variant } = this.props;
    if (typeof fallback === 'function') {
      return fallback({ error: this.state.error, reset: this.reset });
    }

    if (variant === 'inline') {
      return (
        <Box
          sx={(theme) => ({
            p: 2,
            border: '1px solid',
            borderColor: alpha(theme.palette.error.main, 0.2),
            borderRadius: 2,
            bgcolor: alpha(theme.palette.error.main, 0.05),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            my: 1,
          })}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ErrorOutline color="error" />
            <Box>
              <Typography variant="body2" color="error.main" fontWeight="600">
                Gagal memuat {name || 'komponen'}
              </Typography>
              {this.state.error?.message && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {this.state.error.message}
                </Typography>
              )}
            </Box>
          </Box>
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<Refresh />}
            onClick={this.reset}
            sx={{ py: 0.5, textTransform: 'none', borderRadius: 1.5 }}
          >
            Coba Lagi
          </Button>
        </Box>
      );
    }

    const target = name ? `memuat ${name}` : 'menampilkan halaman ini';

    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
        <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Terjadi kesalahan saat {target}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Anda bisa mencoba lagi atau kembali ke beranda. Bagian aplikasi
          lainnya tetap dapat diakses.
        </Typography>
        {this.state.error?.message && (
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            {this.state.error.message}
          </Alert>
        )}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<Refresh />} onClick={this.reset}>
            Coba Lagi
          </Button>
          <Button variant="outlined" onClick={this.handleReload}>
            Muat Ulang
          </Button>
          <Button variant="text" onClick={this.handleHome}>
            Ke Beranda
          </Button>
        </Box>
      </Container>
    );
  }
}

export default ErrorBoundary;
