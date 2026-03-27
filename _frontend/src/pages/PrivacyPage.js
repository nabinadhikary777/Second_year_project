import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const PrivacyPage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" color="primary" gutterBottom fontWeight={600}>
        Privacy Policy
      </Typography>
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="body1" paragraph>
          SawariSewa ("we", "our") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our platform.
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          1. Information We Collect
        </Typography>
        <Typography variant="body1" component="div">
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            <li><strong>Account information:</strong> Name, email, phone number, address, and profile details you provide when registering.</li>
            <li><strong>Vehicle and booking data:</strong> Details of vehicles listed, bookings made, and payment-related information.</li>
            <li><strong>Usage data:</strong> How you use the platform (e.g. pages visited, actions taken) to improve our services.</li>
          </ul>
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          2. How We Use Your Information
        </Typography>
        <Typography variant="body1" component="div">
          <ul style={{ marginTop: 0, paddingLeft: 20 }}>
            <li>Provide and operate the vehicle rental platform</li>
            <li>Process bookings and payments</li>
            <li>Communicate with you about your account, bookings, and updates</li>
            <li>Improve our services and user experience</li>
            <li>Comply with legal obligations and enforce our Terms &amp; Conditions</li>
          </ul>
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          3. Sharing of Information
        </Typography>
        <Typography variant="body1" paragraph>
          We may share your information with other users (as needed to complete bookings), payment providers such as Khalti, and legal authorities when required by law. We do not sell your personal information to third parties.
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          4. Data Security
        </Typography>
        <Typography variant="body1" paragraph>
          We use appropriate technical and organizational measures to protect your data. Passwords are stored in an encrypted form, and we follow industry practices for securing our systems.
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          5. Your Rights
        </Typography>
        <Typography variant="body1" paragraph>
          You may access and update your profile, request a copy of your personal data, and ask us to correct or delete your data (subject to legal and operational requirements). To exercise these rights, please contact us.
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          6. Cookies and Similar Technologies
        </Typography>
        <Typography variant="body1" paragraph>
          We may use cookies and similar technologies for authentication, preferences, and analytics. You can adjust your browser settings to manage cookies.
        </Typography>

        <Typography variant="h6" color="primary" gutterBottom sx={{ mt: 3 }}>
          7. Changes to This Policy
        </Typography>
        <Typography variant="body1" paragraph>
          We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on the platform.
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Typography>
      </Paper>
    </Container>
  );
};

export default PrivacyPage;
