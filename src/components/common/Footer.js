import React from 'react';
import { Box, Container, Typography, Link as MuiLink, Grid, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Facebook, Twitter, Instagram, YouTube } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[200],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              SawariSewa
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your trusted vehicle rental platform in Nepal. Rent cars, bikes, and more with ease.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Quick Links
            </Typography>
            <MuiLink component={RouterLink} to="/about" color="inherit" display="block">About Us</MuiLink>
            <MuiLink component={RouterLink} to="/contact" color="inherit" display="block">Contact</MuiLink>
            <MuiLink component={RouterLink} to="/terms" color="inherit" display="block">Terms & Conditions</MuiLink>
            <MuiLink component={RouterLink} to="/privacy" color="inherit" display="block">Privacy Policy</MuiLink>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Follow Us
            </Typography>
            <Box>
              <IconButton color="primary" aria-label="Facebook">
                <Facebook />
              </IconButton>
              <IconButton color="primary" aria-label="Twitter">
                <Twitter />
              </IconButton>
              <IconButton color="primary" aria-label="Instagram">
                <Instagram />
              </IconButton>
              <IconButton color="primary" aria-label="YouTube">
                <YouTube />
              </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              © {new Date().getFullYear()} SawariSewa. All rights reserved.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Footer;