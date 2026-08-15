import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import {
  GetApp,
  Inbox,
  MoreVert,
  Refresh,
  SearchOff,
  VisibilityOff,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import StatusBadge from '../ui/StatusBadge';
import EnhancedButton from '../ui/EnhancedButton';
import SearchInput from '../ui/SearchInput';

const AdminDataTable = ({
  data = [],
  columns = [],
  loading = false,
  totalCount = 0,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onSort,
  onFilter,
  onSearch,
  onRowAction,
  onBulkAction,
  selectable = false,
  actions = [],
  bulkActions = [],
  title = '',
  searchPlaceholder = 'Cari data...',
  filters = [],
  exportable = false,
  refreshable = false,
  onExport,
  onRefresh,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [bulkActionAnchorEl, setBulkActionAnchorEl] = useState(null);
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(10);

  const currentPage = onPageChange ? page : internalPage;
  const currentRowsPerPage = onRowsPerPageChange ? rowsPerPage : internalRowsPerPage;

  const getNestedValue = (obj, path) => path
    .split('.')
    .reduce((value, key) => (value === null || value === undefined ? value : value[key]), obj);

  const processedData = useMemo(() => {
    if (loading || !Array.isArray(data)) return [];
    let result = [...data];

    if (!onSearch && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((row) => columns.some((column) => {
        const value = getNestedValue(row, column.field);
        return value !== null && value !== undefined && String(value).toLowerCase().includes(query);
      }));
    }

    if (!onFilter) {
      Object.entries(filterValues).forEach(([field, filterValue]) => {
        if (filterValue !== '' && filterValue !== null && filterValue !== undefined) {
          result = result.filter((row) => String(getNestedValue(row, field)) === String(filterValue));
        }
      });
    }

    if (!onSort && orderBy) {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, orderBy);
        const bValue = getNestedValue(b, orderBy);
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return order === 'asc' ? (aValue < bValue ? -1 : 1) : (aValue > bValue ? -1 : 1);
      });
    }

    return result;
  }, [columns, data, filterValues, loading, onFilter, onSearch, onSort, order, orderBy, searchQuery]);

  const paginatedData = useMemo(() => {
    if (onPageChange) return data;
    const start = currentPage * currentRowsPerPage;
    return processedData.slice(start, start + currentRowsPerPage);
  }, [currentPage, currentRowsPerPage, data, onPageChange, processedData]);

  const handleSort = (field) => {
    const nextOrder = orderBy === field && order === 'asc' ? 'desc' : 'asc';
    setOrderBy(field);
    setOrder(nextOrder);
    onSort?.(field, nextOrder);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setInternalPage(0);
    onSearch?.(value);
  };

  const handleFilterChange = (field, value) => {
    const next = { ...filterValues, [field]: value };
    setFilterValues(next);
    setInternalPage(0);
    onFilter?.(next);
  };

  const handleSelectAll = (event) => {
    const pageIds = paginatedData.map((row) => row.id);
    setSelected(event.target.checked ? Array.from(new Set([...selected, ...pageIds])) : selected.filter((id) => !pageIds.includes(id)));
  };

  const handleSelectRow = (id) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const handleMenuOpen = (event, row) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleAction = (action, row) => {
    onRowAction?.(action, row);
    handleMenuClose();
  };

  const handleBulkAction = (action) => {
    if (selected.length) onBulkAction?.(action, selected);
    setSelected([]);
    setBulkActionAnchorEl(null);
  };

  const visibleActions = (row) => actions.filter((action) => !action.show || action.show(row));

  const isSourceEmpty = !loading && Array.isArray(data) && data.length === 0;

  const EmptyState = () => (
    <Box sx={{ py: 5, textAlign: 'center' }}>
      {isSourceEmpty ? (
        <>
          <Inbox sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
          <Typography fontWeight={700}>Tidak ada data</Typography>
          <Typography variant="body2" color="text.secondary">Belum ada data yang dapat ditampilkan saat ini.</Typography>
        </>
      ) : (
        <>
          <SearchOff sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
          <Typography fontWeight={700}>Data tidak ditemukan</Typography>
          <Typography variant="body2" color="text.secondary">Coba ubah kata kunci atau filter.</Typography>
        </>
      )}
    </Box>
  );

  const renderCellContent = (row, column) => {
    const value = getNestedValue(row, column.field);
    switch (column.type) {
      case 'avatar':
        return <Avatar sx={{ width: 34, height: 34 }}>{value?.charAt(0)?.toUpperCase() || '?'}</Avatar>;
      case 'reporter':
        return row.isAnonymous
          ? <Chip icon={<VisibilityOff sx={{ fontSize: 14 }} />} label="Anonim" size="small" variant="outlined" color="warning" />
          : (value ?? '-');
      case 'status':
        return <StatusBadge status={value} size="small" />;
      case 'chip':
        return <Chip label={value || '-'} size="small" color={column.chipColor || 'default'} variant={column.chipVariant || 'filled'} />;
      case 'date':
        return value ? new Date(value).toLocaleDateString('id-ID') : '-';
      case 'currency':
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value || 0);
      case 'number':
        return Number(value || 0).toLocaleString('id-ID');
      case 'boolean':
        return <Chip label={value ? 'Ya' : 'Tidak'} color={value ? 'success' : 'default'} size="small" />;
      default: {
        const text = value === null || value === undefined || value === '' ? '-' : String(value);
        return column.maxLength && text.length > column.maxLength ? `${text.slice(0, column.maxLength)}…` : text;
      }
    }
  };

  const currentPageIds = paginatedData.map((row) => row.id);
  const selectedOnPage = currentPageIds.filter((id) => selected.includes(id)).length;

  const ActionButton = ({ row }) => {
    if (!visibleActions(row).length) return <Typography variant="body2" color="text.disabled">-</Typography>;
    return (
      <Tooltip title="Buka menu aksi">
        <IconButton size="small" onClick={(event) => handleMenuOpen(event, row)} aria-label="Buka menu aksi">
          <MoreVert />
        </IconButton>
      </Tooltip>
    );
  };

  const MobileList = () => (
    <Box sx={{ px: 1.5, pb: 1.5 }}>
      {loading ? [...Array(Math.min(currentRowsPerPage, 5))].map((_, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 1.5, mb: 1.25, borderRadius: 2 }}>
          <Skeleton width="55%" /><Skeleton width="80%" /><Skeleton width="45%" />
        </Paper>
      )) : paginatedData.length === 0 ? (
        <EmptyState />
      ) : paginatedData.map((row) => (
        <Paper key={row.id} variant="outlined" sx={{ p: 1.5, mb: 1.25, borderRadius: 2.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            {selectable && (
              <Checkbox size="small" checked={selected.includes(row.id)} onChange={() => handleSelectRow(row.id)} sx={{ p: 0.25, mt: 0.1 }} />
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {columns.slice(0, 4).map((column, index) => (
                <Box key={column.field} sx={{ display: 'grid', gridTemplateColumns: '100px minmax(0, 1fr)', gap: 1, mb: index === 3 ? 0 : 0.75, alignItems: 'start' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={650}>{column.headerName}</Typography>
                  <Box sx={{ minWidth: 0, fontSize: '0.875rem', wordBreak: 'break-word' }}>{renderCellContent(row, column)}</Box>
                </Box>
              ))}
            </Box>
            <ActionButton row={row} />
          </Box>
        </Paper>
      ))}
    </Box>
  );

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ p: { xs: 1.5, sm: 2 }, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h6" fontWeight={800}>{title}</Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
            {selectable && selected.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary">{selected.length} dipilih</Typography>
                <EnhancedButton variant="outlined" size="small" onClick={(event) => setBulkActionAnchorEl(event.currentTarget)}>
                  Aksi Massal
                </EnhancedButton>
              </>
            )}
            {refreshable && (
              <Tooltip title="Segarkan data">
                <IconButton onClick={onRefresh} size="small" aria-label="Segarkan data"><Refresh /></IconButton>
              </Tooltip>
            )}
            {exportable && (
              <EnhancedButton variant="outlined" startIcon={<GetApp />} onClick={onExport} size="small">Ekspor</EnhancedButton>
            )}
          </Stack>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.25} alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mt: 1.5 }}>
          <Box sx={{ flex: 1, minWidth: { md: 240 } }}>
            <SearchInput value={searchQuery} onChange={(event) => handleSearch(event.target.value)} placeholder={searchPlaceholder} />
          </Box>
          {filters.map((filter) => (
            <FormControl key={filter.field} size="small" sx={{ minWidth: { xs: '100%', md: 150 } }}>
              <InputLabel>{filter.label}</InputLabel>
              <Select value={filterValues[filter.field] || ''} label={filter.label} onChange={(event) => handleFilterChange(filter.field, event.target.value)}>
                <MenuItem value="">Semua</MenuItem>
                {filter.options.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
              </Select>
            </FormControl>
          ))}
        </Stack>
      </Box>

      {isMobile ? <MobileList /> : (
        <TableContainer sx={{ maxHeight: 600, overflowX: 'auto' }}>
          <Table stickyHeader size="small" sx={{ width: '100%', minWidth: 720, tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                {selectable && (
                  <TableCell padding="checkbox" sx={{ width: 48, bgcolor: 'background.paper' }}>
                    <Checkbox
                      indeterminate={selectedOnPage > 0 && selectedOnPage < paginatedData.length}
                      checked={paginatedData.length > 0 && selectedOnPage === paginatedData.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column.field}
                    sortDirection={orderBy === column.field ? order : false}
                    sx={{
                      width: column.width,
                      fontWeight: 700,
                      bgcolor: 'background.paper',
                      py: 1.25,
                      px: 1.25,
                    }}
                  >
                    {column.sortable ? (
                      <TableSortLabel active={orderBy === column.field} direction={orderBy === column.field ? order : 'asc'} onClick={() => handleSort(column.field)}>
                        {column.headerName}
                      </TableSortLabel>
                    ) : column.headerName}
                  </TableCell>
                ))}
                {actions.length > 0 && <TableCell align="center" sx={{ width: 58, fontWeight: 700, bgcolor: 'background.paper' }}>Aksi</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? [...Array(Math.min(currentRowsPerPage, 10))].map((_, index) => (
                <TableRow key={index}>
                  {selectable && <TableCell><Skeleton width={24} /></TableCell>}
                  {columns.map((column) => <TableCell key={column.field}><Skeleton /></TableCell>)}
                  {actions.length > 0 && <TableCell><Skeleton width={24} /></TableCell>}
                </TableRow>
              )) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (actions.length ? 1 : 0)} align="center" sx={{ py: 1 }}>
                    <EmptyState />
                  </TableCell>
                </TableRow>
              ) : paginatedData.map((row) => (
                <TableRow key={row.id} hover selected={selected.includes(row.id)} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.025) } }}>
                  {selectable && <TableCell padding="checkbox"><Checkbox checked={selected.includes(row.id)} onChange={() => handleSelectRow(row.id)} /></TableCell>}
                  {columns.map((column) => (
                    <TableCell key={column.field} sx={{ py: 1.25, px: 1.25, verticalAlign: 'top', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      {renderCellContent(row, column)}
                    </TableCell>
                  ))}
                  {actions.length > 0 && <TableCell align="center"><ActionButton row={row} /></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Divider />
      <TablePagination
        component="div"
        count={onPageChange ? totalCount : processedData.length}
        page={currentPage}
        onPageChange={(event, nextPage) => { setInternalPage(nextPage); onPageChange?.(event, nextPage); }}
        rowsPerPage={currentRowsPerPage}
        onRowsPerPageChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          setInternalRowsPerPage(next);
          setInternalPage(0);
          onRowsPerPageChange?.(event);
        }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Baris per halaman:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`}
        sx={{ '& .MuiTablePagination-toolbar': { px: { xs: 1, sm: 2 } } }}
      />

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} transformOrigin={{ horizontal: 'right', vertical: 'top' }}>
        {selectedRow && visibleActions(selectedRow).map((action) => (
          <MenuItem key={action.id} onClick={() => handleAction(action.id, selectedRow)} sx={{ gap: 1.25 }}>
            {action.icon}{action.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={bulkActionAnchorEl} open={Boolean(bulkActionAnchorEl)} onClose={() => setBulkActionAnchorEl(null)} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }} transformOrigin={{ horizontal: 'right', vertical: 'top' }}>
        {(bulkActions.length ? bulkActions : actions.filter((action) => ['verify', 'delete', 'restore'].includes(action.id))).map((action) => (
          <MenuItem key={action.id} onClick={() => handleBulkAction(action.id)} sx={{ gap: 1.25 }}>
            {action.icon}{action.label} ({selected.length})
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
};

export default AdminDataTable;
