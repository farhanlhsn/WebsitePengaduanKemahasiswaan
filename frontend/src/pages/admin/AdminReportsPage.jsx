import React, { useEffect, useCallback, useMemo } from 'react';
import { Box, Fade, Alert } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { useNavigate, useOutletContext } from 'react-router-dom';
import useReportStore from '../../stores/reportStore';
import AdminDataTable from '../../components/admin/AdminDataTable';
import AdminSectionHeader from './AdminSectionHeader';

const AdminReportsPage = () => {
  const navigate = useNavigate();
  const { onMobileMenuClick } = useOutletContext() ?? {};
  const { reports, loading, error, getAllReports } = useReportStore();

  useEffect(() => {
    getAllReports({}, false).catch((e) => console.error(e));
  }, [getAllReports]);

  const tableData = useMemo(
    () =>
      reports.map((r) => ({
        ...r,
        category: r.category?.name,
        user: r.user?.name,
        isAnonymous: !!r.isAnonymous,
      })),
    [reports]
  );

  const columns = useMemo(
    () => [
      { field: 'title', headerName: 'Judul', sortable: true },
      { field: 'status', headerName: 'Status', type: 'status', sortable: true },
      { field: 'category', headerName: 'Kategori', sortable: true },
      { field: 'user', headerName: 'Pelapor', type: 'reporter', sortable: true },
      { field: 'createdAt', headerName: 'Tanggal', type: 'date', sortable: true },
    ],
    []
  );

  const actions = useMemo(
    () => [{ id: 'detail', label: 'Lihat Detail', icon: <Visibility /> }],
    []
  );

  const onRowAction = useCallback(
    (action, row) => {
      if (action === 'detail') navigate(`/admin/reports/${row.id}`);
    },
    [navigate]
  );

  return (
    <Fade in timeout={300}>
      <Box>
        <AdminSectionHeader
          title="Manajemen Laporan"
          subtitle="Kelola dan tindak lanjuti semua laporan pengaduan"
          onMobileMenuClick={onMobileMenuClick}
          onRefresh={() => getAllReports({}, false)}
        />
        <AdminDataTable
          data={tableData}
          columns={columns}
          loading={loading}
          onRowAction={onRowAction}
          actions={actions}
          title="Daftar Laporan"
        />
        {error && <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{error}</Alert>}
      </Box>
    </Fade>
  );
};

export default AdminReportsPage;
