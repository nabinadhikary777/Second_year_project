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
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Phone Number"
              {...register('phone_number')}
              error={!!errors.phone_number}
              helperText={errors.phone_number?.message}
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
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="City"
              {...register('city')}
              error={!!errors.city}
              helperText={errors.city?.message}
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
              }}
            />
          </>
        );
      
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ mb: 1, color: '#1976d2', fontWeight: 'bold' }}>
            SawariSewa
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your account
          </Typography>

          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
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
              >
                Back
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Register'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
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
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;