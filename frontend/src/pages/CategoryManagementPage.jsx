import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Menu,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Chip,
  Alert,
  Snackbar,
  Grid,
  Fade,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add,
  Edit,
  Delete,
  Restore,
  Refresh,
  Category as CategoryIcon,
  DeleteOutline,
  VisibilityOff,
  MoreVert,
} from '@mui/icons-material';
import {
  getCategories,
  getCategoryStats,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
} from '../services/api';
import { format } from 'date-fns';
import StatCard from '../components/ui/StatCard';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import getApiErrorMessage from '../utils/getApiErrorMessage';

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Rendah', color: 'default' },
  { value: 'MEDIUM', label: 'Sedang', color: 'info' },
  { value: 'HIGH', label: 'Tinggi', color: 'warning' },
  { value: 'URGENT', label: 'Mendesak', color: 'error' },
];

const PRIORITY_LABEL = Object.fromEntries(PRIORITY_OPTIONS.map((p) => [p.value, p.label]));
const PRIORITY_COLOR = Object.fromEntries(PRIORITY_OPTIONS.map((p) => [p.value, p.color]));

const EMPTY_FORM = { name: '', defaultPriority: 'MEDIUM', allowAnonymous: false };

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [actionCategory, setActionCategory] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fix M10: konfirmasi hapus kategori via dialog (bukan window.confirm).
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCategories(true);
      setCategories(data);
    } catch (error) {
      showSnackbar(`Gagal memuat kategori: ${getApiErrorMessage(error)}`, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await getCategoryStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadStats();
  }, [loadCategories, loadStats]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      if (statusFilter === 'ACTIVE') return !category.deletedAt;
      if (statusFilter === 'DELETED') return !!category.deletedAt;
      return true;
    });
  }, [categories, statusFilter]);

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleFormChange = (field) => (event) => {
    const value = field === 'allowAnonymous' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateOpen = () => {
    setForm(EMPTY_FORM);
    setCreateDialogOpen(true);
  };

  const handleEditOpen = (category) => {
    setSelectedCategory(category);
    setForm({
      name: category.name || '',
      defaultPriority: category.defaultPriority || 'MEDIUM',
      allowAnonymous: !!category.allowAnonymous,
    });
    setEditDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!form.name.trim()) {
      showSnackbar('Nama kategori wajib diisi', 'error');
      return;
    }

    try {
      await createCategory({
        name: form.name.trim(),
        defaultPriority: form.defaultPriority,
        allowAnonymous: !!form.allowAnonymous,
      });
      showSnackbar('Kategori berhasil dibuat', 'success');
      setCreateDialogOpen(false);
      loadCategories();
      loadStats();
    } catch (error) {
      showSnackbar(`Gagal membuat kategori: ${getApiErrorMessage(error)}`, 'error');
    }
  };

  const handleEditSubmit = async () => {
    if (!form.name.trim()) {
      showSnackbar('Nama kategori wajib diisi', 'error');
      return;
    }

    try {
      await updateCategory(selectedCategory.id, {
        name: form.name.trim(),
        defaultPriority: form.defaultPriority,
        allowAnonymous: !!form.allowAnonymous,
      });
      showSnackbar('Kategori berhasil diperbarui', 'success');
      setEditDialogOpen(false);
      loadCategories();
    } catch (error) {
      showSnackbar(`Gagal memperbarui kategori: ${getApiErrorMessage(error)}`, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCategory(deleteTarget.id);
      showSnackbar('Kategori berhasil dihapus', 'success');
      setDeleteTarget(null);
      loadCategories();
      loadStats();
    } catch (error) {
      showSnackbar(`Gagal menghapus kategori: ${getApiErrorMessage(error)}`, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRestore = async (categoryId) => {
    try {
      await restoreCategory(categoryId);
      showSnackbar('Kategori berhasil dipulihkan', 'success');
      loadCategories();
      loadStats();
    } catch (error) {
      showSnackbar(`Gagal memulihkan kategori: ${getApiErrorMessage(error)}`, 'error');
    }
  };

  const handleActionMenuOpen = (event, category) => {
    event.stopPropagation();
    setActionAnchorEl(event.currentTarget);
    setActionCategory(category);
  };

  const handleActionMenuClose = () => {
    setActionAnchorEl(null);
    setActionCategory(null);
  };

  const handleCategoryAction = (action) => {
    const category = actionCategory;
    handleActionMenuClose();
    if (!category) return;
    if (action === 'edit') handleEditOpen(category);
    // Fix M10: hapus lewat ConfirmDialog, bukan eksekusi langsung.
    if (action === 'delete') setDeleteTarget(category);
    if (action === 'restore') handleRestore(category.id);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Paginated categories
  const paginatedCategories = filteredCategories.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const renderCategoryFormFields = () => (
    <Stack spacing={2.5} sx={{ mt: 2 }}>
      <TextField
        autoFocus
        label="Nama Kategori"
        fullWidth
        value={form.name}
        onChange={handleFormChange('name')}
        placeholder="Contoh: Akademik, Fasilitas"
      />

      <FormControl fullWidth>
        <InputLabel id="category-priority-label">Prioritas Bawaan</InputLabel>
        <Select
          labelId="category-priority-label"
          label="Prioritas Bawaan"
          value={form.defaultPriority}
          onChange={handleFormChange('defaultPriority')}
        >
          {PRIORITY_OPTIONS.map((p) => (
            <MenuItem key={p.value} value={p.value}>
              {p.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
          bgcolor: (theme) => alpha(theme.palette.warning.main, 0.04),
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={!!form.allowAnonymous}
              onChange={handleFormChange('allowAnonymous')}
              color="warning"
            />
          }
          label={
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                Izinkan laporan anonim
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Mahasiswa dapat menyembunyikan identitas (nama, NIM, email) saat
                membuat laporan pada kategori ini. Admin tidak melihat identitas
                asli pelapor.
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', m: 0 }}
        />
      </Box>
    </Stack>
  );

  return (
    <Fade in timeout={300}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-start' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mb: 1 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Manajemen Kategori
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Kelola kategori laporan pengaduan
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadCategories}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Segarkan
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateOpen}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Tambah Kategori
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Stats */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Total Kategori"
                value={stats.total || 0}
                icon={<CategoryIcon />}
                color="#2196F3"
                subtitle="Semua Kategori"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Kategori Aktif"
                value={stats.active || 0}
                icon={<CategoryIcon />}
                color="#4CAF50"
                subtitle="Dapat Digunakan"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                title="Kategori Dihapus"
                value={stats.deleted || 0}
                icon={<DeleteOutline />}
                color="#F44336"
                subtitle="Dihapus sementara"
              />
            </Grid>
          </Grid>
        )}

        {/* Filter Status */}
        <Box sx={{ mb: 2 }}>
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel id="status-filter-label">Status Kategori</InputLabel>
            <Select
              labelId="status-filter-label"
              id="status-filter"
              value={statusFilter}
              label="Status Kategori"
              onChange={handleStatusFilterChange}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="ALL">Semua</MenuItem>
              <MenuItem value="ACTIVE">Aktif</MenuItem>
              <MenuItem value="DELETED">Dihapus</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Categories Table */}
        <Paper
          sx={{
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}
        >
          <Stack spacing={1.25} sx={{ display: { xs: 'flex', md: 'none' }, p: 1.5 }}>
            {loading ? (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>Memuat data...</Typography>
            ) : paginatedCategories.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>Tidak ada kategori</Typography>
            ) : paginatedCategories.map((category) => (
              <Paper key={category.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={750} sx={{ wordBreak: 'break-word' }}>{category.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{category.slug}</Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                      <Chip label={PRIORITY_LABEL[category.defaultPriority] || '-'} color={PRIORITY_COLOR[category.defaultPriority] || 'default'} size="small" />
                      <Chip label={category.deletedAt ? 'Dihapus' : 'Aktif'} color={category.deletedAt ? 'error' : 'success'} size="small" />
                      {category.allowAnonymous && <Chip label="Anonim diizinkan" color="warning" size="small" variant="outlined" />}
                    </Stack>
                  </Box>
                  <Tooltip title="Buka menu aksi">
                    <IconButton size="small" onClick={(event) => handleActionMenuOpen(event, category)} aria-label="Buka menu aksi kategori">
                      <MoreVert />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            ))}
          </Stack>

          <TableContainer sx={{ maxHeight: 600, overflowX: 'hidden', display: { xs: 'none', md: 'block' } }}>
            <Table stickyHeader size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ ...headerCellSx, width: 64, display: { md: 'none', lg: 'table-cell' } }}>ID</TableCell>
                  <TableCell sx={{ ...headerCellSx, width: '26%' }}>Nama</TableCell>
                  <TableCell sx={{ ...headerCellSx, width: '20%', display: { md: 'none', lg: 'table-cell' } }}>Slug</TableCell>
                  <TableCell sx={{ ...headerCellSx, width: '18%' }}>Prioritas Bawaan</TableCell>
                  <TableCell sx={{ ...headerCellSx, width: '14%', display: { md: 'none', lg: 'table-cell' } }}>Anonim</TableCell>
                  <TableCell sx={{ ...headerCellSx, width: '14%' }}>Status</TableCell>
                  <TableCell sx={{ ...headerCellSx, width: '14%', display: { md: 'none', lg: 'table-cell' } }}>Dibuat</TableCell>
                  <TableCell sx={{ ...headerCellSx, width: 58, textAlign: 'center' }}>Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary" fontWeight={600}>
                        Memuat data...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary" fontWeight={600}>
                        Tidak ada kategori
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCategories.map((category, index) => (
                    <Fade in timeout={200 + index * 50} key={category.id}>
                      <TableRow
                        hover
                        sx={{
                          '&:hover': {
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                          },
                        }}
                      >
                        <TableCell sx={{ display: { md: 'none', lg: 'table-cell' } }}>
                          <Typography variant="body2" fontWeight={600}>{category.id}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {category.name}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { md: 'none', lg: 'table-cell' }, overflowWrap: 'anywhere' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'monospace',
                              bgcolor: 'action.hover',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontWeight: 600,
                            }}
                          >
                            {category.slug}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={PRIORITY_LABEL[category.defaultPriority] || category.defaultPriority || '-'}
                            color={PRIORITY_COLOR[category.defaultPriority] || 'default'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell sx={{ display: { md: 'none', lg: 'table-cell' } }}>
                          {category.allowAnonymous ? (
                            <Chip
                              icon={<VisibilityOff sx={{ fontSize: 14 }} />}
                              label="Diizinkan"
                              size="small"
                              color="warning"
                              sx={{ fontWeight: 600 }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Tidak
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={category.deletedAt ? 'Dihapus' : 'Aktif'}
                            color={category.deletedAt ? 'error' : 'success'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell sx={{ display: { md: 'none', lg: 'table-cell' } }}>
                          <Typography variant="body2" fontWeight={600}>{format(new Date(category.createdAt), 'dd/MM/yyyy')}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Buka menu aksi">
                            <IconButton size="small" onClick={(event) => handleActionMenuOpen(event, category)} aria-label="Buka menu aksi kategori">
                              <MoreVert />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    </Fade>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Menu
            anchorEl={actionAnchorEl}
            open={Boolean(actionAnchorEl)}
            onClose={handleActionMenuClose}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          >
            {!actionCategory?.deletedAt ? [
              <MenuItem key="edit" onClick={() => handleCategoryAction('edit')}>
                <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                Ubah kategori
              </MenuItem>,
              <MenuItem key="delete" onClick={() => handleCategoryAction('delete')} sx={{ color: 'error.main' }}>
                <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
                Hapus kategori
              </MenuItem>,
            ] : (
              <MenuItem onClick={() => handleCategoryAction('restore')} sx={{ color: 'success.main' }}>
                <ListItemIcon><Restore fontSize="small" color="success" /></ListItemIcon>
                Pulihkan kategori
              </MenuItem>
            )}
          </Menu>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredCategories.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Baris per halaman:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
            }
            sx={{
              borderTop: '1px solid rgba(0,0,0,0.06)',
              bgcolor: (theme) => alpha(theme.palette.background.default, 0.3),
            }}
          />
        </Paper>

        {/* Create Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 4 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Tambah Kategori Baru</DialogTitle>
          <DialogContent>{renderCategoryFormFields()}</DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={() => setCreateDialogOpen(false)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Batal
            </Button>
            <Button
              onClick={handleCreateSubmit}
              variant="contained"
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Tambah
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 4 } }}
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Edit Kategori</DialogTitle>
          <DialogContent>{renderCategoryFormFields()}</DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button
              onClick={() => setEditDialogOpen(false)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Batal
            </Button>
            <Button
              onClick={handleEditSubmit}
              variant="contained"
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Fix M10: konfirmasi hapus kategori */}
        <ConfirmDialog
          open={!!deleteTarget}
          title="Hapus Kategori"
          message={`Hapus kategori "${deleteTarget?.name}"? Kategori dengan laporan aktif tidak dapat dihapus.`}
          severity="error"
          loading={deleteLoading}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </Box>
    </Fade>
  );
};

const headerCellSx = {
  fontWeight: 600,
  bgcolor: 'background.paper',
  py: 2,
};

export default CategoryManagementPage;
