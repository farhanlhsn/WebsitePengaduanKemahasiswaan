import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import useChatStore from '../stores/chatStore';
import { CircularProgress, Box } from '@mui/material';

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { initializeAuth, isAuthenticated, refreshAuthToken, logout, user } = useAuthStore();
  const { initialize: initializeChat, cleanup: cleanupChat } = useChatStore();
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
            
            // Initialize chat after successful auth
            const { user } = useAuthStore.getState();
            if (user?.id) {
              await initializeChat(user.id);
            }
          } catch (error) {
            console.log('Token refresh failed, logging out...');
            await logout();
            cleanupChat();
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

    const publicPaths = ['/login', '/register'];
    const isPublicPath = publicPaths.includes(location.pathname);
    const authenticated = isAuthenticated();
    const { user } = useAuthStore.getState();

    if (!authenticated && !isPublicPath) {
      cleanupChat(); // Cleanup chat when logging out
      navigate('/login', { replace: true });
    } else if (authenticated && isPublicPath) {
      // Redirect based on user role
      const redirectPath = user?.role === 'ADMIN' ? '/admin' : '/dashboard';
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