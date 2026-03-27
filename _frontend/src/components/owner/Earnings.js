import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  CalendarToday,
  Download,
  Receipt,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { earningsAPI } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Earnings = () => {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchEarnings();
  }, [dateRange, startDate, endDate]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const [earningsRes, summaryRes] = await Promise.all([
        earningsAPI.getEarnings(),
        earningsAPI.getEarningSummary(),
      ]);
      setEarnings(earningsRes.data.results || earningsRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const total = earnings.reduce((sum, earning) => sum + parseFloat(earning.amount), 0);
    const commission = earnings.reduce((sum, earning) => sum + parseFloat(earning.commission), 0);
    const net = earnings.reduce((sum, earning) => sum + parseFloat(earning.net_amount), 0);
    return { total, commission, net };
  };

  const totals = calculateTotals();

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Earnings',
        data: [12000, 19000, 15000, 25000, 22000, 30000, 28000, 35000, 32000, 38000, 42000, 45000],
        backgroundColor: 'rgba(25, 118, 210, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'रू ' + value.toLocaleString();
          }
        }
      }
    },
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Earnings Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your earnings and commissions
        </Typography>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Earnings
                  </Typography>
                  <Typography variant="h4" color="primary">
                    रू {totals.total.toLocaleString()}
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Commission (10%)
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    रू {totals.commission.toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 48, color: 'warning.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Net Earnings
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    रू {totals.net.toLocaleString()}
                  </Typography>
                </Box>
                <Receipt sx={{ fontSize: 48, color: 'success.main', opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chart */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Earnings Chart
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={dateRange}
                label="Period"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="quarter">This Quarter</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
            
            {dateRange === 'custom' && (
              <>
                <TextField
                  size="small"
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </>
            )}
            
            <IconButton color="primary">
              <Download />
            </IconButton>
          </Box>
        </Box>
        <Bar data={chartData} options={chartOptions} height={80} />
      </Paper>

      {/* Earnings Table */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Transaction History
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Booking ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Commission</TableCell>
                <TableCell align="right">Net Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {earnings.length > 0 ? (
                earnings.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell>
                      {new Date(earning.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>#{earning.booking_details?.id}</TableCell>
                    <TableCell>{earning.booking_details?.customer}</TableCell>
                    <TableCell>{earning.booking_details?.vehicle}</TableCell>
                    <TableCell align="right">रू {parseFloat(earning.amount).toLocaleString()}</TableCell>
                    <TableCell align="right">रू {parseFloat(earning.commission).toLocaleString()}</TableCell>
                    <TableCell align="right">रू {parseFloat(earning.net_amount).toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={earning.is_paid ? 'Paid' : 'Pending'}
                        color={earning.is_paid ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No earnings records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default Earnings;