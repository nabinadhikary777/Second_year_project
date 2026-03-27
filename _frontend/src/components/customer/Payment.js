import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

// Khalti ePayment integration via backend redirect flow
const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('khalti');
  const [activeStep, setActiveStep] = useState(0);
  const [verifying, setVerifying] = useState(false);
  
  const steps = ['Review Booking', 'Make Payment', 'Confirmation'];
  const pidx = searchParams.get('pidx');
  const status = searchParams.get('status');

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    // Handle Khalti redirect callback and verify transaction once.
    if (!pidx || verifying || !booking) return;
    if (status && status.toLowerCase() !== 'completed') {
      toast.warning(`Khalti payment status: ${status}`);
      return;
    }

    setVerifying(true);
    setProcessing(true);
    bookingAPI
      .verifyKhaltiPayment({
        pidx,
        booking_id: booking.id,
        total_amount: booking.total_amount,
      })
      .then(() => {
        toast.success('Payment successful!');
        setActiveStep(2);
        fetchBookingDetails();
      })
      .catch((error) => {
        const errMsg = error.response?.data?.error || 'Payment verification failed';
        toast.error(errMsg);
      })
      .finally(() => {
        setVerifying(false);
        setProcessing(false);
      });
  }, [pidx, status, booking]);

  const fetchBookingDetails = async () => {
    try {
      const response = await bookingAPI.getBookingDetail(bookingId);
      setBooking(response.data);
      if (response.data.payment_status === 'completed') {
        setActiveStep(2);
      } else if (response.data.booking_status === 'confirmed') {
        setActiveStep(1);
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      navigate('/customer/my-bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleKhaltiPayment = () => {
    setProcessing(true);
    bookingAPI
      .initiateKhaltiPayment({ booking_id: booking.id })
      .then((response) => {
        const paymentUrl = response.data?.payment_url;
        if (!paymentUrl) {
          toast.error(response.data?.error || 'Failed to initialize Khalti payment');
          setProcessing(false);
          return;
        }
        window.location.href = paymentUrl;
      })
      .catch((error) => {
        const errMsg = error.response?.data?.error || error.message;
        toast.error(`Failed to initiate Khalti payment: ${errMsg}`);
        setProcessing(false);
      });
  };

  const handlePayment = () => {
    if (paymentMethod === 'khalti') {
      handleKhaltiPayment();
    } else {
      toast.info('Other payment methods coming soon!');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!booking) {
    return (
      <Container>
        <Alert severity="error">Booking not found</Alert>
      </Container>
    );
  }

  const isPaid = booking.payment_status === 'completed';
  const dueAmount = booking.total_amount - booking.paid_amount;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Complete Your Payment
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ my: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Booking
            </Typography>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">
                      {booking.vehicle_details?.brand} {booking.vehicle_details?.model}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Pickup Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(booking.start_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Return Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(booking.end_date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Days
                    </Typography>
                    <Typography variant="body1">
                      {booking.total_days} days
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Price per day
                    </Typography>
                    <Typography variant="body1">
                      रू {booking.vehicle_details?.price_per_day?.toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={() => setActiveStep(1)}
              >
                Continue to Payment
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please complete your payment to confirm the booking
            </Alert>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Summary
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Base Amount ({booking.total_days} days)</Typography>
                  <Typography>रू {Number(booking.total_amount).toLocaleString()}</Typography>
                </Box>
                
                {booking.paid_amount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="success.main">Already Paid</Typography>
                    <Typography color="success.main">रू {Number(booking.paid_amount).toLocaleString()}</Typography>
                  </Box>
                )}
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Due Amount</Typography>
                  <Typography variant="h6" color="primary">
                    रू {Number(dueAmount).toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Select Payment Method</FormLabel>
              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <FormControlLabel
                  value="khalti"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <img
                        src="https://khalti.com/static/images/khalti-logo.svg"
                        alt="Khalti"
                        style={{ height: 30, marginRight: 8 }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/30x30?text=Khalti';
                        }}
                      />
                      Pay with Khalti
                    </Box>
                  }
                />
                <FormControlLabel
                  value="esewa"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <img
                        src="https://esewa.com.np/common/images/esewa_logo.png"
                        alt="eSewa"
                        style={{ height: 30, marginRight: 8 }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/30x30?text=eSewa';
                        }}
                      />
                      Pay with eSewa (Coming Soon)
                    </Box>
                  }
                  disabled
                />
                <FormControlLabel
                  value="card"
                  control={<Radio />}
                  label="Credit/Debit Card (Coming Soon)"
                  disabled
                />
              </RadioGroup>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handlePayment}
                disabled={processing || verifying}
                startIcon={processing ? <CircularProgress size={20} /> : <PaymentIcon />}
              >
                {processing ? 'Processing...' : `Pay रू ${Number(dueAmount).toLocaleString()}`}
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {isPaid ? (
              <>
                <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Payment Successful!
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Your booking has been confirmed. You will receive a confirmation email shortly.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/customer/my-bookings')}
                  sx={{ mt: 2 }}
                >
                  View My Bookings
                </Button>
              </>
            ) : (
              <>
                <Error sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Payment Pending
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Your payment is being processed. Please check back later.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setActiveStep(1)}
                  sx={{ mt: 2 }}
                >
                  Try Again
                </Button>
              </>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Payment;