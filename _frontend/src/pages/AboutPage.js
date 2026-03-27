import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';

const AboutPage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" color="primary" gutterBottom fontWeight={600}>
        About Us
      </Typography>
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="body1" paragraph>
          <strong>SawariSewa</strong> is a vehicle rental platform that connects vehicle owners with customers across Nepal. We make it easy to rent cars, bikes, and other vehicles for daily use, trips, and special occasions.
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          Our Mission
        </Typography>
        <Typography variant="body1" paragraph>
          To provide a trusted, convenient, and transparent way for people to rent vehicles and for owners to earn from their assets—all through a single, easy-to-use platform.
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          What We Offer
        </Typography>
        <Typography variant="body1" component="div">
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            <li><strong>For customers:</strong> Browse and book vehicles by category, location, and price. Secure payments and clear booking terms.</li>
            <li><strong>For owners:</strong> List your vehicles, manage bookings, and receive payments with clear earnings and support.</li>
          </ul>
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          Why Choose SawariSewa?
        </Typography>
        <Typography variant="body1" component="div">
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            <li>Wide range of vehicles and categories</li>
            <li>Secure payment via Khalti and other methods</li>
            <li>Transparent pricing and booking process</li>
            <li>Support for both Nepali and English</li>
          </ul>
        </Typography>

        <Typography variant="body1" paragraph sx={{ mt: 3 }}>
          We are committed to improving how vehicle rental works in Nepal. If you have questions or suggestions, please contact us.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AboutPage;
