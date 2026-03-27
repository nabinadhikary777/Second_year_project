import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Protects routes by requiring authentication and optional role(s).
 * allowedRoles: ['customer'] | ['owner'] | ['customer', 'owner']
 */
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography color="text.secondary">Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user.profile?.user_type;
  const hasRole = allowedRoles.length === 0 || (userRole && allowedRoles.includes(userRole));

  if (!hasRole) {
    const redirectTo = userRole === 'owner' ? '/owner/dashboard' : '/customer/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default PrivateRoute;
