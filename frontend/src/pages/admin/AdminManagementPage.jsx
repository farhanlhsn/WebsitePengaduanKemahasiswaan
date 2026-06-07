import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Fade, Alert, Card, CardContent, Stack, Typography, Chip, Avatar, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Select,
  MenuItem, FormControl, InputLabel, CircularProgress, Divider, Paper
} from '@mui/material';
import {
  AdminPanelSettings, SupervisorAccount, Person, Add, Remove, ArrowUpward,
  ArrowDownward, Star, Category as CategoryIcon
} from '@mui/icons-material';
import { useOutletContext } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import useAuthStore from '../../stores/authStore';
import {
  listAdmins, demoteAdmin, promoteToSuperAdmin,
  demoteSuperAdmin, grantCategory, revokeCategory,
} from '../../services/adminGovernanceApi';
import { getCategories } from '../../services/api';
import AdminSectionHeader from './AdminSectionHeader';

/**
 * SUPERADMIN-only governance UI:
 *   - List all admin-tier users with their category assignments
 *   - Promote / demote between MAHASISWA, ADMIN, SUPERADMIN
 *   - Grant / revoke per-category access for ADMINs
 *
 * Refusal cases handled by backend (e.g. demoting last SUPERADMIN) surface
 * here as inline alerts.
 */
const AdminManagementPage = () => {
  const { onMobileMenuClick } = useOutletContext() ?? {};
  const { user } = useAuthStore();

  const [admins, setAdmins] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState(null);

  // grant-dialog state
  const [grantTarget, setGrantTarget] = useState(null);
  const [grantCategoryId, setGrantCategoryId] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [adminList, cats] = await Promise.all([listAdmins(), getCategories()]);
      setAdmins(Array.isArray(adminList) ? adminList : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const wrapAction = useCallback(
    async (fn) => {
      setActionPending(true);
      setError(null);
      try {
        await fn();
        await fetchAll();
      } catch (e) {
        setError(e?.response?.data?.message || e.message || 'Aksi gagal');
      } finally {
        setActionPending(false);
      }
    },
    [fetchAll]
  );

  const onPromoteSuper = (id) => wrapAction(() => promoteToSuperAdmin(id));
  const onDemoteSuper = (id) => wrapAction(() => demoteSuperAdmin(id));
  const onDemoteAdmin = (id) => wrapAction(() => demoteAdmin(id));
  const onRevokeCategory = (adminId, categoryId) =>
    wrapAction(() => revokeCategory(adminId, categoryId));
  const onGrantSubmit = () => {
    if (!grantTarget || !grantCategoryId) return;
    wrapAction(() => grantCategory(grantTarget.id, Number(grantCategoryId))).then(() => {
      setGrantTarget(null);
      setGrantCategoryId('');
    });
  };

  const superAdmins = useMemo(() => admins.filter((a) => a.role === 'SUPERADMIN'), [admins]);
  const regularAdmins = useMemo(() => admins.filter((a) => a.role === 'ADMIN'), [admins]);

  if (user?.role !== 'SUPERADMIN') {
    return (
      <Box>
        <AdminSectionHeader
          title="Kelola Admin"
          subtitle="Hanya Super Admin yang bisa mengakses halaman ini"
          onMobileMenuClick={onMobileMenuClick}
          showRefresh={false}
        />
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Anda tidak memiliki akses ke halaman ini.
        </Alert>
      </Box>
    );
  }

  return (
    <Fade in timeout={300}>
      <Box>
        <AdminSectionHeader
          title="Kelola Admin"
          subtitle="Promosi, demosi, dan kelola assignment kategori per admin"
          onMobileMenuClick={onMobileMenuClick}
          onRefresh={fetchAll}
        />

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            <SectionCard
              icon={<Star sx={{ color: 'warning.main' }} />}
              title={`Super Admin (${superAdmins.length})`}
              subtitle="Akses penuh ke seluruh kategori, dapat mengelola admin lain."
            >
              {superAdmins.length === 0 ? (
                <Alert severity="warning">
                  Tidak ada Super Admin aktif — sistem akan kehilangan governance kalau Anda demosi terakhir.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {superAdmins.map((a) => (
                    <AdminRow
                      key={a.id}
                      admin={a}
                      isSelf={user.id === a.id}
                      onDemoteSuper={() => onDemoteSuper(a.id)}
                      disabled={actionPending}
                    />
                  ))}
                </Stack>
              )}
            </SectionCard>

            <SectionCard
              icon={<AdminPanelSettings sx={{ color: 'primary.main' }} />}
              title={`Admin (${regularAdmins.length})`}
              subtitle="Akses dibatasi pada kategori yang ditugaskan."
            >
              {regularAdmins.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Belum ada admin. Promosi mahasiswa di halaman Manajemen Pengguna.
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {regularAdmins.map((a) => (
                    <AdminRow
                      key={a.id}
                      admin={a}
                      onPromoteSuper={() => onPromoteSuper(a.id)}
                      onDemoteAdmin={() => onDemoteAdmin(a.id)}
                      onGrant={() => setGrantTarget(a)}
                      onRevokeCategory={(catId) => onRevokeCategory(a.id, catId)}
                      disabled={actionPending}
                    />
                  ))}
                </Stack>
              )}
            </SectionCard>
          </Stack>
        )}

        {/* Grant category dialog */}
        <Dialog open={!!grantTarget} onClose={() => setGrantTarget(null)}>
          <DialogTitle>Berikan kategori ke {grantTarget?.name}</DialogTitle>
          <DialogContent sx={{ minWidth: 360 }}>
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel id="grant-category-label">Kategori</InputLabel>
              <Select
                labelId="grant-category-label"
                value={grantCategoryId}
                label="Kategori"
                onChange={(e) => setGrantCategoryId(e.target.value)}
              >
                {categories
                  .filter((c) => !grantTarget?.categoryAssignments?.some((a) => a.categoryId === c.id))
                  .map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGrantTarget(null)}>Batal</Button>
            <Button
              variant="contained"
              onClick={onGrantSubmit}
              disabled={!grantCategoryId || actionPending}
            >
              Berikan
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

const SectionCard = ({ icon, title, subtitle, children }) => (
  <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        {icon}
        <Box>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        </Box>
      </Stack>
      <Divider sx={{ mb: 2 }} />
      {children}
    </CardContent>
  </Card>
);

const AdminRow = ({
  admin,
  isSelf,
  onPromoteSuper,
  onDemoteSuper,
  onDemoteAdmin,
  onGrant,
  onRevokeCategory,
  disabled,
}) => {
  const theme = useTheme();
  const isSuper = admin.role === 'SUPERADMIN';

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
        <Avatar sx={{ bgcolor: isSuper ? 'warning.main' : 'primary.main' }}>
          {isSuper ? <Star /> : <AdminPanelSettings />}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              {admin.name}
              {isSelf && (
                <Chip size="small" label="Anda" color="info" sx={{ ml: 1 }} />
              )}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">{admin.email}</Typography>
          {!isSuper && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(admin.categoryAssignments || []).length === 0 ? (
                <Chip
                  size="small"
                  label="Belum ada kategori"
                  color="default"
                  variant="outlined"
                />
              ) : (
                admin.categoryAssignments.map((a) => (
                  <Chip
                    key={a.id}
                    size="small"
                    icon={<CategoryIcon sx={{ fontSize: 14 }} />}
                    label={a.category?.name || `Cat#${a.categoryId}`}
                    onDelete={() => onRevokeCategory(a.categoryId)}
                    disabled={disabled}
                  />
                ))
              )}
            </Box>
          )}
          {isSuper && (
            <Chip
              size="small"
              label="Akses semua kategori (implisit)"
              color="warning"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          )}
        </Box>
        <Stack direction="row" spacing={1}>
          {!isSuper && onGrant && (
            <Tooltip title="Berikan kategori">
              <span>
                <IconButton onClick={onGrant} disabled={disabled} color="primary">
                  <Add />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {!isSuper && onPromoteSuper && (
            <Tooltip title="Promosi ke Super Admin">
              <span>
                <IconButton onClick={onPromoteSuper} disabled={disabled} color="warning">
                  <ArrowUpward />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {!isSuper && onDemoteAdmin && (
            <Tooltip title="Demosi ke Mahasiswa">
              <span>
                <IconButton onClick={onDemoteAdmin} disabled={disabled} color="error">
                  <ArrowDownward />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {isSuper && onDemoteSuper && (
            <Tooltip title={isSelf ? 'Tidak bisa demosi diri sendiri' : 'Demosi ke Admin'}>
              <span>
                <IconButton
                  onClick={onDemoteSuper}
                  disabled={disabled || isSelf}
                  color="error"
                >
                  <ArrowDownward />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default AdminManagementPage;
