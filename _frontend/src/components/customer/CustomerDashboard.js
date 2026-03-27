import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Rating,
  Divider,
} from '@mui/material';
import {
  DirectionsCar,
  BookOnline,
  History,
  AttachMoney,
  TrendingUp,
  Star,
  RateReview,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, vehicleAPI, bookingAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import { DUMMY_VEHICLE_IMAGES, getImageUrl } from '../../utils/constants';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentVehicles, setRecentVehicles] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, vehiclesRes, bookingsRes] = await Promise.all([
        dashboardAPI.getStats(),
        vehicleAPI.getVehicles({ page_size: 4, page: 1 }),
        bookingAPI.getCustomerBookings(),
      ]);
      
      setStats(statsRes.data);
      setRecentVehicles(vehiclesRes.data?.results || vehiclesRes.data || []);
      setRecentBookings(bookingsRes.data.results || bookingsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.username}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find your perfect ride from our collection of vehicles
        </Typography>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bookings"
            value={stats?.total_bookings || 0}
            icon={<BookOnline sx={{ color: 'white' }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Rentals"
            value={stats?.active_bookings || 0}
            icon={<DirectionsCar sx={{ color: 'white' }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Trips"
            value={stats?.completed_bookings || 0}
            icon={<History sx={{ color: 'white' }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Spent"
            value={`रू ${stats?.total_spent?.toLocaleString() || 0}`}
            icon={<AttachMoney sx={{ color: 'white' }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate('/customer/vehicles')}
              startIcon={<DirectionsCar />}
              sx={{ py: 1.5 }}
            >
              Browse Vehicles
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => navigate('/customer/my-bookings')}
              startIcon={<BookOnline />}
              sx={{ py: 1.5 }}
            >
              My Bookings
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => navigate('/customer/my-bookings')}
              startIcon={<Star />}
              sx={{ py: 1.5 }}
            >
              Rate & Review
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => navigate('/customer/profile')}
              startIcon={<TrendingUp />}
              sx={{ py: 1.5 }}
            >
              View Profile
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Rate eligible bookings - show after owner confirmation and onward */}
      {(() => {
        const toReview = recentBookings.filter(
          (b) => ['confirmed', 'ongoing', 'completed'].includes(b.booking_status) && !b.review
        );
        return toReview.length > 0 ? (
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RateReview color="primary" />
              Rate Your Confirmed Rentals
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Share your experience to help other customers
            </Typography>
            <Grid container spacing={2}>
              {toReview.slice(0, 3).map((booking) => (
                <Grid item xs={12} sm={6} md={4} key={booking.id}>
                  <Card sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1">
                        {booking.vehicle_details?.brand} {booking.vehicle_details?.model}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)} booking
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Star />}
                        onClick={() => navigate('/customer/my-bookings')}
                        sx={{ mt: 2 }}
                      >
                        Rate Now
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        ) : null;
      })()}

      {/* Recent Vehicles */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Featured Vehicles
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {recentVehicles.map((vehicle) => (
          <Grid item xs={12} sm={6} md={3} key={vehicle.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
              onClick={() => navigate(`/customer/vehicles/${vehicle.id}`)}>
              <CardMedia
                component="img"
                height="160"
                image={getImageUrl(vehicle.main_image) || DUMMY_VEHICLE_IMAGES[0]}
                alt={`${vehicle.brand} ${vehicle.model}`}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h6" component="div" noWrap>
                  {vehicle.brand} {vehicle.model} ({vehicle.year})
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating value={vehicle.average_rating || 0} precision={0.5} size="small" readOnly />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({vehicle.total_reviews || 0})
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {vehicle.fuel_type} • {vehicle.transmission} • {vehicle.seating_capacity} seats
                </Typography>
                <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                  रू {vehicle.price_per_day?.toLocaleString()}/day
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom>
            Recent Bookings
          </Typography>
          <Grid container spacing={2}>
            {recentBookings.slice(0, 3).map((booking) => (
              <Grid item xs={12} key={booking.id}>
                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Booking #{booking.id}
                        </Typography>
                        <Typography variant="body1">
                          {booking.vehicle_details?.brand} {booking.vehicle_details?.model}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Dates
                        </Typography>
                        <Typography variant="body2">
                          {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total
                        </Typography>
                        <Typography variant="body1" color="primary">
                          रू {booking.total_amount?.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Chip
                          label={booking.booking_status}
                          color={
                            booking.booking_status === 'confirmed' ? 'success' :
                            booking.booking_status === 'pending' ? 'warning' :
                            booking.booking_status === 'completed' ? 'info' : 'default'
                          }
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => navigate(`/customer/my-bookings`)}
                        >
                          View Details
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
};

export default CustomerDashboard;