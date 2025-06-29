import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import { CircularProgress, Box } from '@mui/material';

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initializeAuth, isAuthenticated, refreshAuthToken, logout } = useAuthStore();
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize auth from localStorage
        initializeAuth();
        
        // If user is authenticated, try to refresh token
        if (isAuthenticated()) {
          try {
            await refreshAuthToken();
          } catch (error) {
            console.log('Token refresh failed, logging out...');
            await logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const publicPaths = ['/login', '/register'];
    const isPublicPath = publicPaths.includes(location.pathname);
    const authenticated = isAuthenticated();
    const { user } = useAuthStore.getState();

    if (!authenticated && !isPublicPath) {
      navigate('/login', { replace: true });
    } else if (authenticated && isPublicPath) {
      // Redirect based on user role
      const redirectPath = user?.role === 'ADMIN' ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isInitialized, location.pathname, navigate]);

  // Show loading spinner while initializing
  if (!isInitialized) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f8f9fa'
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return children;
};

export default AuthProvider; 