import React from 'react';
import { Box, Fade } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import HelpPage from '../HelpPage';
import AdminSectionHeader from './AdminSectionHeader';

const AdminHelpPage = () => {
  const { onMobileMenuClick } = useOutletContext() ?? {};
  return (
    <Fade in timeout={300}>
      <Box>
        <AdminSectionHeader
          title="Pusat Bantuan"
          subtitle="Panduan menangani laporan, verifikasi, dan pengelolaan sistem"
          onMobileMenuClick={onMobileMenuClick}
          showRefresh={false}
        />
        <HelpPage isEmbedded audience="admin" />
      </Box>
    </Fade>
  );
};

export default AdminHelpPage;
