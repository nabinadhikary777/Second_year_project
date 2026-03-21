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
  Alert,
} from '@mui/material';
import {
  DirectionsCar,
  CalendarToday,
  LocationOn,
  AttachMoney,
  Person,
  Phone,
  Email,
  CheckCircle,
  Cancel,
  Info,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const BookingRequests = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState('pending');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [tabValue]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await bookingAPI.getOwnerBookings(tabValue);
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
    navigate(`/owner/bookings/${bookingId}`);
  };

  const handleAction = (booking, type) => {
    setSelectedBooking(booking);
    setActionType(type);
    setReason('');
    setActionDialogOpen(true);
  };

  const handleActionConfirm = async () => {
    setProcessing(true);
    try {
      await bookingAPI.updateBookingStatus(
        selectedBooking.id,
        actionType === 'approve' ? 'confirmed' : 'rejected',
        reason
      );
      toast.success(`Booking ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update booking status');
    } finally {
      setProcessing(false);
      setActionDialogOpen(false);
      setSelectedBooking(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      ongoing: 'primary',
      completed: 'success',
      cancelled: 'error',
      rejected: 'error',
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Booking Requests
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage customer booking requests
        </Typography>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Pending" value="pending" />
          <Tab label="Confirmed" value="confirmed" />
          <Tab label="Ongoing" value="ongoing" />
          <Tab label="Completed" value="completed" />
          <Tab label="Rejected" value="rejected" />
          <Tab label="All" value="all" />
        </Tabs>
      </Paper>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <DirectionsCar sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bookings found
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {bookings.map((booking) => (
            <Grid item xs={12} key={booking.id}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    {/* Header */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Booking #{booking.id}
                          </Typography>
                          <Chip
                            label={booking.booking_status.toUpperCase()}
                            color={getStatusColor(booking.booking_status)}
                            size="small"
                          />
                          <Chip
                            label={booking.payment_status}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Requested: {new Date(booking.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider />
                    </Grid>

                    {/* Customer Info */}
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2 }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {booking.customer_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <Phone /> {booking.customer_phone}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Vehicle Info */}
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DirectionsCar sx={{ color: 'text.secondary', mr: 1 }} />
                        <Box>
                          <Typography variant="subtitle2">
                            {booking.vehicle_details?.brand} {booking.vehicle_details?.model}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {booking.vehicle_details?.registration}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Dates */}
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ color: 'text.secondary', mr: 1 }} />
                        <Box>
                          <Typography variant="body2">
                            {new Date(booking.start_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            to {new Date(booking.end_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Amount */}
                    <Grid item xs={12} md={3}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color="primary">
                          रू {booking.total_amount?.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booking.total_days} days
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Locations */}
                    <Grid item xs={12}>
                      <Divider />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
                        <Typography variant="body2">
                          Pickup: {booking.pickup_location}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn sx={{ color: 'text.secondary', fontSize: 20, mr: 1 }} />
                        <Typography variant="body2">
                          Drop: {booking.drop_location}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Special Requests */}
                    {booking.special_requests && (
                      <Grid item xs={12}>
                        <Alert icon={<Info />} severity="info" sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            <strong>Special Request:</strong> {booking.special_requests}
                          </Typography>
                        </Alert>
                      </Grid>
                    )}

                    {/* Actions */}
                    <Grid item xs={12}>
                      <Divider />
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewDetails(booking.id)}
                        >
                          View Details
                        </Button>
                        
                        {booking.booking_status === 'pending' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              onClick={() => handleAction(booking, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              startIcon={<Cancel />}
                              onClick={() => handleAction(booking, 'reject')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {booking.booking_status === 'confirmed' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleAction(booking, 'ongoing')}
                          >
                            Mark as Ongoing
                          </Button>
                        )}
                        
                        {booking.booking_status === 'ongoing' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleAction(booking, 'completed')}
                          >
                            Mark as Completed
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

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Booking' : 'Reject Booking'}
        </DialogTitle>
        <DialogContent>
          {actionType === 'reject' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for rejection"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
          {actionType === 'approve' && (
            <Typography sx={{ mt: 2 }}>
              Are you sure you want to approve this booking?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleActionConfirm}
            color={actionType === 'approve' ? 'success' : 'error'}
            variant="contained"
            disabled={processing}
          >
            {processing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookingRequests;