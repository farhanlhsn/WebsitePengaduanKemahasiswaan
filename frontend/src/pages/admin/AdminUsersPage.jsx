import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Box, Fade, Alert, Snackbar } from '@mui/material';
import { Visibility, Edit, CheckCircle, Delete, Restore } from '@mui/icons-material';
import { useOutletContext } from 'react-router-dom';
import useUserStore from '../../stores/userStore';
import useAuthStore from '../../stores/authStore';
import { promoteToAdmin } from '../../services/adminGovernanceApi';
import AdminDataTable from '../../components/admin/AdminDataTable';
import UserDetailModal from '../../components/admin/UserDetailModal';
import UserStatistics from '../../components/admin/UserStatistics';
import AdminSectionHeader from './AdminSectionHeader';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { exportUsersToExcel } from '../../utils/exportUtils';

const AdminUsersPage = () => {
  const { onMobileMenuClick } = useOutletContext() ?? {};
  const { users, loading, error, getAllUsers, verifyStudent, deleteUser, restoreUser } = useUserStore();
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Fix H4: konfirmasi untuk aksi destruktif (hapus/restore single & bulk).
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', action: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const closeConfirm = () => setConfirm({ open: false, title: '', message: '', action: null });
  const notify = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

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
      { id: 'edit', label: 'Edit Pengguna', icon: <Edit />, show: (row) => !row.deletedAt },
      { id: 'verify', label: 'Verifikasi', icon: <CheckCircle />, show: (row) => !row.deletedAt && !row.isVerified },
      { id: 'delete', label: 'Hapus', icon: <Delete />, show: (row) => !row.deletedAt },
      { id: 'restore', label: 'Restore', icon: <Restore />, show: (row) => !!row.deletedAt },
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
      // Fix H4: aksi hapus/restore butuh konfirmasi sebelum dieksekusi.
      if (action === 'delete') {
        setConfirm({
          open: true,
          title: 'Hapus Pengguna',
          message: `Hapus "${user.name}" (${user.email})? Pengguna dinonaktifkan (soft delete) dan dapat di-restore nanti.`,
          action: async () => {
            setActionLoading(true);
            try {
              await deleteUser(user.id);
              await getAllUsers(true);
              notify(`Pengguna "${user.name}" dihapus`);
              closeConfirm();
            } catch (e) {
              notify(e?.response?.data?.message || 'Gagal menghapus pengguna', 'error');
            } finally {
              setActionLoading(false);
            }
          },
        });
        return;
      }
      if (action === 'restore') {
        setConfirm({
          open: true,
          title: 'Restore Pengguna',
          message: `Pulihkan akun "${user.name}" (${user.email})?`,
          action: async () => {
            setActionLoading(true);
            try {
              await restoreUser(user.id);
              await getAllUsers(true);
              notify(`Pengguna "${user.name}" dipulihkan`);
              closeConfirm();
            } catch (e) {
              notify(e?.response?.data?.message || 'Gagal memulihkan pengguna', 'error');
            } finally {
              setActionLoading(false);
            }
          },
        });
        return;
      }

      try {
        switch (action) {
          case 'verify':
            await verifyStudent(user.id);
            notify(`Pengguna "${user.name}" diverifikasi`);
            break;
          case 'view':    setSelectedUser(user); setDetailOpen(true); break;
          case 'promote-admin':
            await promoteToAdmin(user.id);
            await getAllUsers(true);
            break;
          default: console.log('Unknown user action', action);
        }
      } catch (e) {
        console.error(e);
        notify(e?.response?.data?.message || 'Aksi gagal', 'error');
      }
    },
    [verifyStudent, deleteUser, restoreUser, getAllUsers]
  );

  const onBulkAction = useCallback(
    async (action, userIds) => {
      // Fix H4: operasi bulk selalu butuh konfirmasi + feedback hasil.
      const labels = { verify: 'Verifikasi', delete: 'Hapus', restore: 'Restore' };
      const label = labels[action] || action;
      setConfirm({
        open: true,
        title: `${label} ${userIds.length} Pengguna`,
        message: `Anda akan ${label.toLowerCase()} ${userIds.length} pengguna terpilih. Lanjutkan?`,
        action: async () => {
          setActionLoading(true);
          const results = await Promise.allSettled(
            userIds.map((id) => {
              if (action === 'verify') return verifyStudent(id);
              if (action === 'delete') return deleteUser(id);
              if (action === 'restore') return restoreUser(id);
              return Promise.resolve();
            })
          );
          const ok = results.filter((r) => r.status === 'fulfilled').length;
          const fail = results.length - ok;
          setActionLoading(false);
          closeConfirm();
          await getAllUsers(true);
          notify(
            fail === 0
              ? `${ok} pengguna berhasil di-${label.toLowerCase()}`
              : `${ok} berhasil, ${fail} gagal`,
            fail === 0 ? 'success' : 'warning'
          );
        },
      });
    },
    [verifyStudent, deleteUser, restoreUser, getAllUsers]
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
          isSuperAdmin={isSuperAdmin}
        />

        {/* Fix H4: konfirmasi aksi destruktif */}
        <ConfirmDialog
          open={confirm.open}
          title={confirm.title}
          message={confirm.message}
          severity="error"
          loading={actionLoading}
          onConfirm={confirm.action}
          onCancel={closeConfirm}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default AdminUsersPage;
