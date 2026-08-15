import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, Button } from '@mui/material';
import { SentimentDissatisfied, Home } from '@mui/icons-material';

const NotFoundPage = () => {
  return (
    <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
      <SentimentDissatisfied sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        404
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Halaman tidak ditemukan
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </Typography>
      <Button component={Link} to="/" variant="contained" startIcon={<Home />} size="large">
        Kembali ke Beranda
      </Button>
    </Container>
  );
};

export default NotFoundPage;
