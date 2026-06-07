import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Fade, Alert } from '@mui/material';
import { Visibility, Edit, CheckCircle, Delete, Restore } from '@mui/icons-material';
import { useOutletContext } from 'react-router-dom';
import useUserStore from '../../stores/userStore';
import AdminDataTable from '../../components/admin/AdminDataTable';
import UserDetailModal from '../../components/admin/UserDetailModal';
import UserStatistics from '../../components/admin/UserStatistics';
import AdminSectionHeader from './AdminSectionHeader';
import { exportUsersToExcel } from '../../utils/exportUtils';

const AdminUsersPage = () => {
  const { onMobileMenuClick } = useOutletContext() ?? {};
  const { users, loading, error, getAllUsers, verifyStudent, deleteUser, restoreUser } = useUserStore();

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    getAllUsers(true).catch((e) => console.error(e));
  }, [getAllUsers]);

  const processedUsers = useMemo(
    () =>
      users.map((u) => ({
        ...u,
        status: u.deletedAt ? 'DELETED' : u.isVerified ? 'ACTIVE' : 'PENDING',
      })),
    [users]
  );

  const columns = useMemo(
    () => [
      { field: 'name', headerName: 'Nama', sortable: true },
      { field: 'nim', headerName: 'NIM', sortable: true },
      { field: 'email', headerName: 'Email', sortable: true, maxLength: 30 },
      { field: 'status', headerName: 'Status', type: 'status', sortable: true },
      { field: 'isVerified', headerName: 'Terverifikasi', type: 'boolean', sortable: true },
      { field: 'role', headerName: 'Role', type: 'chip', chipColor: 'primary', sortable: true },
      { field: 'createdAt', headerName: 'Tanggal Daftar', type: 'date', sortable: true },
    ],
    []
  );

  const actions = useMemo(
    () => [
      { id: 'view', label: 'Lihat Detail', icon: <Visibility /> },
      { id: 'edit', label: 'Edit Pengguna', icon: <Edit /> },
      { id: 'verify', label: 'Verifikasi', icon: <CheckCircle /> },
      { id: 'delete', label: 'Hapus', icon: <Delete /> },
      { id: 'restore', label: 'Restore', icon: <Restore /> },
    ],
    []
  );

  const filters = useMemo(
    () => [
      { field: 'status', label: 'Status', options: [
        { value: 'ACTIVE', label: 'Aktif' },
        { value: 'INACTIVE', label: 'Tidak Aktif' },
        { value: 'DELETED', label: 'Dihapus' },
      ]},
      { field: 'isVerified', label: 'Verifikasi', options: [
        { value: 'true', label: 'Terverifikasi' },
        { value: 'false', label: 'Belum Terverifikasi' },
      ]},
      { field: 'role', label: 'Role', options: [
        { value: 'MAHASISWA', label: 'Mahasiswa' },
        { value: 'ADMIN', label: 'Admin' },
        { value: 'SUPERADMIN', label: 'Super Admin' },
      ]},
    ],
    []
  );

  const onRowAction = useCallback(
    async (action, user) => {
      try {
        switch (action) {
          case 'verify':  await verifyStudent(user.id); break;
          case 'delete':  await deleteUser(user.id); break;
          case 'restore': await restoreUser(user.id); break;
          case 'view':    setSelectedUser(user); setDetailOpen(true); break;
          default: console.log('Unknown user action', action);
        }
      } catch (e) { console.error(e); }
    },
    [verifyStudent, deleteUser, restoreUser]
  );

  const onBulkAction = useCallback(
    async (action, userIds) => {
      try {
        await Promise.all(userIds.map((id) => {
          if (action === 'verify') return verifyStudent(id);
          if (action === 'delete') return deleteUser(id);
          if (action === 'restore') return restoreUser(id);
          return Promise.resolve();
        }));
      } catch (e) { console.error(e); }
    },
    [verifyStudent, deleteUser, restoreUser]
  );

  return (
    <Fade in timeout={300}>
      <Box>
        <AdminSectionHeader
          title="Manajemen Pengguna"
          subtitle="Kelola pengguna dan verifikasi"
          onMobileMenuClick={onMobileMenuClick}
          onRefresh={() => getAllUsers(true)}
        />
        <UserStatistics users={users} loading={loading} />
        <AdminDataTable
          data={processedUsers}
          columns={columns}
          loading={loading}
          onRowAction={onRowAction}
          onBulkAction={onBulkAction}
          actions={actions}
          filters={filters}
          title="Daftar Pengguna"
          searchPlaceholder="Cari nama, NIM, atau email..."
          selectable
          exportable
          refreshable
          onRefresh={() => getAllUsers(true)}
          onExport={() => exportUsersToExcel(users)}
        />
        {error && <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>{error}</Alert>}
        <UserDetailModal
          open={detailOpen}
          onClose={() => { setDetailOpen(false); setSelectedUser(null); }}
          user={selectedUser}
          onAction={onRowAction}
        />
      </Box>
    </Fade>
  );
};

export default AdminUsersPage;
