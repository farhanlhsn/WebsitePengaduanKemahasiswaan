import React, { useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useSettingsStore from './stores/settingsStore';
import { getTheme } from './theme';

const AppThemeProvider = ({ children }) => {
  const { settings } = useSettingsStore();
  
  const themeMode = useMemo(() => {
    if (settings.theme === 'auto') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.theme || 'light';
  }, [settings.theme]);

  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default AppThemeProvider;
