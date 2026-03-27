import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Divider,
  Card,
  CardMedia,
  CardContent,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleAPI, bookingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import { differenceInDays } from 'date-fns';

const BookingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState('');
  
  const [bookingDetails, setBookingDetails] = useState({
    start_date: '',
    end_date: '',
    pickup_location: '',
    drop_location: '',
    special_requests: '',
  });

  const [totalDays, setTotalDays] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  useEffect(() => {
    if (bookingDetails.start_date && bookingDetails.end_date && vehicle) {
      const start = new Date(bookingDetails.start_date);
      const end = new Date(bookingDetails.end_date);
      const days = differenceInDays(end, start);
      if (days > 0) {
        setTotalDays(days);
        setTotalAmount(days * vehicle.price_per_day);
        setDateError('');
      } else {
        setTotalDays(0);
        setTotalAmount(0);
        setDateError(days === 0 ? 'End date must be after start date' : 'Invalid date range');
      }
    }
  }, [bookingDetails.start_date, bookingDetails.end_date, vehicle]);

  const fetchVehicleDetails = async () => {
    try {
      const response = await vehicleAPI.getVehicle(id);
      setVehicle(response.data);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      toast.error('Failed to load vehicle details');
      navigate('/customer/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!bookingDetails.start_date || !bookingDetails.end_date) {
      toast.error('Please select pickup and return dates');
      return;
    }

    if (totalDays <= 0) {
      toast.error('Please select valid dates');
      return;
    }

    if (!bookingDetails.pickup_location || !bookingDetails.drop_location) {
      toast.error('Please enter pickup and drop locations');
      return;
    }

    setSubmitting(true);
    
    try {
      const bookingData = {
        vehicle: vehicle.id,
        start_date: new Date(bookingDetails.start_date).toISOString().split('T')[0],
        end_date: new Date(bookingDetails.end_date).toISOString().split('T')[0],
        pickup_location: bookingDetails.pickup_location,
        drop_location: bookingDetails.drop_location,
        special_requests: bookingDetails.special_requests,
      };

      const response = await bookingAPI.createBooking(bookingData);
      const bookingId = response.data?.id || response.data?.booking?.id;
      toast.success('Booking created successfully!');
      if (bookingId) {
        navigate(`/customer/payment/${bookingId}`);
      } else {
        navigate('/customer/my-bookings');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!vehicle) {
    return (
      <Container>
        <Alert severity="error">Vehicle not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Vehicle Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardMedia
              component="img"
              height="200"
              image={vehicle.main_image || 'https://via.placeholder.com/400x200'}
              alt={`${vehicle.brand} ${vehicle.model}`}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {vehicle.brand} {vehicle.model} ({vehicle.year})
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Price per day:
                </Typography>
                <Typography variant="body1" color="primary">
                  रू {vehicle.price_per_day?.toLocaleString()}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Security Deposit:
                </Typography>
                <Typography variant="body2">
                  रू {vehicle.security_deposit?.toLocaleString()}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">Total Days:</Typography>
                <Typography variant="subtitle1">{totalDays}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="h6">Total Amount:</Typography>
                <Typography variant="h6" color="primary">
                  रू {totalAmount.toLocaleString()}
                </Typography>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                *Security deposit will be collected separately
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Booking Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>
              Book This Vehicle
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please fill in the details below to confirm your booking
            </Typography>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                  {/* Booking Dates */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Pickup Date"
                      type="date"
                      name="start_date"
                      value={bookingDetails.start_date}
                      onChange={handleDateChange}
                      inputProps={{ min: today }}
                      error={!!dateError}
                      helperText={dateError}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Return Date"
                      type="date"
                      name="end_date"
                      value={bookingDetails.end_date}
                      onChange={handleDateChange}
                      inputProps={{ min: bookingDetails.start_date || today }}
                      error={!!dateError}
                      helperText={dateError}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  {/* Locations */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Pickup Location"
                      name="pickup_location"
                      value={bookingDetails.pickup_location}
                      onChange={handleInputChange}
                      placeholder="Enter pickup address"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Drop Location"
                      name="drop_location"
                      value={bookingDetails.drop_location}
                      onChange={handleInputChange}
                      placeholder="Enter drop address"
                    />
                  </Grid>

                  {/* Special Requests */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Special Requests (Optional)"
                      name="special_requests"
                      value={bookingDetails.special_requests}
                      onChange={handleInputChange}
                      placeholder="Any special requirements or requests?"
                    />
                  </Grid>

                  {/* Terms and Conditions */}
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        By confirming this booking, you agree to:
                      </Typography>
                      <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                        <li>Pay the full amount before pickup</li>
                        <li>Return the vehicle on time</li>
                        <li>Follow all terms and conditions</li>
                      </ul>
                    </Alert>
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/customer/vehicles/${id}`)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={submitting || totalDays <= 0}
                        startIcon={submitting && <CircularProgress size={20} />}
                      >
                        {submitting ? 'Processing...' : 'Confirm Booking'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default BookingForm;