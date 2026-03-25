import React, { useState, useMemo } from 'react';
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, TablePagination, TableSortLabel, Checkbox, IconButton,
  Chip, Avatar, Typography, Menu, MenuItem, Tooltip, Fade, Skeleton,
  TextField, InputAdornment, FormControl, InputLabel, Select,
  Stack, useMediaQuery
} from '@mui/material';
import {
  MoreVert, Visibility, Edit, Delete, Restore, Search, FilterList,
  GetApp, Refresh
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
  title = '',
  searchPlaceholder = 'Cari data...',
  filters = [],
  exportable = false,
  refreshable = false,
  onExport,
  onRefresh
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
  
  // Internal pagination state
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(10);

  // Use props if provided (controlled), otherwise internal state (uncontrolled)
  const currentPage = onPageChange ? page : internalPage;
  const currentRowsPerPage = onRowsPerPageChange ? rowsPerPage : internalRowsPerPage;

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    setOrder(newOrder);
    setOrderBy(property);
    if (onSort) {
      onSort(property, newOrder);
    }
  };

  // Helper to get nested object values (e.g., 'category.name')
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  // Processed data (Search -> Filter -> Sort)
  const processedData = useMemo(() => {
    if (loading || !data) return [];
    
    let result = [...data];

    // 1. Search (Client-side only if onSearch is not provided)
    if (!onSearch && searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(row => 
        columns.some(column => {
          // Skip search for boolean, date, or complex types if needed, or convert to string
          const value = getNestedValue(row, column.field);
          return value !== null && value !== undefined && String(value).toLowerCase().includes(query);
        })
      );
    }

    // 2. Filter (Client-side only if onFilter is not provided)
    if (!onFilter && Object.keys(filterValues).length > 0) {
      Object.keys(filterValues).forEach(key => {
        const filterValue = filterValues[key];
        if (filterValue !== '' && filterValue !== null && filterValue !== undefined) {
           result = result.filter(row => {
             const rowValue = getNestedValue(row, key);
             return String(rowValue) === String(filterValue);
           });
        }
      });
    }

    // 3. Sort (Client-side only if onSort is not provided OR explicitly requested)
    if (!onSort && orderBy) {
      result.sort((a, b) => {
        const valueA = getNestedValue(a, orderBy);
        const valueB = getNestedValue(b, orderBy);

        if (valueB === null || valueB === undefined) return -1;
        if (valueA === null || valueA === undefined) return 1;

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return order === 'asc' 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        }

        if (valueA < valueB) {
          return order === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return order === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [data, orderBy, order, loading, searchQuery, filterValues, onSearch, onFilter, onSort, columns]);

  // Paginated data (Client-side only if onPageChange is not provided)
  const paginatedData = useMemo(() => {
    if (onPageChange) return data; // Server-side pagination assumes data is already sliced
    
    const start = currentPage * currentRowsPerPage;
    const end = start + currentRowsPerPage;
    return processedData.slice(start, end);
  }, [processedData, currentPage, currentRowsPerPage, onPageChange, data]);

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(paginatedData.map(row => row.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectRow = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setInternalPage(0); // Reset to first page on search
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...filterValues, [filterKey]: value };
    setFilterValues(newFilters);
    setInternalPage(0); // Reset to first page on filter
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  const handleChangePage = (event, newPage) => {
    setInternalPage(newPage);
    if (onPageChange) {
      onPageChange(event, newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setInternalRowsPerPage(newRowsPerPage);
    setInternalPage(0);
    if (onRowsPerPageChange) {
      onRowsPerPageChange(event);
    }
  };

  const handleMenuOpen = (event, row) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleAction = (action, row) => {
    if (onRowAction) {
      onRowAction(action, row);
    }
    handleMenuClose();
  };

  const handleBulkAction = (action) => {
    if (onBulkAction && selected.length > 0) {
      onBulkAction(action, selected);
      setSelected([]);
    }
    setBulkActionAnchorEl(null);
  };

  const renderCellContent = (row, column) => {
    const value = row[column.field];
    
    switch (column.type) {
      case 'avatar':
        return (
          <Avatar sx={{ width: 40, height: 40 }}>
            {value?.charAt(0)?.toUpperCase() || '?'}
          </Avatar>
        );
      
      case 'status':
        return <StatusBadge status={value} />;
      
      case 'chip':
        return (
          <Chip 
            label={value} 
            size="small" 
            color={column.chipColor || 'default'}
            variant={column.chipVariant || 'filled'}
          />
        );
      
      case 'date':
        return new Date(value).toLocaleDateString('id-ID');
      
      case 'currency':
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR'
        }).format(value);
      
      case 'number':
        return value?.toLocaleString('id-ID');
      
      case 'boolean':
        return (
          <Chip 
            label={value ? 'Ya' : 'Tidak'} 
            color={value ? 'success' : 'default'}
            size="small"
          />
        );
      
      default:
        return column.maxLength && value?.length > column.maxLength
          ? `${value.substring(0, column.maxLength)}...`
          : value;
    }
  };

  const LoadingSkeleton = () => (
    <TableBody>
      {[...Array(rowsPerPage)].map((_, index) => (
        <TableRow key={index}>
          {selectable && <TableCell><Skeleton width={24} height={24} /></TableCell>}
          {columns.map((column) => (
            <TableCell key={column.field}>
              <Skeleton height={24} />
            </TableCell>
          ))}
          <TableCell><Skeleton width={24} height={24} /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  );

  return (
    <Paper sx={{ 
      borderRadius: 4, 
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.background.paper, 0.8)}, 
          ${alpha(theme.palette.background.default, 0.4)})`
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          
          <Stack direction="row" spacing={1}>
            {selectable && selected.length > 0 && (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  {selected.length} dipilih
                </Typography>
                <EnhancedButton
                  variant="outlined"
                  size="small"
                  onClick={(e) => setBulkActionAnchorEl(e.currentTarget)}
                >
                  Bulk Action
                </EnhancedButton>
              </>
            )}
            {refreshable && (
              <Tooltip title="Refresh Data">
                <IconButton onClick={onRefresh} size="small">
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}
            {exportable && (
              <EnhancedButton
                variant="outlined"
                startIcon={<GetApp />}
                onClick={onExport}
                size="small"
              >
                Export
              </EnhancedButton>
            )}
          </Stack>
        </Box>

        {/* Search and Filters */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2} 
          alignItems="center"
        >
          <Box sx={{ flex: 1, minWidth: 250 }}>
            <SearchInput
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
            />
          </Box>
          
          {filters.map((filter) => (
            <FormControl key={filter.field} size="small" sx={{ minWidth: 150 }}>
              <InputLabel>{filter.label}</InputLabel>
              <Select
                value={filterValues[filter.field] || ''}
                label={filter.label}
                onChange={(e) => handleFilterChange(filter.field, e.target.value)}
              >
                <MenuItem value="">Semua</MenuItem>
                {filter.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Stack>
      </Box>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < data.length}
                    checked={data.length > 0 && selected.length === data.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  sortDirection={orderBy === column.field ? order : false}
                  sx={{ 
                    fontWeight: 600,
                    backgroundColor: alpha(theme.palette.primary.main, 0.02)
                  }}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.field}
                      direction={orderBy === column.field ? order : 'asc'}
                      onClick={() => handleSort(column.field)}
                    >
                      {column.headerName}
                    </TableSortLabel>
                  ) : (
                    column.headerName
                  )}
                </TableCell>
              ))}
              
              {actions.length > 0 && (
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Aksi
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <TableBody>
              {paginatedData.map((row, index) => (
                <Fade in timeout={200 + index * 50} key={row.id}>
                  <TableRow
                    hover
                    selected={selected.indexOf(row.id) !== -1}
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02)
                      }
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.indexOf(row.id) !== -1}
                          onChange={() => handleSelectRow(row.id)}
                        />
                      </TableCell>
                    )}
                    
                    {columns.map((column) => (
                      <TableCell key={column.field}>
                        {renderCellContent(row, column)}
                      </TableCell>
                    ))}
                    
                    {actions.length > 0 && (
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, row)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                </Fade>
              ))}
            </TableBody>
          )}
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={onPageChange ? totalCount : processedData.length}
        page={currentPage}
        onPageChange={handleChangePage}
        rowsPerPage={currentRowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Baris per halaman:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} dari ${count !== -1 ? count : `lebih dari ${to}`}`
        }
        sx={{
          borderTop: '1px solid rgba(0,0,0,0.06)',
          backgroundColor: alpha(theme.palette.background.default, 0.3)
        }}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {actions.map((action) => (
          <MenuItem
            key={action.id}
            onClick={() => handleAction(action.id, selectedRow)}
            sx={{ gap: 1 }}
          >
            {action.icon}
            {action.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Bulk Action Menu */}
      <Menu
        anchorEl={bulkActionAnchorEl}
        open={Boolean(bulkActionAnchorEl)}
        onClose={() => setBulkActionAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {actions.filter(action => ['verify', 'delete', 'restore'].includes(action.id)).map((action) => (
          <MenuItem
            key={action.id}
            onClick={() => handleBulkAction(action.id)}
            sx={{ gap: 1 }}
          >
            {action.icon}
            {action.label} ({selected.length})
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
};

export default AdminDataTable;
