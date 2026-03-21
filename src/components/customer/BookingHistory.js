import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Rating,
} from '@mui/material';
import { bookingAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const BookingHistory = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  const fetchBookingHistory = async () => {
    try {
      const response = await bookingAPI.getCustomerBookings('completed');
      setBookings(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching booking history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Booking History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View your completed bookings
        </Typography>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Booking ID</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Dates</TableCell>
              <TableCell>Total Days</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>#{booking.id}</TableCell>
                <TableCell>
                  {booking.vehicle_details?.brand} {booking.vehicle_details?.model}
                </TableCell>
                <TableCell>
                  {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                </TableCell>
                <TableCell>{booking.total_days} days</TableCell>
                <TableCell>रू {booking.total_amount?.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip label="Completed" color="success" size="small" />
                </TableCell>
                <TableCell>
                  {booking.review ? (
                    <Rating value={booking.review.rating} readOnly size="small" />
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/customer/vehicles/${booking.vehicle}`)}
                    >
                      Review
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => navigate(`/customer/vehicles/${booking.vehicle}`)}
                  >
                    View Vehicle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default BookingHistory;