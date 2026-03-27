import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const TermsPage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" color="primary" gutterBottom fontWeight={600}>
        Terms &amp; Conditions
      </Typography>
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="body1" paragraph>
          Welcome to SawariSewa. By using our platform, you agree to these Terms and Conditions. Please read them carefully.
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          1. Acceptance of Terms
        </Typography>
        <Typography variant="body1" paragraph>
          By registering, browsing, or using SawariSewa (the "Platform"), you agree to be bound by these Terms and our Privacy Policy. If you do not agree, please do not use the Platform.
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          2. Use of the Platform
        </Typography>
        <Typography variant="body1" component="div">
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            <li>You must be at least 18 years old and legally able to enter into contracts to use the Platform.</li>
            <li>You are responsible for keeping your account credentials secure and for all activity under your account.</li>
            <li>You must provide accurate information when registering and listing or booking vehicles.</li>
          </ul>
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          3. For Vehicle Owners
        </Typography>
        <Typography variant="body1" component="div">
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            <li>You must have the legal right to list and rent out the vehicle.</li>
            <li>Vehicles must be in roadworthy condition and comply with local laws.</li>
            <li>You agree to our commission and payment terms as displayed on the Platform.</li>
          </ul>
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          4. For Customers
        </Typography>
        <Typography variant="body1" component="div">
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            <li>You must hold a valid driving license where required for the vehicle you rent.</li>
            <li>You are responsible for the vehicle during the rental period and must return it in the agreed condition.</li>
            <li>Payment is due as per the booking and our payment policy.</li>
          </ul>
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          5. Bookings and Cancellations
        </Typography>
        <Typography variant="body1" paragraph>
          Cancellation and refund rules are shown at the time of booking. Cancelling may incur fees as stated in those rules.
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          6. Limitation of Liability
        </Typography>
        <Typography variant="body1" paragraph>
          SawariSewa acts as a platform connecting owners and customers. We are not liable for disputes between users, vehicle condition, or incidents during rental beyond what is required by law.
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          7. Changes to Terms
        </Typography>
        <Typography variant="body1" paragraph>
          We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the updated Terms.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>
      </Paper>
    </Container>
  );
};

export default TermsPage;
