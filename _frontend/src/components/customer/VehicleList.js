import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Rating,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Slider,
  Chip,
  Pagination,
  Paper,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search,
  FilterList,
  DirectionsCar,
  LocalGasStation,
  Settings,
  People,
  LocationOn,
  Close,
} from '@mui/icons-material';
import { vehicleAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import { FUEL_TYPES, TRANSMISSION_TYPES, NEPAL_CITIES, DUMMY_VEHICLE_IMAGES, getImageUrl } from '../../utils/constants';

const VehicleList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [vehicles, setVehicles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [priceValue, setPriceValue] = useState([0, 10000]);
  const latestRequestRef = useRef(0);
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    city: '',
    min_price: '',
    max_price: '',
    fuel_type: '',
    transmission: '',
    seats: '',
    sort_by: '',
  });

  const priceRange = [0, 10000];

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [filters, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => {
        if (prev.search === searchInput) {
          return prev;
        }
        return { ...prev, search: searchInput };
      });
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchCategories = async () => {
    try {
      const response = await vehicleAPI.getCategories();
      const data = response.data;
      setCategories(Array.isArray(data) ? data : (data?.results ?? data?.data ?? []));
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchVehicles = async () => {
    const requestId = Date.now();
    latestRequestRef.current = requestId;
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: currentPage,
      };
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await vehicleAPI.getVehicles(params);
      if (latestRequestRef.current !== requestId) {
        return;
      }

      const payload = response.data;
      const results = Array.isArray(payload) ? payload : (payload?.results ?? []);
      const count = Array.isArray(payload) ? payload.length : (payload?.count ?? results.length);
      const pageSize = results.length > 0 ? results.length : 10;

      setVehicles(results);
      setTotalCount(count);
      setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      if (latestRequestRef.current === requestId) {
        setVehicles([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } finally {
      if (latestRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handlePriceChange = (event, newValue) => {
    setPriceValue(newValue);
  };

  const handlePriceChangeCommitted = (event, newValue) => {
    setFilters(prev => ({
      ...prev,
      min_price: newValue[0],
      max_price: newValue[1],
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    setPriceValue(priceRange);
    setFilters({
      search: '',
      category: '',
      city: '',
      min_price: '',
      max_price: '',
      fuel_type: '',
      transmission: '',
      seats: '',
      sort_by: '',
    });
    setCurrentPage(1);
  };

  const FilterContent = () => (
    <Box sx={{ p: 2, width: isMobile ? 'auto' : 280 }}>
      {isMobile && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Filters</Typography>
          <IconButton onClick={() => setMobileFilterOpen(false)}>
            <Close />
          </IconButton>
        </Box>
      )}
      
      <TextField
        fullWidth
        name="search"
        placeholder="Search vehicles..."
        value={searchInput}
        onChange={handleSearchChange}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Category</InputLabel>
        <Select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          label="Category"
        >
          <MenuItem value="">All Categories</MenuItem>
          {(Array.isArray(categories) ? categories : []).map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>City</InputLabel>
        <Select
          name="city"
          value={filters.city}
          onChange={handleFilterChange}
          label="City"
        >
          <MenuItem value="">All Cities</MenuItem>
          {NEPAL_CITIES.map((city) => (
            <MenuItem key={city} value={city}>{city}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography gutterBottom>Price Range (per day)</Typography>
      <Slider
        value={priceValue}
        onChange={handlePriceChange}
        onChangeCommitted={handlePriceChangeCommitted}
        valueLabelDisplay="auto"
        min={0}
        max={10000}
        step={500}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2">रू {priceValue[0]}</Typography>
        <Typography variant="body2">रू {priceValue[1]}</Typography>
      </Box>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Fuel Type</InputLabel>
        <Select
          name="fuel_type"
          value={filters.fuel_type}
          onChange={handleFilterChange}
          label="Fuel Type"
        >
          <MenuItem value="">All</MenuItem>
          {FUEL_TYPES.map((type) => (
            <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Transmission</InputLabel>
        <Select
          name="transmission"
          value={filters.transmission}
          onChange={handleFilterChange}
          label="Transmission"
        >
          <MenuItem value="">All</MenuItem>
          {TRANSMISSION_TYPES.map((type) => (
            <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        type="number"
        name="seats"
        label="Minimum Seats"
        value={filters.seats}
        onChange={handleFilterChange}
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Sort By</InputLabel>
        <Select
          name="sort_by"
          value={filters.sort_by}
          onChange={handleFilterChange}
          label="Sort By"
        >
          <MenuItem value="">Default</MenuItem>
          <MenuItem value="price_low">Price: Low to High</MenuItem>
          <MenuItem value="price_high">Price: High to Low</MenuItem>
          <MenuItem value="rating">Highest Rated</MenuItem>
          <MenuItem value="newest">Newest First</MenuItem>
        </Select>
      </FormControl>

      <Button
        fullWidth
        variant="outlined"
        onClick={clearFilters}
        sx={{ mt: 1 }}
      >
        Clear Filters
      </Button>
    </Box>
  );

  if (loading && vehicles.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Filter Sidebar - Desktop */}
        {!isMobile && (
          <Grid item md={3}>
            <Paper sx={{ position: 'sticky', top: 20 }}>
              <FilterContent />
            </Paper>
          </Grid>
        )}

        {/* Vehicle Grid */}
        <Grid item xs={12} md={9}>
          {/* Mobile Filter Button */}
          {isMobile && (
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setMobileFilterOpen(true)}
              sx={{ mb: 2 }}
            >
              Filters
            </Button>
          )}

          {/* Results Count */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Found {totalCount} vehicles
            </Typography>
          </Box>

          {/* Vehicle Grid */}
          <Grid container spacing={3}>
            {vehicles.map((vehicle) => (
              <Grid item xs={12} sm={6} lg={4} key={vehicle.id}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(`/customer/vehicles/${vehicle.id}`)}
                >
                  <CardMedia
                    component="img"
                    height="180"
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

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.city}
                      </Typography>
                    </Box>

                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Chip
                          icon={<LocalGasStation />}
                          label={vehicle.fuel_type}
                          size="small"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip
                          icon={<Settings />}
                          label={vehicle.transmission}
                          size="small"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip
                          icon={<People />}
                          label={`${vehicle.seating_capacity} seats`}
                          size="small"
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" color="primary">
                        रू {vehicle.price_per_day?.toLocaleString()}
                        <Typography component="span" variant="body2" color="text.secondary">
                          /day
                        </Typography>
                      </Typography>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customer/book/${vehicle.id}`);
                        }}
                      >
                        Book Now
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {!loading && vehicles.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                No vehicles found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Try changing search text or clearing some filters.
              </Typography>
              <Button variant="outlined" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Paper>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="left"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
      >
        <FilterContent />
      </Drawer>
    </Container>
  );
};

export default VehicleList;