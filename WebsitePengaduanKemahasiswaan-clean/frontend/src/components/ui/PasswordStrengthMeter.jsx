import React, { useMemo } from 'react';
import { Box, LinearProgress, Typography, Stack } from '@mui/material';
import { CheckCircleOutline, RadioButtonUnchecked } from '@mui/icons-material';

/**
 * Mirror of backend password policy (utils/passwordPolicy.js):
 *  - min 8 chars (max 128)
 *  - lowercase, uppercase, digit required
 *  - special char optional but adds strength
 *  - common passwords blocked
 */
const RULES = [
  { key: 'length', label: 'Minimal 8 karakter', test: (p) => p.length >= 8 },
  { key: 'lower', label: 'Mengandung huruf kecil', test: (p) => /[a-z]/.test(p) },
  { key: 'upper', label: 'Mengandung huruf besar', test: (p) => /[A-Z]/.test(p) },
  { key: 'digit', label: 'Mengandung angka', test: (p) => /[0-9]/.test(p) },
  { key: 'special', label: 'Mengandung karakter spesial (opsional)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const LABELS = ['Sangat Lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
const COLORS = ['#d32f2f', '#f57c00', '#fbc02d', '#388e3c', '#1b5e20'];

function scorePassword(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.max(0, Math.min(score - 1, 4));
}

export default function PasswordStrengthMeter({ password = '', showRules = true }) {
  const score = useMemo(() => scorePassword(password), [password]);
  const ruleStatuses = useMemo(
    () => RULES.map((r) => ({ ...r, passed: r.test(password) })),
    [password]
  );

  if (!password) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <LinearProgress
        variant="determinate"
        value={(score + 1) * 20}
        aria-label="Kekuatan password"
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: '#eee',
          '& .MuiLinearProgress-bar': {
            bgcolor: COLORS[score],
            transition: 'background-color 200ms ease',
          },
        }}
      />
      <Typography variant="caption" sx={{ color: COLORS[score], mt: 0.5, display: 'block' }}>
        Kekuatan: {LABELS[score]}
      </Typography>

      {showRules && (
        <Stack spacing={0.25} sx={{ mt: 1 }}>
          {ruleStatuses.map((r) => (
            <Box
              key={r.key}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: r.passed ? 'success.main' : 'text.secondary' }}
            >
              {r.passed ? (
                <CheckCircleOutline sx={{ fontSize: 14 }} />
              ) : (
                <RadioButtonUnchecked sx={{ fontSize: 14 }} />
              )}
              <Typography variant="caption">{r.label}</Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
