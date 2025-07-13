import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from '../axios';
import toast from 'react-hot-toast';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8001';

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGIN_FAIL':
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'USER_LOADED':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user
  const loadUser = useCallback(async () => {
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data.success && res.data.user) {
        // Ensure hasProfilePicture is included in user data
        const userData = {
          ...res.data.user,
          hasProfilePicture: res.data.user.hasProfilePicture || false
        };
        dispatch({
          type: 'USER_LOADED',
          payload: userData,
        });
      } else {
        dispatch({ type: 'AUTH_ERROR' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR' });
    }
  }, []);

  // Send registration OTP
  const sendRegistrationOTP = async (formData) => {
    try {
      const res = await axios.post('/api/auth/send-registration-otp', formData);
      toast.success('OTP sent to your email address!');
      return { success: true, email: res.data.email };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Verify registration OTP
  const verifyRegistrationOTP = async (email, otp) => {
    try {
      const res = await axios.post('/api/auth/verify-registration-otp', { email, otp });
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data,
      });
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Resend registration OTP
  const resendRegistrationOTP = async (email) => {
    try {
      await axios.post('/api/auth/resend-registration-otp', { email });
      toast.success('New OTP sent to your email address!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Register user (legacy method - now redirects to OTP flow)
  const register = async (formData) => {
    try {
      const res = await axios.post('/api/auth/register', formData);
      if (res.data.requiresOTP) {
        // Redirect to OTP flow
        return { success: false, requiresOTP: true, message: res.data.message };
      }
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data,
      });
      toast.success('Registration successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      dispatch({ type: 'LOGIN_FAIL' });
      return { success: false, message };
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const res = await axios.post('/api/auth/login', formData);
      // Ensure hasProfilePicture is included in user data
      const userData = {
        ...res.data.user,
        hasProfilePicture: res.data.user.hasProfilePicture || false
      };
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { ...res.data, user: userData },
      });
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      dispatch({ type: 'LOGIN_FAIL' });
      return { success: false, message };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {}
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await axios.post('/api/auth/forgot-password', { email });
      toast.success('Password reset email sent!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      const res = await axios.put(`/api/auth/reset-password/${token}`, { password });
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data,
      });
      toast.success('Password reset successful!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password reset failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Update user profile
  const updateProfile = async (formData) => {
    try {
      const res = await axios.put('/api/users/profile', formData);
      // Ensure hasProfilePicture is preserved
      const userData = {
        ...res.data,
        hasProfilePicture: res.data.hasProfilePicture || state.user?.hasProfilePicture || false
      };
      dispatch({
        type: 'UPDATE_USER',
        payload: userData,
      });
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      
      // If there are validation errors, show them
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.param}: ${err.msg}`);
        });
      }
      return { success: false, message };
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async (file) => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const res = await axios.post('/api/users/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Ensure hasProfilePicture is set to true after upload
      const userData = {
        ...res.data.user,
        hasProfilePicture: true
      };

      dispatch({
        type: 'UPDATE_USER',
        payload: userData,
      });
      toast.success('Profile picture uploaded successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile picture upload failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Delete profile picture
  const deleteProfilePicture = async () => {
    try {
      const res = await axios.delete('/api/users/profile-picture');
      // Ensure hasProfilePicture is set to false after deletion
      const userData = {
        ...res.data.user,
        hasProfilePicture: false
      };

      dispatch({
        type: 'UPDATE_USER',
        payload: userData,
      });
      toast.success('Profile picture deleted successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile picture deletion failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Get profile picture URL
  const getProfilePictureUrl = (userId) => {
    const timestamp = Date.now(); // Cache busting
    return `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001'}/api/users/profile-picture/${userId}?t=${timestamp}`;
  };

  // Send account deletion OTP
  const sendDeleteAccountOTP = async () => {
    try {
      const res = await axios.post('/api/auth/send-delete-account-otp');
      toast.success('OTP sent to your email address!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Verify account deletion OTP
  const verifyDeleteAccountOTP = async (otp) => {
    try {
      const res = await axios.post('/api/auth/verify-delete-account-otp', { otp });
      dispatch({ type: 'LOGOUT' });
      toast.success('Account deleted successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Resend account deletion OTP
  const resendDeleteAccountOTP = async () => {
    try {
      const res = await axios.post('/api/auth/resend-delete-account-otp');
      toast.success('New OTP sent to your email address!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      toast.error(message);
      return { success: false, message };
    }
  };

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        logout,
        loadUser,
        forgotPassword,
        resetPassword,
        updateProfile,
        sendRegistrationOTP,
        verifyRegistrationOTP,
        resendRegistrationOTP,
        uploadProfilePicture,
        deleteProfilePicture,
        getProfilePictureUrl,
        sendDeleteAccountOTP,
        verifyDeleteAccountOTP,
        resendDeleteAccountOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 