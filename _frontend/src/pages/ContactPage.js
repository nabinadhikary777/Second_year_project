import React from 'react';
import { Container, Typography, Paper, Box, Link } from '@mui/material';
import { Email, Phone, LocationOn } from '@mui/icons-material';

const ContactPage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" color="primary" gutterBottom fontWeight={600}>
        Contact Us
      </Typography>
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="body1" paragraph>
          We'd love to hear from you. Use the details below to get in touch.
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          General Enquiries
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Email fontSize="small" color="action" />
          <Link href="mailto:support@sawarisewa.com" color="primary">
            support@sawarisewa.com
          </Link>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Phone fontSize="small" color="action" />
          <Typography variant="body1">+977-1-XXXXXXX</Typography>
        </Box>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          Business &amp; Partnerships
        </Typography>
        <Typography variant="body1" paragraph>
          For partnership or business inquiries, email us at{' '}
          <Link href="mailto:business@sawarisewa.com" color="primary">
            business@sawarisewa.com
          </Link>
          .
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          Office Address
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <LocationOn fontSize="small" color="action" sx={{ mt: 0.5 }} />
          <Typography variant="body1">
            SawariSewa<br />
            Kathmandu, Nepal
          </Typography>
        </Box>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          Response Time
        </Typography>
        <Typography variant="body1" paragraph>
          We aim to respond to all messages within 1–2 business days.
        </Typography>
      </Paper>
    </Container>
  );
};

export default ContactPage;
