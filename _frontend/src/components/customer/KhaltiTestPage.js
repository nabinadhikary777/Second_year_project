import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { Payment as PaymentIcon, Science } from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import { toast } from 'react-toastify';

/**
 * Khalti Test Transaction Page (ePayment flow)
 * Uses backend-initiated payment - no Khalti script/iframe required.
 * Test credentials: Khalti ID 9800000000-9800000005, MPIN 1111, OTP 987654
 */
const KhaltiTestPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const pidx = searchParams.get('pidx');
  const status = searchParams.get('status');

  // Handle callback from Khalti redirect
  useEffect(() => {
    if (pidx && !lastResult && !verifying) {
      setVerifying(true);
      bookingAPI
        .verifyKhaltiTestPayment({ pidx })
        .then((response) => {
          setLastResult(response.data);
          if (response.data.success) {
            toast.success('Test transaction verified successfully!');
          } else {
            toast.warning('Payment status: ' + (response.data.status || 'Unknown'));
          }
        })
        .catch((error) => {
          const errMsg = error.response?.data?.error || error.message;
          setLastResult({ success: false, error: errMsg });
          toast.error('Verification failed: ' + errMsg);
        })
        .finally(() => setVerifying(false));
    }
  }, [pidx]);

  const runTestTransaction = async () => {
    setProcessing(true);
    setLastResult(null);

    try {
      const response = await bookingAPI.initiateKhaltiTestPayment();
      const { payment_url } = response.data;

      if (payment_url) {
        window.location.href = payment_url;
      } else {
        const errMsg = response.data?.detail || response.data?.error || 'Failed to get payment URL';
        toast.error(errMsg);
        setProcessing(false);
      }
    } catch (error) {
      const errMsg = error.response?.data?.error || error.response?.data?.detail || error.message;
      toast.error('Failed to initiate: ' + (typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)));
      setProcessing(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Science color="primary" />
          <Typography variant="h5" component="h1">
            Khalti Test Transaction
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Run a test payment of <strong>Rs 10</strong> (Khalti minimum) to verify integration.
          <br />
          <strong>Test credentials:</strong> Khalti ID 9800000000–9800000005, MPIN: 1111, OTP: 987654
        </Alert>

        {verifying ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Verifying payment...</Typography>
          </Box>
        ) : pidx && lastResult ? (
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Verification result
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: 12,
                }}
              >
                {JSON.stringify(lastResult, null, 2)}
              </Box>
              <Button
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => {
                  setLastResult(null);
                  navigate('/customer/khalti-test');
                }}
              >
                Run another test
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={runTestTransaction}
              disabled={processing}
              startIcon={
                processing ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <PaymentIcon />
                )
              }
              sx={{ py: 2, mb: 3 }}
            >
              {processing ? 'Redirecting to Khalti...' : 'Run Test Transaction (Rs 10)'}
            </Button>

            {lastResult && !pidx && (
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Last verification result
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      p: 2,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      overflow: 'auto',
                      fontSize: 12,
                    }}
                  >
                    {JSON.stringify(lastResult, null, 2)}
                  </Box>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default KhaltiTestPage;
