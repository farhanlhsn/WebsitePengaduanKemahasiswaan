import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  VerifiedUser,
  Warning,
  Delete
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

const UserStatistics = ({ users = [], loading = false }) => {
  const theme = useTheme();

  const stats = {
    total: users.length,
    verified: users.filter(u => u.isVerified).length,
    unverified: users.filter(u => !u.isVerified).length,
    deleted: users.filter(u => u.status === 'DELETED').length,
    students: users.filter(u => u.role === 'MAHASISWA').length,
    admins: users.filter(u => u.role === 'ADMIN').length
  };

  const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
    <Paper sx={{ 
      p: 3, 
      borderRadius: 3,
      background: `linear-gradient(135deg, 
        ${alpha(color, 0.05)}, 
        ${alpha(color, 0.02)})`,
      border: `1px solid ${alpha(color, 0.1)}`
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ 
          p: 1.5, 
          borderRadius: 2, 
          bgcolor: alpha(color, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </Box>
        {trend && (
          <Chip 
            icon={trend === 'up' ? <TrendingUp /> : <TrendingDown />}
            label={trend === 'up' ? '+12%' : '-5%'}
            color={trend === 'up' ? 'success' : 'error'}
            size="small"
          />
        )}
      </Box>
      
      <Typography variant="h3" fontWeight={700} color={color} gutterBottom>
        {value}
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );

  const ProgressCard = ({ title, value, total, color, subtitle }) => (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="h6" color={color} fontWeight={700}>
          {value}/{total}
        </Typography>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={(value / total) * 100} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          bgcolor: alpha(color, 0.1),
          '& .MuiLinearProgress-bar': {
            bgcolor: color,
            borderRadius: 4
          }
        }} 
      />
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {subtitle}
      </Typography>
    </Paper>
  );

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[...Array(8)].map((_, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <LinearProgress />
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Box>
      {/* Main Statistics */}
      <Grid container spacing={3} sx={{ 
         display: 'grid',
         gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', // Membuat kolom yang fleksibel
         gridGap: '20px',
         mb: 3
      }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Pengguna"
            value={stats.total}
            icon={<People sx={{ color: theme.palette.primary.main }} />}
            color={theme.palette.primary.main}
            subtitle="Semua pengguna terdaftar"
            trend="up"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Terverifikasi"
            value={stats.verified}
            icon={<VerifiedUser sx={{ color: theme.palette.success.main }} />}
            color={theme.palette.success.main}
            subtitle="Mahasiswa terverifikasi"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Belum Terverifikasi"
            value={stats.unverified}  
            icon={<Warning sx={{ color: theme.palette.warning.main }} />}
            color={theme.palette.warning.main}
            subtitle="Menunggu verifikasi"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Distribusi Role
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Chip 
                icon={<People />}
                label={`Mahasiswa (${stats.students})`}
                color="primary"
                variant="outlined"
              />
              <Chip 
                icon={<VerifiedUser />}
                label={`Admin (${stats.admins})`}
                color="secondary"
                variant="outlined"
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Mahasiswa
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.total > 0 ? (stats.students / stats.total) * 100 : 0}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Admin
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.total > 0 ? (stats.admins / stats.total) * 100 : 0}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserStatistics; 