import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      localStorage.removeItem('token');
      toast.error('Session expired. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      const { key } = response.data;
      localStorage.setItem('token', key);
      await fetchUserProfile();
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.non_field_errors?.[0] || 'Login failed';
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: error.response?.data };
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      toast.success('Registration successful! Please login.');
      return { success: true, data: response.data };
    } catch (err) {
      const data = err.response?.data;
      let errorMsg = 'Registration failed. Please try again.';
      if (data) {
        if (typeof data === 'string') errorMsg = data;
        else if (data.detail) errorMsg = data.detail;
        else if (data.non_field_errors?.[0]) errorMsg = data.non_field_errors[0];
        else if (typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          const firstVal = data[firstKey];
          errorMsg = Array.isArray(firstVal) ? firstVal[0] : (firstVal || errorMsg);
        }
      }
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, error: data };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      toast.info('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      setUser(response.data);
      toast.success('Profile updated successfully!');
      return { success: true, data: response.data };
    } catch (error) {
      toast.error('Failed to update profile');
      return { success: false, error: error.response?.data };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isCustomer: user?.profile?.user_type === 'customer',
    isOwner: user?.profile?.user_type === 'owner',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};