import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  DirectionsCar,
  Receipt,
  AttachMoney,
  TrendingUp,
  PendingActions,
  CheckCircle,
  Cancel,
  Visibility,
  Star,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, bookingAPI, earningsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes, earningsRes] = await Promise.all([
        dashboardAPI.getStats(),
        bookingAPI.getOwnerBookings('pending'),
        earningsAPI.getEarnings(),
      ]);
      
      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data.results || bookingsRes.data);
      setEarnings(earningsRes.data.results || earningsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
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

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Earnings',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: 'rgb(25, 118, 210)',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const bookingStatusData = {
    labels: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    datasets: [
      {
        data: [
          stats?.pending_bookings || 0,
          stats?.confirmed_bookings || 0,
          stats?.completed_bookings || 0,
          stats?.total_bookings - (stats?.pending_bookings + stats?.confirmed_bookings + stats?.completed_bookings) || 0,
        ],
        backgroundColor: [
          'rgba(255, 159, 64, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgb(255, 159, 64)',
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(255, 99, 132)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.username}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your vehicles today
        </Typography>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Vehicles"
            value={stats?.total_vehicles || 0}
            icon={<DirectionsCar sx={{ color: 'white' }} />}
            color="#1976d2"
            subtitle={`${stats?.active_vehicles || 0} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bookings"
            value={stats?.total_bookings || 0}
            icon={<Receipt sx={{ color: 'white' }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Requests"
            value={stats?.pending_bookings || 0}
            icon={<PendingActions sx={{ color: 'white' }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Earnings"
            value={`रू ${(stats?.total_earnings || 0).toLocaleString()}`}
            icon={<AttachMoney sx={{ color: 'white' }} />}
            color="#9c27b0"
            subtitle={`Paid: रू ${(stats?.paid_earnings || 0).toLocaleString()}`}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Earnings Overview
            </Typography>
            <Line 
              data={chartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return 'रू ' + value.toLocaleString();
                      }
                    }
                  }
                }
              }}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Booking Status
            </Typography>
            <Doughnut 
              data={bookingStatusData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate('/owner/vehicles/add')}
                  startIcon={<DirectionsCar />}
                >
                  Add New Vehicle
                </Button>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/owner/bookings')}
                  startIcon={<Receipt />}
                >
                  View Bookings
                </Button>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/owner/earnings')}
                  startIcon={<AttachMoney />}
                >
                  View Earnings
                </Button>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/owner/reviews')}
                  startIcon={<Star />}
                >
                  Manage Reviews
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Booking Requests */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Pending Booking Requests
              </Typography>
              <Button
                variant="text"
                onClick={() => navigate('/owner/bookings')}
              >
                View All
              </Button>
            </Box>
            
            {recentBookings.length > 0 ? (
              <List>
                {recentBookings.slice(0, 5).map((booking, index) => (
                  <React.Fragment key={booking.id}>
                    <ListItem
                      alignItems="flex-start"
                      secondaryAction={
                        <Box>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            sx={{ mr: 1 }}
                            onClick={() => navigate(`/owner/bookings/${booking.id}`)}
                          >
                            <CheckCircle />
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            onClick={() => navigate(`/owner/bookings/${booking.id}`)}
                          >
                            <Cancel />
                          </Button>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          <DirectionsCar />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2">
                              {booking.vehicle_details?.brand} {booking.vehicle_details?.model}
                            </Typography>
                            <Chip
                              label={booking.booking_status}
                              size="small"
                              color="warning"
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              Customer: {booking.customer_name}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="primary">
                              Total: रू {booking.total_amount?.toLocaleString()}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < recentBookings.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No pending booking requests
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OwnerDashboard;