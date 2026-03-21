import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Rating,
  Chip,
  TextField,
  Button,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Star,
  Reply,
  CheckCircle,
  AccessTime,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { vehicleAPI, bookingAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const ReviewReplies = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // Fetch all vehicles of the owner
      const vehiclesRes = await vehicleAPI.getOwnerVehicles();
      const vehicles = vehiclesRes.data;
      
      // Fetch reviews for each vehicle
      const allReviews = [];
      for (const vehicle of vehicles) {
        const reviewsRes = await vehicleAPI.getVehicleReviews(vehicle.id);
        const vehicleReviews = reviewsRes.data.map(review => ({
          ...review,
          vehicleName: `${vehicle.brand} ${vehicle.model}`,
          vehicleImage: vehicle.main_image,
        }));
        allReviews.push(...vehicleReviews);
      }
      
      setReviews(allReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReplyClick = (review) => {
    setSelectedReview(review);
    setReplyText(review.owner_reply || '');
    setReplyDialogOpen(true);
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setSubmitting(true);
    try {
      await bookingAPI.replyToReview(selectedReview.id, replyText);
      toast.success('Reply sent successfully');
      fetchReviews();
      setReplyDialogOpen(false);
      setSelectedReview(null);
      setReplyText('');
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Customer Reviews
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and respond to customer reviews
        </Typography>
      </Paper>

      {/* Rating Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
            <Typography variant="h2" color="primary">
              {averageRating.toFixed(1)}
            </Typography>
            <Rating value={averageRating} precision={0.5} readOnly size="large" />
            <Typography variant="body2" color="text.secondary">
              Average Rating • {reviews.length} reviews
            </Typography>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Rating Breakdown
            </Typography>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter(r => r.rating === star).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <Box key={star} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ minWidth: 30 }}>{star} star</Typography>
                  <Box sx={{ flex: 1, mx: 2 }}>
                    <Box
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: '#e0e0e0',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          width: `${percentage}%`,
                          height: '100%',
                          bgcolor: star >= 4 ? 'success.main' : star >= 3 ? 'warning.main' : 'error.main',
                          borderRadius: 4,
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
                    {count}
                  </Typography>
                </Box>
              );
            })}
          </Card>
        </Grid>
      </Grid>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Star sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No reviews yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reviews from customers will appear here
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {reviews.map((review) => (
            <Grid item xs={12} key={review.id}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    {/* Customer Info */}
                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 50, height: 50, mr: 2 }}>
                          {review.customer_name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1">
                            {review.customer_name}
                          </Typography>
                          <Rating value={review.rating} size="small" readOnly />
                          <Typography variant="caption" color="text.secondary" display="block">
                            {new Date(review.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* Review Content */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Vehicle: {review.vehicleName}
                      </Typography>
                      <Typography variant="body1" paragraph>
                        "{review.comment}"
                      </Typography>
                      
                      {review.owner_reply && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Your Reply:
                          </Typography>
                          <Typography variant="body2">
                            {review.owner_reply}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Replied on: {new Date(review.owner_replied_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                    </Grid>

                    {/* Actions */}
                    <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
                      {!review.owner_reply ? (
                        <Button
                          variant="contained"
                          startIcon={<Reply />}
                          onClick={() => handleReplyClick(review)}
                        >
                          Reply
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          startIcon={<Reply />}
                          onClick={() => handleReplyClick(review)}
                        >
                          Edit Reply
                        </Button>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedReview?.owner_reply ? 'Edit Reply' : 'Reply to Review'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Customer Review:
            </Typography>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 3 }}>
              <Typography variant="body2">
                "{selectedReview?.comment}"
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Rating value={selectedReview?.rating} size="small" readOnly />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  by {selectedReview?.customer_name}
                </Typography>
              </Box>
            </Paper>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Reply"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply to this review..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReplySubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Sending...' : selectedReview?.owner_reply ? 'Update Reply' : 'Send Reply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReviewReplies;