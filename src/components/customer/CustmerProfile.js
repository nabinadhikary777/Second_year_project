import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Edit,
  PhotoCamera,
  Save,
  Cancel,
  Person,
  Email,
  Phone,
  LocationOn,
  LocationCity,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import { MEDIA_BASE_URL } from '../../utils/constants';

const CustomerProfile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    city: '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const getProfileImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${MEDIA_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  };

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.profile?.phone_number || '',
        address: user.profile?.address || '',
        city: user.profile?.city || '',
      });
      setPreviewUrl(getProfileImageUrl(user.profile?.profile_picture));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.keys(profileData).forEach(key => {
      if (profileData[key]) {
        formData.append(key, profileData[key]);
      }
    });
    
    if (profilePicture) {
      formData.append('profile_picture', profilePicture);
    }

    const result = await updateProfile(formData);
    if (result.success) {
      setEditMode(false);
      setProfilePicture(null);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    setEditMode(false);
    setProfilePicture(null);
    setPreviewUrl(getProfileImageUrl(user.profile?.profile_picture));
    setProfileData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.profile?.phone_number || '',
      address: user.profile?.address || '',
      city: user.profile?.city || '',
    });
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 3,
          backgroundColor: (theme) => theme.palette.background.paper,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            mb: 4,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4">My Profile</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your personal information and account details.
            </Typography>
          </Box>
          {!editMode && (
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => setEditMode(true)}
              sx={{ minWidth: 140 }}
            >
              Edit Profile
            </Button>
          )}
        </Box>

        <Grid container spacing={4}>
          {/* Profile Picture Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={previewUrl}
                sx={{ width: 120, height: 120, mb: 2 }}
              >
                {user.username?.charAt(0).toUpperCase()}
              </Avatar>
              
              {editMode && (
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCamera />}
                  size="small"
                  sx={{ mt: 1 }}
                >
                  Upload Photo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
              )}
              
              <Card
                sx={{
                  width: '100%',
                  mt: 3,
                  borderRadius: 2,
                  backgroundColor: (theme) => theme.palette.grey[50],
                }}
                variant="outlined"
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Account Type
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {user.profile?.user_type}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Member Since
                  </Typography>
                  <Typography variant="body2">
                    {new Date(user.profile?.date_joined).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Profile Details Section */}
          <Grid item xs={12} md={8}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Person sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleInputChange}
                    disabled={!editMode}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Email sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone_number"
                    value={profileData.phone_number}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Phone sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    multiline
                    rows={2}
                    value={profileData.address}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={profileData.city}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <LocationCity sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />
                </Grid>

                {editMode && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        onClick={handleCancel}
                        startIcon={<Cancel />}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </form>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default CustomerProfile;