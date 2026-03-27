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
  MenuItem,
  Stepper,
  Step,
  StepLabel,
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
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

const steps = ['Account Type', 'Personal Details', 'Create Password'];

const schema = yup.object({
  // Step 1
  user_type: yup.string().required('Please select account type'),
  
  // Step 2
  username: yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone_number: yup.string().required('Phone number is required').matches(/^[0-9]+$/, 'Phone number must contain only digits').min(10, 'Phone number must be at least 10 digits'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  
  // Step 3
  password1: yup.string().required('Password is required').min(8, 'Password must be at least 8 characters'),
  password2: yup.string().required('Please confirm your password').oneOf([yup.ref('password1')], 'Passwords must match'),
});

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      user_type: 'customer',
      city: 'Kathmandu',
    },
  });

  const handleNext = async () => {
    let fieldsToValidate = [];
    
    if (activeStep === 0) {
      fieldsToValidate = ['user_type'];
    } else if (activeStep === 1) {
      fieldsToValidate = ['username', 'email', 'phone_number', 'address', 'city'];
    } else if (activeStep === 2) {
      fieldsToValidate = ['password1', 'password2'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = async (data) => {
    setError('');
    const result = await registerUser(data);
    if (result.success) {
      navigate('/login');
    } else {
      const msg = result.error && typeof result.error === 'object'
        ? (result.error.detail || result.error.non_field_errors?.[0] || Object.values(result.error).flat()[0] || 'Registration failed. Please try again.')
        : 'Registration failed. Please try again.';
      setError(msg || 'Registration failed. Please try again.');
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <TextField
            select
            fullWidth
            label="I want to register as"
            {...register('user_type')}
            error={!!errors.user_type}
            helperText={errors.user_type?.message}
            defaultValue="customer"
            InputProps={{ sx: { borderRadius: 2 } }}
          >
            <MenuItem value="customer">Customer (I want to rent vehicles)</MenuItem>
            <MenuItem value="owner">Vehicle Owner (I want to list my vehicles)</MenuItem>
          </TextField>
        );
      
      case 1:
        return (
          <>
            <TextField
              fullWidth
              label="Username"
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
              InputProps={{ sx: { borderRadius: 2 } }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{ sx: { borderRadius: 2 } }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Phone Number"
              {...register('phone_number')}
              error={!!errors.phone_number}
              helperText={errors.phone_number?.message}
              InputProps={{ sx: { borderRadius: 2 } }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Address"
              multiline
              rows={2}
              {...register('address')}
              error={!!errors.address}
              helperText={errors.address?.message}
              InputProps={{ sx: { borderRadius: 2 } }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="City"
              {...register('city')}
              error={!!errors.city}
              helperText={errors.city?.message}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
          </>
        );
      
      case 2:
        return (
          <>
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              {...register('password1')}
              error={!!errors.password1}
              helperText={errors.password1?.message}
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
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('password2')}
              error={!!errors.password2}
              helperText={errors.password2?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
          </>
        );
      
      default:
        return 'Unknown step';
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
          <Typography component="h1" variant="h4" sx={{ mb: 1, color: '#1976d2', fontWeight: 'bold' }}>
            SawariSewa
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
            Create your account
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
            Join as a customer or vehicle owner in a few easy steps.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip size="small" icon={<Security fontSize="small" />} label="Secure Sign Up" color="primary" variant="outlined" />
            <Chip size="small" icon={<Bolt fontSize="small" />} label="Quick Setup" color="primary" variant="outlined" />
          </Box>

          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            {getStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                    boxShadow: '0 8px 18px rgba(25, 118, 210, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)',
                    },
                  }}
                >
                  {isSubmitting ? 'Creating Account...' : 'Register'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                    boxShadow: '0 8px 18px rgba(25, 118, 210, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)',
                    },
                  }}
                >
                  Next
                </Button>
              )}
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login" variant="body2">
                  Sign in
                </Link>
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{
                mt: 2.5,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(25,118,210,0.05)',
                border: '1px solid rgba(25,118,210,0.12)',
                justifyContent: 'center',
              }}
            >
              <Chip size="small" icon={<VerifiedUser fontSize="small" />} label="Verified Accounts" variant="outlined" />
              <Chip size="small" icon={<Security fontSize="small" />} label="Protected Data" variant="outlined" />
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;