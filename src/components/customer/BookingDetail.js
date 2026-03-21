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
  Chip,
  Avatar,
  Alert,
} from '@mui/material';
import {
  DirectionsCar,
  CalendarToday,
  LocationOn,
  ArrowBack,
  Payment,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    try {
      const response = await bookingAPI.getBookingDetail(id);
      setBooking(response.data);
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking details');
      navigate('/customer/my-bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      ongoing: 'primary',
      completed: 'success',
      cancelled: 'error',
      rejected: 'error',
    };
    return (
      <Chip
        label={status?.toUpperCase()}
        color={colors[status] || 'default'}
        size="small"
      />
    );
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

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/customer/my-bookings')}
        sx={{ mb: 2 }}
      >
        Back to My Bookings
      </Button>

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Booking #{booking.id}</Typography>
          {getStatusChip(booking.booking_status)}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Vehicle Info */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Vehicle
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                variant="rounded"
                src={booking.vehicle_details?.image}
                sx={{ width: 80, height: 80 }}
              >
                <DirectionsCar />
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {booking.vehicle_details?.brand} {booking.vehicle_details?.model}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Owner: {booking.vehicle_details?.owner}
                </Typography>
                {booking.vehicle_details?.owner_phone && (
                  <Typography variant="body2" color="text.secondary">
                    Contact: {booking.vehicle_details.owner_phone}
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Dates & Locations */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <CalendarToday sx={{ color: 'text.secondary', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Booking Period
                </Typography>
                <Typography variant="body1">
                  {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {booking.total_days} days
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Booked on: {new Date(booking.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <LocationOn sx={{ color: 'text.secondary', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Locations
                </Typography>
                <Typography variant="body2">Pickup: {booking.pickup_location}</Typography>
                <Typography variant="body2">Drop: {booking.drop_location}</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Special Requests */}
        {booking.special_requests && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Special Requests
            </Typography>
            <Typography variant="body2">{booking.special_requests}</Typography>
          </Box>
        )}

        {/* Payment Summary */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Payment Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Total Amount</Typography>
              <Typography variant="h6" color="primary">
                रू {booking.total_amount?.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography>Paid</Typography>
              <Typography>रू {booking.paid_amount?.toLocaleString()}</Typography>
            </Box>
            <Chip
              label={booking.payment_status}
              size="small"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>

        {/* Cancellation/Rejection Reason */}
        {(booking.cancellation_reason || booking.rejection_reason) && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {booking.rejection_reason ? (
              <>Rejection reason: {booking.rejection_reason}</>
            ) : (
              <>Cancellation reason: {booking.cancellation_reason}</>
            )}
          </Alert>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {booking.booking_status === 'pending' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<Payment />}
              onClick={() => navigate(`/customer/payment/${booking.id}`)}
            >
              Pay Now
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => navigate('/customer/my-bookings')}
          >
            Back to My Bookings
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default BookingDetail;
