import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Alert,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  DirectionsCar,
  LocalGasStation,
  Settings,
  People,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { vehicleAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { DUMMY_VEHICLE_IMAGES, getImageUrl } from '../../utils/constants';

const VehicleManagement = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await vehicleAPI.getOwnerVehicles();
      // API may return paginated { results: [...] } or a plain array
      const data = response.data;
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setVehicles(list);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/owner/vehicles/edit/${id}`);
  };

  const handleView = (id) => {
    navigate(`/owner/vehicles/${id}`);
  };

  const handleDeleteClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await vehicleAPI.deleteVehicle(selectedVehicle.id);
      toast.success('Vehicle deleted successfully');
      fetchVehicles();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete vehicle');
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setSelectedVehicle(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'success',
      booked: 'warning',
      maintenance: 'error',
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Ensure we always have an array (e.g. if API shape changes)
  const vehicleList = Array.isArray(vehicles) ? vehicles : [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              My Vehicles
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your vehicle listings
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/owner/vehicles/add')}
            size="large"
          >
            Add New Vehicle
          </Button>
        </Box>
      </Paper>

      {/* Vehicle Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Vehicles
              </Typography>
              <Typography variant="h4">{vehicleList.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Available
              </Typography>
              <Typography variant="h4" color="success.main">
                {vehicleList.filter(v => v.status === 'available').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Booked
              </Typography>
              <Typography variant="h4" color="warning.main">
                {vehicleList.filter(v => v.status === 'booked').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vehicles Grid */}
      {vehicleList.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <DirectionsCar sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No vehicles added yet
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/owner/vehicles/add')}
            sx={{ mt: 2 }}
          >
            Add Your First Vehicle
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {vehicleList.map((vehicle) => (
            <Grid item xs={12} md={6} lg={4} key={vehicle.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={getImageUrl(vehicle.main_image) || DUMMY_VEHICLE_IMAGES[0]}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div" noWrap>
                      {vehicle.brand} {vehicle.model} ({vehicle.year})
                    </Typography>
                    <Chip
                      label={vehicle.status}
                      size="small"
                      color={getStatusColor(vehicle.status)}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={vehicle.average_rating || 0} precision={0.5} size="small" readOnly />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      ({vehicle.total_reviews || 0})
                    </Typography>
                  </Box>

                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocalGasStation sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                        <Typography variant="caption">{vehicle.fuel_type}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Settings sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                        <Typography variant="caption">{vehicle.transmission}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <People sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                        <Typography variant="caption">{vehicle.seating_capacity} seats</Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Registration: {vehicle.registration_number}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Location: {vehicle.city}, {vehicle.area}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="h6" color="primary">
                      रू {vehicle.price_per_day?.toLocaleString()}
                      <Typography component="span" variant="caption" color="text.secondary">
                        /day
                      </Typography>
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => handleView(vehicle.id)}
                    title="View Details"
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleEdit(vehicle.id)}
                    title="Edit Vehicle"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(vehicle)}
                    title="Delete Vehicle"
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Vehicle</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedVehicle?.brand} {selectedVehicle?.model}"?
          </Typography>
          <Typography variant="caption" color="error" sx={{ mt: 2, display: 'block' }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VehicleManagement;