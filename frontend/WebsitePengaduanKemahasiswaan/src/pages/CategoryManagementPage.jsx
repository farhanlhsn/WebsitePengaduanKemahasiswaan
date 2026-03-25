import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
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
  TablePagination
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Add,
  Edit,
  Delete,
  Restore,
  Refresh,
  Category as CategoryIcon,
  DeleteOutline
} from '@mui/icons-material';
import {
  getCategories,
  getCategoryStats,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory
} from '../services/api';
import { format } from 'date-fns';
import StatCard from '../components/ui/StatCard';

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadCategories();
    loadStats();
  }, [includeDeleted]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories(includeDeleted);
      setCategories(data);
    } catch (error) {
      showSnackbar('Failed to load categories: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getCategoryStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleCreateOpen = () => {
    setCategoryName('');
    setCreateDialogOpen(true);
  };

  const handleEditOpen = (category) => {
    setSelectedCategory(category);
    setCategoryName(category.name);
    setEditDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!categoryName.trim()) {
      showSnackbar('Category name is required', 'error');
      return;
    }

    try {
      await createCategory({ name: categoryName.trim() });
      showSnackbar('Category created successfully', 'success');
      setCreateDialogOpen(false);
      loadCategories();
      loadStats();
    } catch (error) {
      showSnackbar('Failed to create category: ' + error.message, 'error');
    }
  };

  const handleEditSubmit = async () => {
    if (!categoryName.trim()) {
      showSnackbar('Category name is required', 'error');
      return;
    }

    try {
      await updateCategory(selectedCategory.id, { name: categoryName.trim() });
      showSnackbar('Category updated successfully', 'success');
      setEditDialogOpen(false);
      loadCategories();
    } catch (error) {
      showSnackbar('Failed to update category: ' + error.message, 'error');
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await deleteCategory(categoryId);
      showSnackbar('Category deleted successfully', 'success');
      loadCategories();
      loadStats();
    } catch (error) {
      showSnackbar('Failed to delete category: ' + error.message, 'error');
    }
  };

  const handleRestore = async (categoryId) => {
    try {
      await restoreCategory(categoryId);
      showSnackbar('Category restored successfully', 'success');
      loadCategories();
      loadStats();
    } catch (error) {
      showSnackbar('Failed to restore category: ' + error.message, 'error');
    }
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
  const paginatedCategories = categories.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                Manajemen Kategori
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Kelola kategori laporan pengaduan
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadCategories}
                sx={{ borderRadius: 2, fontWeight: 600 }}
              >
                Refresh
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
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Total Kategori"
                value={stats.total || 0}
                icon={<CategoryIcon />}
                color="#2196F3"
                subtitle="Semua Kategori"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Kategori Aktif"
                value={stats.active || 0}
                icon={<CategoryIcon />}
                color="#4CAF50"
                subtitle="Dapat Digunakan"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Kategori Dihapus"
                value={stats.deleted || 0}
                icon={<DeleteOutline />}
                color="#F44336"
                subtitle="Soft Deleted"
              />
            </Grid>
          </Grid>
        )}

        {/* Toggle Show Deleted */}
        <Box sx={{ mb: 3 }}>
          <Button
            onClick={() => setIncludeDeleted(!includeDeleted)}
            variant={includeDeleted ? 'contained' : 'outlined'}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {includeDeleted ? 'Sembunyikan' : 'Tampilkan'} yang Dihapus
          </Button>
        </Box>

        {/* Categories Table */}
        <Paper sx={{ 
          borderRadius: 4, 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
          border: '1px solid rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    bgcolor: (theme) => `${theme.palette.primary.main}0a`,
                    py: 2 
                  }}>
                    ID
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    bgcolor: (theme) => `${theme.palette.primary.main}0a`,
                    py: 2 
                  }}>
                    Nama
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    bgcolor: (theme) => `${theme.palette.primary.main}0a`,
                    py: 2 
                  }}>
                    Slug
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    bgcolor: (theme) => `${theme.palette.primary.main}0a`,
                    py: 2 
                  }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    bgcolor: (theme) => `${theme.palette.primary.main}0a`,
                    py: 2 
                  }}>
                    Dibuat
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 600, 
                    bgcolor: (theme) => `${theme.palette.primary.main}0a`,
                    py: 2,
                    textAlign: 'center'
                  }}>
                    Aksi
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary" fontWeight={600}>Memuat data...</Typography>
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary" fontWeight={600}>Tidak ada kategori</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCategories.map((category, index) => (
                    <Fade in timeout={200 + index * 50} key={category.id}>
                      <TableRow 
                        hover
                        sx={{ 
                          '&:hover': { 
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02) 
                          }
                        }}
                      >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {category.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {category.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontFamily: 'monospace', 
                            bgcolor: 'grey.100', 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1,
                            fontWeight: 600
                          }}
                        >
                          {category.slug}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={category.deletedAt ? 'Dihapus' : 'Aktif'}
                          color={category.deletedAt ? 'error' : 'success'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {format(new Date(category.createdAt), 'dd/MM/yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {!category.deletedAt ? (
                            <>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditOpen(category)}
                                  color="primary"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Hapus">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(category.id)}
                                  color="error"
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <Tooltip title="Pulihkan">
                              <IconButton
                                size="small"
                                onClick={() => handleRestore(category.id)}
                                color="success"
                              >
                                <Restore fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                        </TableCell>
                      </TableRow>
                    </Fade>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            component="div"
            count={categories.length}
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
              bgcolor: (theme) => alpha(theme.palette.background.default, 0.3)
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
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nama Kategori"
              fullWidth
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Akademik, Fasilitas"
              sx={{ mt: 2 }}
            />
          </DialogContent>
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
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Nama Kategori"
              fullWidth
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
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
      </Container>
    </AdminLayout>
  );
};

export default CategoryManagementPage;

