import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAccessToken } from '../services/authToken';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import { CircularProgress, Box } from '@mui/material';

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initializeAuth, isAuthenticated, refreshAuthToken, logout } = useAuthStore();
  const { initialize: initializeChat, cleanup: cleanupChat } = useChatStore();
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize auth from localStorage
        initializeAuth();
        
        // Restore session from httpOnly cookie only when no in-memory access token.
        if (!getAccessToken()) {
          try {
            await refreshAuthToken();

            const { user } = useAuthStore.getState();
            if (user?.id) {
              await initializeChat(user.id);
            }
          } catch {
            await logout();
            cleanupChat();
          }
        } else {
          const { user } = useAuthStore.getState();
          if (user?.id) {
            await initializeChat(user.id);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - only run once on mount

  useEffect(() => {
    if (!isInitialized) return;

    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/waiting-verification'];
    const isPublicPath = publicPaths.some(p => location.pathname.startsWith(p));
    const authenticated = isAuthenticated();
    const { user } = useAuthStore.getState();

    if (!authenticated && !isPublicPath) {
      cleanupChat(); // Cleanup chat when logging out
      navigate('/login', { replace: true });
    } else if (authenticated && user?.role === 'MAHASISWA' && !user?.isVerified) {
      // Redirect unverified students to waiting page
      if (!location.pathname.startsWith('/waiting-verification')) {
        navigate('/waiting-verification', { replace: true });
      }
    } else if (authenticated && isPublicPath && !location.pathname.startsWith('/waiting-verification')) {
      // Redirect based on user role
      const redirectPath = ['ADMIN', 'SUPERADMIN'].includes(user?.role) ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isInitialized, location.pathname, navigate, isAuthenticated, cleanupChat]);

  // Cleanup chat on unmount
  useEffect(() => {
    return () => {
      cleanupChat();
    };
  }, [cleanupChat]);

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
