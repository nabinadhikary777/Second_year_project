import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Rating,
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
  Avatar,
  TextField,
  IconButton,
  ImageList,
  ImageListItem,
  Dialog,
  DialogContent,
  CircularProgress,
} from '@mui/material';
import {
  DirectionsCar,
  LocalGasStation,
  Settings,
  People,
  LocationOn,
  CalendarToday,
  AttachMoney,
  Security,
  Star,
  Close,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleAPI, bookingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { getImageUrl } from '../../utils/constants';

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [completedBookingForReview, setCompletedBookingForReview] = useState(null);

  useEffect(() => {
    fetchVehicleDetails();
  }, [id]);

  useEffect(() => {
    if (user && vehicle) {
      bookingAPI.getCustomerBookings('completed').then((res) => {
        const list = res.data.results || res.data || [];
        const vid = Number(id);
        const forThisVehicle = list.filter(
          (b) => Number(b.vehicle) === vid || b.vehicle_details?.id === vid
        );
        const reviewedIds = new Set(reviews.map((r) => r.booking));
        const unreviewed = forThisVehicle.find((b) => !reviewedIds.has(b.id));
        setCompletedBookingForReview(unreviewed || null);
      }).catch(() => {});
    }
  }, [user, vehicle, id, reviews]);

  const fetchVehicleDetails = async () => {
    try {
      const [vehicleRes, reviewsRes] = await Promise.all([
        vehicleAPI.getVehicle(id),
        vehicleAPI.getVehicleReviews(id),
      ]);
      setVehicle(vehicleRes.data);
      setReviews(reviewsRes.data);
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      toast.error('Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    navigate(`/customer/book/${id}`);
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setOpenImageDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!completedBookingForReview?.id) {
      toast.error('Complete a booking for this vehicle first to leave a review.');
      return;
    }

    setSubmittingReview(true);
    try {
      await bookingAPI.addReview(completedBookingForReview.id, {
        rating,
        comment: reviewText.trim() || '',
      });
      toast.success('Review submitted successfully!');
      setReviewText('');
      setRating(5);
      fetchVehicleDetails();
      setCompletedBookingForReview(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || error.response?.data?.rating?.[0] || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!vehicle) {
    return (
      <Container>
        <Typography>Vehicle not found</Typography>
      </Container>
    );
  }

  // Only show actual uploaded images - no dummy placeholders for empty slots
  // Use getImageUrl to ensure relative paths work (prepend backend URL)
  const images = [vehicle.main_image, vehicle.image1, vehicle.image2, vehicle.image3]
    .filter(Boolean)
    .map((url) => getImageUrl(url));
  const displayImage = selectedImage || images[0];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Image Gallery */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Box
              sx={{
                width: '100%',
                height: 400,
                ...(displayImage
                  ? {
                      backgroundImage: `url(${displayImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      cursor: 'pointer',
                    }
                  : {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.200',
                    }),
                borderRadius: 1,
                mb: 2,
              }}
              onClick={() => displayImage && handleImageClick(displayImage)}
            >
              {!displayImage && (
                <DirectionsCar sx={{ fontSize: 120, color: 'grey.400' }} />
              )}
            </Box>
            
            {images.length > 0 && (
              <ImageList cols={4} gap={8}>
                {images.map((image, index) => (
                  <ImageListItem
                    key={index}
                    sx={{
                      cursor: 'pointer',
                      border: (selectedImage || images[0]) === image ? '2px solid #1976d2' : 'none',
                    }}
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image}
                      alt={`${vehicle.brand} ${vehicle.model} ${index + 1}`}
                      style={{ height: 80, objectFit: 'cover' }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Paper>
        </Grid>

        {/* Booking Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 20 }}>
            <Typography variant="h5" gutterBottom>
              {vehicle.brand} {vehicle.model}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating value={vehicle.average_rating || 0} precision={0.5} readOnly />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({vehicle.total_reviews || 0} reviews)
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
              <Typography variant="h4" color="primary">
                रू {vehicle.price_per_day?.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                /day
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleBookNow}
              sx={{ mb: 2 }}
            >
              Book Now
            </Button>

            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
              <Security sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2">
                Security Deposit: रू {vehicle.security_deposit?.toLocaleString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Vehicle Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Vehicle Details
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <DirectionsCar sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {vehicle.transmission}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <LocalGasStation sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {vehicle.fuel_type}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <People sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {vehicle.seating_capacity} Seats
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <CalendarToday sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {vehicle.year} Model
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Description
            </Typography>
            <Typography variant="body2" paragraph>
              {vehicle.description}
            </Typography>

            <Typography variant="subtitle1" gutterBottom>
              Features
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {vehicle.features?.split(',').map((feature, index) => (
                <Chip key={index} label={feature.trim()} size="small" />
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              Location
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="body2">
                {vehicle.area}, {vehicle.city}
              </Typography>
            </Box>
            {vehicle.pickup_instructions && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Pickup Instructions:</strong> {vehicle.pickup_instructions}
              </Typography>
            )}
          </Paper>

          {/* Owner Info */}
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Owner Information
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ width: 60, height: 60, mr: 2 }}>
                {vehicle.owner_name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle1">
                  {vehicle.owner_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Member since {new Date(vehicle.created_at).getFullYear()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phone: {vehicle.owner_phone}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Reviews */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Reviews ({reviews.length})
            </Typography>

            {reviews.length > 0 ? (
              reviews.map((review) => (
                <Box key={review.id} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ mr: 2 }}>{review.customer_name?.charAt(0)}</Avatar>
                    <Box>
                      <Typography variant="subtitle2">{review.customer_name}</Typography>
                      <Rating value={review.rating} size="small" readOnly />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {(review.comment && (
                    <Typography variant="body2" sx={{ ml: 7 }}>
                      {review.comment}
                    </Typography>
                  )) || (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 7, fontStyle: 'italic' }}>
                      Rated {review.rating} stars
                    </Typography>
                  )}
                  {review.owner_reply && (
                    <Box sx={{ ml: 7, mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Owner's Reply:
                      </Typography>
                      <Typography variant="body2">{review.owner_reply}</Typography>
                    </Box>
                  )}
                  <Divider sx={{ mt: 2 }} />
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No reviews yet. Be the first to review!
              </Typography>
            )}

            {/* Rate & Review - Only for customers who have a completed booking for this vehicle */}
            {user && completedBookingForReview && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  Rate & Review this Vehicle
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Share your experience to help other customers
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Typography variant="body2">Your rating:</Typography>
                  <Rating
                    value={rating}
                    onChange={(e, newValue) => setRating(newValue || 5)}
                    size="large"
                  />
                  <Typography variant="body2" color="text.secondary">
                    ({rating}/5)
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add a comment (optional)"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  startIcon={<Star />}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </Box>
            )}
            {/* Prompt for non-logged-in users */}
            {!user && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 2, textAlign: 'center' }}>
                <Star sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Login and complete a booking to rate this vehicle
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/login')}
                  sx={{ mt: 2 }}
                >
                  Login to Rate
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Image Dialog */}
      <Dialog
        open={openImageDialog}
        onClose={() => setOpenImageDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent>
          <Box sx={{ position: 'relative' }}>
            <IconButton
              sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}
              onClick={() => setOpenImageDialog(false)}
            >
              <Close />
            </IconButton>
            <img
              src={selectedImage || images[0]}
              alt="Vehicle"
              style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default VehicleDetail;