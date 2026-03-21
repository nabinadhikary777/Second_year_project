import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Divider,
  Alert,
  Chip,
  IconButton,
  ImageList,
  ImageListItem,
} from '@mui/material';
import {
  Save,
  Cancel,
  AddPhotoAlternate,
  Delete,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { vehicleAPI } from '../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import { FUEL_TYPES, TRANSMISSION_TYPES, NEPAL_CITIES, VEHICLE_BRANDS, VEHICLE_CATEGORIES, getImageUrl } from '../../utils/constants';

const schema = yup.object({
  brand: yup.string().required('Brand is required'),
  model: yup.string().required('Model is required'),
  year: yup.number().required('Year is required').min(2000, 'Year must be 2000 or later').max(new Date().getFullYear() + 1, 'Invalid year'),
  registration_number: yup.string().required('Registration number is required'),
  category: yup.string().required('Category is required'),
  fuel_type: yup.string().required('Fuel type is required'),
  transmission: yup.string().required('Transmission is required'),
  seating_capacity: yup.number().required('Seating capacity is required').min(1, 'Must have at least 1 seat'),
  mileage: yup.number().required('Mileage is required').min(0, 'Mileage must be positive'),
  price_per_day: yup.number().required('Price per day is required').min(0, 'Price must be positive'),
  security_deposit: yup.number().required('Security deposit is required').min(0, 'Security deposit must be positive'),
  city: yup.string().required('City is required'),
  area: yup.string().required('Area is required'),
  description: yup.string().required('Description is required').min(20, 'Description must be at least 20 characters'),
  features: yup.string().required('Features are required'),
});

const AddEditVehicle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const MAX_IMAGES = 4;
  const IMAGE_FIELDS = ['main_image', 'image1', 'image2', 'image3'];
  const [images, setImages] = useState({
    main_image: null,
    image1: null,
    image2: null,
    image3: null,
  });
  const [previewUrls, setPreviewUrls] = useState({});

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      year: new Date().getFullYear(),
      seating_capacity: 4,
      fuel_type: 'petrol',
      transmission: 'manual',
    },
  });

  useEffect(() => {
    if (id) {
      fetchVehicleDetails();
    }
  }, [id]);

  const fetchVehicleDetails = async () => {
    setLoading(true);
    try {
      const response = await vehicleAPI.getOwnerVehicle(id);
      const vehicle = response.data;
      
      // Set form values
      Object.keys(vehicle).forEach(key => {
        if (key !== 'id' && key !== 'owner' && key !== 'created_at' && key !== 'updated_at') {
          setValue(key, vehicle[key]);
        }
      });
      // Category dropdown uses names (Car, Bike, Truck); use category_name when editing
      if (vehicle.category_name) {
        setValue('category', vehicle.category_name);
      }

      // Set image previews (use getImageUrl for relative paths from API)
      if (vehicle.main_image) setPreviewUrls(prev => ({ ...prev, main_image: getImageUrl(vehicle.main_image) }));
      if (vehicle.image1) setPreviewUrls(prev => ({ ...prev, image1: getImageUrl(vehicle.image1) }));
      if (vehicle.image2) setPreviewUrls(prev => ({ ...prev, image2: getImageUrl(vehicle.image2) }));
      if (vehicle.image3) setPreviewUrls(prev => ({ ...prev, image3: getImageUrl(vehicle.image3) }));
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      toast.error('Failed to load vehicle details');
      navigate('/owner/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newImages = { ...images };
    const newPreviewUrls = { ...previewUrls };
    // Find empty slots and add new files to them (accept any number up to 4 total)
    const emptySlots = IMAGE_FIELDS.filter((field) => !newImages[field]);
    const slotsToFill = Math.min(emptySlots.length, files.length);
    const toAdd = files.slice(0, slotsToFill);
    if (files.length > slotsToFill) {
      toast.warning(`Only ${slotsToFill} more image(s) can be added (max ${MAX_IMAGES} total)`);
    }
    toAdd.forEach((file, idx) => {
      const field = emptySlots[idx];
      if (field) {
        newImages[field] = file;
        newPreviewUrls[field] = URL.createObjectURL(file);
      }
    });
    setImages(newImages);
    setPreviewUrls(newPreviewUrls);
    e.target.value = '';
  };

  const removeImage = (field) => {
    setImages(prev => ({ ...prev, [field]: null }));
    setPreviewUrls(prev => {
      const newUrls = { ...prev };
      delete newUrls[field];
      return newUrls;
    });
  };

  const onSubmit = async (data) => {
    if (!id && !images.main_image) {
      toast.error('Please upload at least one image (main image is required)');
      return;
    }
    setSubmitting(true);
    
    const formData = new FormData();
    
    // Append all form fields
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });

    // Append category
    formData.append('category', data.category);

    // Append images
    if (images.main_image) {
      formData.append('main_image', images.main_image);
    }
    if (images.image1) {
      formData.append('image1', images.image1);
    }
    if (images.image2) {
      formData.append('image2', images.image2);
    }
    if (images.image3) {
      formData.append('image3', images.image3);
    }

    try {
      if (id) {
        await vehicleAPI.updateVehicle(id, formData);
        toast.success('Vehicle updated successfully');
      } else {
        await vehicleAPI.addVehicle(formData);
        toast.success('Vehicle added successfully');
      }
      navigate('/owner/vehicles');
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error(error.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          {id ? 'Edit Vehicle' : 'Add New Vehicle'}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {id ? 'Update your vehicle details' : 'Fill in the details to list your vehicle'}
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.brand}>
                <InputLabel>Brand</InputLabel>
                <Select
                  {...register('brand')}
                  label="Brand"
                  defaultValue=""
                >
                  {VEHICLE_BRANDS.map((brand) => (
                    <MenuItem key={brand} value={brand}>{brand}</MenuItem>
                  ))}
                </Select>
                {errors.brand && (
                  <FormHelperText>{errors.brand.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                {...register('model')}
                error={!!errors.model}
                helperText={errors.model?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                {...register('year')}
                error={!!errors.year}
                helperText={errors.year?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Registration Number"
                {...register('registration_number')}
                error={!!errors.registration_number}
                helperText={errors.registration_number?.message}
                placeholder="e.g., BA 1 PA 1234"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.category}>
                <InputLabel id="category-label" shrink>Category</InputLabel>
                <Controller
                  name="category"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="category-label"
                      label="Category"
                      value={field.value ?? ''}
                      MenuProps={{ disableScrollLock: true }}
                      displayEmpty
                      renderValue={(v) => (v ? VEHICLE_CATEGORIES.find(c => c.value === v)?.label ?? v : 'Select')}
                    >
                      <MenuItem value="" disabled>
                        Select
                      </MenuItem>
                      {VEHICLE_CATEGORIES.map((cat) => (
                        <MenuItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.category && (
                  <FormHelperText>{errors.category.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Specifications */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Specifications
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.fuel_type}>
                <InputLabel>Fuel Type</InputLabel>
                <Select
                  {...register('fuel_type')}
                  label="Fuel Type"
                  defaultValue="petrol"
                >
                  {FUEL_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
                {errors.fuel_type && (
                  <FormHelperText>{errors.fuel_type.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.transmission}>
                <InputLabel>Transmission</InputLabel>
                <Select
                  {...register('transmission')}
                  label="Transmission"
                  defaultValue="manual"
                >
                  {TRANSMISSION_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                  ))}
                </Select>
                {errors.transmission && (
                  <FormHelperText>{errors.transmission.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Seating Capacity"
                type="number"
                {...register('seating_capacity')}
                error={!!errors.seating_capacity}
                helperText={errors.seating_capacity?.message}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mileage (km/l)"
                type="number"
                {...register('mileage')}
                error={!!errors.mileage}
                helperText={errors.mileage?.message}
              />
            </Grid>

            {/* Pricing */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Pricing Details
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price per Day (रू)"
                type="number"
                {...register('price_per_day')}
                error={!!errors.price_per_day}
                helperText={errors.price_per_day?.message}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>रू</Typography>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Security Deposit (रू)"
                type="number"
                {...register('security_deposit')}
                error={!!errors.security_deposit}
                helperText={errors.security_deposit?.message}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>रू</Typography>,
                }}
              />
            </Grid>

            {/* Location */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Location
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.city}>
                <InputLabel>City</InputLabel>
                <Select
                  {...register('city')}
                  label="City"
                  defaultValue=""
                >
                  {NEPAL_CITIES.map((city) => (
                    <MenuItem key={city} value={city}>{city}</MenuItem>
                  ))}
                </Select>
                {errors.city && (
                  <FormHelperText>{errors.city.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Area/Location"
                {...register('area')}
                error={!!errors.area}
                helperText={errors.area?.message}
                placeholder="e.g., Thamel, New Road"
              />
            </Grid>

            {/* Description and Features */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Description & Features
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
                placeholder="Describe your vehicle in detail..."
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Features (comma separated)"
                {...register('features')}
                error={!!errors.features}
                helperText={errors.features?.message}
                placeholder="e.g., AC, Bluetooth, Power Windows, ABS"
              />
            </Grid>

            {/* Images */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Vehicle Images
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Upload 1 to 4 images. First image is the main image. Add images one at a time or select multiple at once.
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Grid container spacing={2}>
                {/* Multi-file upload area - show when fewer than 4 images */}
                {Object.keys(previewUrls).length < MAX_IMAGES && (
                  <Grid item xs={6} sm={3}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="image-upload-multi"
                      type="file"
                      multiple
                      onChange={handleImageChange}
                    />
                    <label htmlFor="image-upload-multi">
                      <Box
                        component="span"
                        sx={{
                          border: '2px dashed #ccc',
                          borderRadius: 2,
                          p: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          minHeight: 150,
                          cursor: 'pointer',
                          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                        }}
                      >
                        <AddPhotoAlternate sx={{ fontSize: 40, color: '#ccc' }} />
                        <Typography variant="caption" sx={{ mt: 1 }}>
                          Add images (1–{MAX_IMAGES})
                        </Typography>
                      </Box>
                    </label>
                  </Grid>
                )}
                {/* Preview of uploaded images */}
                {IMAGE_FIELDS.map((field, index) =>
                  previewUrls[field] ? (
                    <Grid item xs={6} sm={3} key={field}>
                      <Box
                        sx={{
                          border: '2px dashed #ccc',
                          borderRadius: 2,
                          p: 1,
                          textAlign: 'center',
                          position: 'relative',
                          minHeight: 150,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <img
                          src={previewUrls[field]}
                          alt={`Vehicle ${index + 1}`}
                          style={{
                            width: '100%',
                            height: 120,
                            objectFit: 'cover',
                            borderRadius: 4,
                          }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          sx={{ position: 'absolute', top: 5, right: 5 }}
                          onClick={() => removeImage(field)}
                        >
                          <Delete />
                        </IconButton>
                        <Typography variant="caption" sx={{ mt: 0.5 }}>
                          {field === 'main_image' ? 'Main' : `Image ${index}`}
                        </Typography>
                      </Box>
                    </Grid>
                  ) : null
                )}
              </Grid>
            </Grid>

            {/* Submit Buttons */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/owner/vehicles')}
                  startIcon={<Cancel />}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : id ? 'Update Vehicle' : 'Add Vehicle'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default AddEditVehicle;