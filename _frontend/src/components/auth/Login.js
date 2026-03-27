import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Link,
  Chip,
  Stack,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  DirectionsCar,
  Security,
  Bolt,
  VerifiedUser,
  SupportAgent,
  AccessTime,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const schema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{
        minHeight: 'calc(100vh - 160px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          marginTop: { xs: 4, md: 6 },
          marginBottom: { xs: 4, md: 6 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(25,118,210,0.08) 0%, rgba(33,150,243,0.02) 100%)',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            padding: { xs: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'rgba(25, 118, 210, 0.15)',
            boxShadow: '0 14px 30px rgba(25, 118, 210, 0.18)',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              color: '#fff',
              boxShadow: '0 8px 20px rgba(25,118,210,0.35)',
            }}
          >
            <DirectionsCar />
          </Box>

          <Typography
            component="h1"
            variant="h4"
            sx={{
              mb: 0.5,
              color: '#1976d2',
              fontWeight: 800,
              letterSpacing: 0.2,
            }}
          >
            SawariSewa
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Vehicle Rental System
          </Typography>

          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 2, textAlign: 'center', maxWidth: 360 }}
          >
            Rent trusted vehicles quickly with secure checkout and instant booking updates.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip size="small" icon={<Security fontSize="small" />} label="Secure Login" color="primary" variant="outlined" />
            <Chip size="small" icon={<Bolt fontSize="small" />} label="Fast Booking" color="primary" variant="outlined" />
          </Box>

          <Typography component="h2" variant="h5" sx={{ mb: 2.5, fontWeight: 600 }}>
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              fullWidth
              label="Username"
              autoComplete="username"
              autoFocus
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              margin="normal"
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                boxShadow: '0 8px 18px rgba(25, 118, 210, 0.25)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)',
                },
              }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Link component={RouterLink} to="/forgot-password" variant="body2" display="block" sx={{ mb: 1 }}>
                Forgot password?
              </Link>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/register" variant="body2">
                  Sign up here
                </Link>
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{
                mt: 3,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(25,118,210,0.05)',
                border: '1px solid rgba(25,118,210,0.12)',
                justifyContent: 'center',
              }}
            >
              <Chip size="small" icon={<VerifiedUser fontSize="small" />} label="Trusted Owners" variant="outlined" />
              <Chip size="small" icon={<SupportAgent fontSize="small" />} label="Quick Support" variant="outlined" />
              <Chip size="small" icon={<AccessTime fontSize="small" />} label="24/7 Availability" variant="outlined" />
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}>
              By signing in, you agree to continue with a secure session.
            </Typography>
          </Box>
        </Paper>

      </Box>
    </Container>
  );
};

export default Login;