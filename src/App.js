import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';

// Customer Components
import CustomerDashboard from './components/customer/CustomerDashboard';
import VehicleList from './components/customer/VehicleList';
import VehicleDetail from './components/customer/VehicleDetail';
import BookingForm from './components/customer/BookingForm';
import MyBookings from './components/customer/MyBookings';
import BookingDetail from './components/customer/BookingDetail';
import BookingHistory from './components/customer/BookingHistory';
import CustomerProfile from './components/customer/CustmerProfile';
import Payment from './components/customer/Payment';
import KhaltiTestPage from './components/customer/KhaltiTestPage';

// Owner Components
import OwnerDashboard from './components/owner/OwnerDashboard';
import VehicleManagement from './components/owner/VehicleManagement';
import AddEditVehicle from './components/owner/AddEditVehicle';
import BookingRequests from './components/owner/BookingRequests';
import Earnings from './components/owner/Earnings';
import OwnerProfile from './components/owner/OwnerProfile';
import ReviewReplies from './components/owner/ReviewReplies';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Static Pages
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function AppContent() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Static Pages (public) */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        
        {/* Customer Routes */}
        <Route path="/customer/dashboard" element={
          <PrivateRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </PrivateRoute>
        } />
        <Route path="/customer/vehicles" element={
          <PrivateRoute allowedRoles={['customer']}>
            <VehicleList />
          </PrivateRoute>
        } />
        <Route path="/customer/vehicles/:id" element={
          <PrivateRoute allowedRoles={['customer']}>
            <VehicleDetail />
          </PrivateRoute>
        } />
        <Route path="/customer/book/:id" element={
          <PrivateRoute allowedRoles={['customer']}>
            <BookingForm />
          </PrivateRoute>
        } />
        <Route path="/customer/my-bookings" element={
          <PrivateRoute allowedRoles={['customer']}>
            <MyBookings />
          </PrivateRoute>
        } />
        <Route path="/customer/booking-detail/:id" element={
          <PrivateRoute allowedRoles={['customer']}>
            <BookingDetail />
          </PrivateRoute>
        } />
        <Route path="/customer/booking-history" element={
          <PrivateRoute allowedRoles={['customer']}>
            <BookingHistory />
          </PrivateRoute>
        } />
        <Route path="/customer/payment/:bookingId" element={
          <PrivateRoute allowedRoles={['customer']}>
            <Payment />
          </PrivateRoute>
        } />
        <Route path="/customer/khalti-test" element={
          <PrivateRoute allowedRoles={['customer']}>
            <KhaltiTestPage />
          </PrivateRoute>
        } />
        <Route path="/customer/profile" element={
          <PrivateRoute allowedRoles={['customer']}>
            <CustomerProfile />
          </PrivateRoute>
        } />
        
        {/* Owner Routes */}
        <Route path="/owner/dashboard" element={
          <PrivateRoute allowedRoles={['owner']}>
            <OwnerDashboard />
          </PrivateRoute>
        } />
        <Route path="/owner/vehicles" element={
          <PrivateRoute allowedRoles={['owner']}>
            <VehicleManagement />
          </PrivateRoute>
        } />
        <Route path="/owner/vehicles/add" element={
          <PrivateRoute allowedRoles={['owner']}>
            <AddEditVehicle />
          </PrivateRoute>
        } />
        <Route path="/owner/vehicles/edit/:id" element={
          <PrivateRoute allowedRoles={['owner']}>
            <AddEditVehicle />
          </PrivateRoute>
        } />
        <Route path="/owner/bookings" element={
          <PrivateRoute allowedRoles={['owner']}>
            <BookingRequests />
          </PrivateRoute>
        } />
        <Route path="/owner/earnings" element={
          <PrivateRoute allowedRoles={['owner']}>
            <Earnings />
          </PrivateRoute>
        } />
        <Route path="/owner/reviews" element={
          <PrivateRoute allowedRoles={['owner']}>
            <ReviewReplies />
          </PrivateRoute>
        } />
        <Route path="/owner/profile" element={
          <PrivateRoute allowedRoles={['owner']}>
            <OwnerProfile />
          </PrivateRoute>
        } />
        
        {/* Default Redirect */}
        <Route path="/" element={
          user ? (
            user.profile?.user_type === 'owner' ? 
            <Navigate to="/owner/dashboard" /> : 
            <Navigate to="/customer/dashboard" />
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppContent />
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;