import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  Avatar,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  DirectionsCar,
  CalendarToday,
  LocationOn,
  AttachMoney,
  Receipt,
  Star,
  Close,
  Payment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { BOOKING_STATUS_COLORS } from '../../utils/constants';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [tabValue]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingAPI.getCustomerBookings(tabValue);
      setBookings(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewDetails = (bookingId) => {
    navigate(`/customer/booking-detail/${bookingId}`);
  };

  const handleMakePayment = (bookingId) => {
    navigate(`/customer/payment/${bookingId}`);
  };

  const handleOpenReview = (booking) => {
    setSelectedBooking(booking);
    setReviewDialogOpen(true);
  };

  const handleCloseReview = () => {
    setReviewDialogOpen(false);
    setSelectedBooking(null);
    setRating(5);
    setReview('');
  };

  const handleOpenCancelDialog = (booking) => {
    setBookingToCancel(booking);
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setBookingToCancel(null);
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    setCancelling(true);
    try {
      await bookingAPI.cancelBooking(bookingToCancel.id, 'Cancelled by customer');
      toast.success('Booking cancelled successfully');
      handleCloseCancelDialog();
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    try {
      await bookingAPI.addReview(selectedBooking.id, {
        rating,
        comment: review.trim() || '',
      });
      toast.success('Review submitted successfully!');
      handleCloseReview();
      fetchBookings();
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusColor = (status) => {
    return BOOKING_STATUS_COLORS[status] || 'default';
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
        label={status.toUpperCase()}
        color={colors[status] || 'default'}
        size="small"
      />
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          My Bookings
        </Typography>
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Bookings" value="all" />
          <Tab label="Pending" value="pending" />
          <Tab label="Confirmed" value="confirmed" />
          <Tab label="Ongoing" value="ongoing" />
          <Tab label="Completed" value="completed" />
          <Tab label="Cancelled" value="cancelled" />
        </Tabs>
      </Paper>

      {bookings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <DirectionsCar sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bookings found
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/customer/vehicles')}
            sx={{ mt: 2 }}
          >
            Browse Vehicles
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {bookings.map((booking) => (
            <Grid item xs={12} key={booking.id}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    {/* Booking Header */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Booking #{booking.id}
                          </Typography>
                          {getStatusChip(booking.booking_status)}
                          <Chip
                            label={booking.payment_status}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Booked on: {new Date(booking.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider />
                    </Grid>

                    {/* Vehicle Info */}
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          variant="rounded"
                          src={booking.vehicle_details?.image}
                          sx={{ width: 80, height: 80, mr: 2 }}
                        >
                          <DirectionsCar />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1">
                            {booking.vehicle_details?.brand} {booking.vehicle_details?.model}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Owner: {booking.vehicle_details?.owner}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Dates */}
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ color: 'text.secondary', mr: 1 }} />
                        <Box>
                          <Typography variant="body2">
                            {new Date(booking.start_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            to {new Date(booking.end_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {booking.total_days} days
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Locations */}
                    <Grid item xs={12} sm={3}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationOn sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
                          <Typography variant="body2" noWrap>
                            Pickup: {booking.pickup_location}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationOn sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
                          <Typography variant="body2" noWrap>
                            Drop: {booking.drop_location}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Amount */}
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color="primary">
                          रू {booking.total_amount?.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Paid: रू {booking.paid_amount?.toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider />
                    </Grid>

                    {/* Actions */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewDetails(booking.id)}
                        >
                          View Details
                        </Button>
                        
                        {booking.booking_status === 'pending' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleMakePayment(booking.id)}
                            startIcon={<Payment />}
                          >
                            Pay Now
                          </Button>
                        )}
                        
                        {booking.booking_status === 'completed' && !booking.review && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleOpenReview(booking)}
                            startIcon={<Star />}
                          >
                            Rate & Review
                          </Button>
                        )}
                        
                        {(booking.booking_status === 'confirmed' || booking.booking_status === 'pending') && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleOpenCancelDialog(booking)}
                          >
                            Cancel Booking
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Cancel Booking Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          {bookingToCancel && (
            <Typography>
              Are you sure you want to cancel Booking #{bookingToCancel.id}? This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} disabled={cancelling}>
            Keep Booking
          </Button>
          <Button
            onClick={handleCancelBooking}
            color="error"
            variant="contained"
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={handleCloseReview} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Rate & Review
            <IconButton onClick={handleCloseReview}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {selectedBooking.vehicle_details?.brand} {selectedBooking.vehicle_details?.model}
              </Typography>
              
              <Box sx={{ my: 3 }}>
                <Typography gutterBottom>Rate your experience</Typography>
                <Rating
                  value={rating}
                  onChange={(e, newValue) => setRating(newValue)}
                  size="large"
                />
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your Review (optional)"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience with this vehicle..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReview}>Cancel</Button>
          <Button
            onClick={handleSubmitReview}
            variant="contained"
            disabled={submittingReview}
          >
            {submittingReview ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyBookings;