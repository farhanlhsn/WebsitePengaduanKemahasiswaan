import React from 'react';
import { Box, Paper, Typography, LinearProgress, Stack, Avatar } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis } from 'recharts';
import { BarChart, TrendingUp } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import GlassCard from '../ui/GlassCard';

const STATUS_COLORS = {
  PENDING: '#FFC107',
  IN_REVIEW: '#2196F3',
  IN_PROGRESS: '#FF9800',
  RESOLVED: '#4CAF50',
  REJECTED: '#F44336',
  CANCELED: '#9E9E9E'
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ 
        bgcolor: 'background.paper', 
        p: 2, 
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: '1px solid rgba(0,0,0,0.08)',
        backdropFilter: 'blur(10px)'
      }}>
        <Typography variant="body2" fontWeight={600}>
          {payload[0].name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Jumlah: {payload[0].value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}% dari total
        </Typography>
      </Box>
    );
  }
  return null;
};

const StatusChart = ({ data }) => {
  const theme = useTheme();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Add total to each data item for percentage calculation
  const dataWithTotal = data.map(item => ({ ...item, total }));

  return (
    <GlassCard variant="glass" sx={{ 
      height: '100%',
      minHeight: 400,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <Box sx={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: '50%',
        bgcolor: alpha(theme.palette.primary.main, 0.03),
        zIndex: 0
      }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <BarChart color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Distribusi Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analisis status laporan
            </Typography>
          </Box>
        </Box>

        {data.length === 0 ? (
          <Box sx={{ 
            height: 300, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            <BarChart sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              Belum ada data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Data akan muncul setelah ada laporan
            </Typography>
          </Box>
        ) : (
          <>
            {/* Chart Container */}
            <Box sx={{ position: 'relative', mb: 3 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={dataWithTotal}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    cornerRadius={6}
                    animationBegin={0}
                    animationDuration={1500}
                    stroke="none"
                  >
                    {dataWithTotal.map((entry) => (
                      <Cell 
                        key={entry.name} 
                        fill={entry.color}
                        style={{ filter: `drop-shadow(0px 4px 8px ${alpha(entry.color, 0.2)})` }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Text */}
              <Box sx={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <Typography variant="h4" fontWeight={900} sx={{ color: 'text.primary', letterSpacing: -1 }}>
                  {total}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Laporan
                </Typography>
              </Box>
            </Box>

            {/* Legend with Progress Bars */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2.5, color: 'text.primary', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>
                Detail Distribusi
              </Typography>
              <Stack spacing={2}>
                {data.map((item) => {
                  const percentage = ((item.value / total) * 100);
                  return (
                    <Box key={item.name}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        mb: 1
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%', 
                            bgcolor: item.color,
                            boxShadow: `0 0 0 3px ${alpha(item.color, 0.15)}`
                          }} />
                          <Typography variant="body2" fontWeight={600} color="text.secondary">
                            {item.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="body2" fontWeight={800} color="text.primary">
                            {item.value}
                          </Typography>
                          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
                            {percentage.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(item.color, 0.08),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: item.color,
                            borderRadius: 3,
                            transition: 'transform 1.5s cubic-bezier(0.65, 0, 0.35, 1)'
                          }
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* Summary Stats */}
            <Box sx={{ 
              mt: 4, 
              p: 2, 
              borderRadius: 3, 
              bgcolor: alpha(theme.palette.success.main, 0.04),
              border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', width: 40, height: 40 }}>
                <TrendingUp />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={800} color="success.main">
                  Tingkat Penyelesaian
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {data.find(item => item.name === 'Selesai')?.value || 0} dari {total} laporan selesai 
                  {total > 0 && (
                    <span style={{ fontWeight: 800, color: theme.palette.success.main }}>
                      {' '}({(((data.find(item => item.name === 'Selesai')?.value || 0) / total) * 100).toFixed(1)}%)
                    </span>
                  )}
                </Typography>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </GlassCard>
  );
};

export default StatusChart;