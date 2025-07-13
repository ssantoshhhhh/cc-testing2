import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { FiUser, FiEdit2, FiSave, FiX, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { useQuery } from 'react-query';
import axios from '../axios'; // use the custom axios instance
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import useOrderNotifications from '../hooks/useOrderNotifications';
import ProfilePictureUpload from '../components/ProfilePictureUpload';

const Profile = () => {
  const { user, updateProfile, getProfilePictureUrl, sendDeleteAccountOTP, verifyDeleteAccountOTP, resendDeleteAccountOTP } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1: confirm, 2: OTP
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deleteOtpError, setDeleteOtpError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const previousOrdersRef = useRef([]);
  const navigate = useNavigate();
  
  const {
    confirmedAudioRef,
    rejectedAudioRef,
    playOrderStatusSound
  } = useOrderNotifications();

  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Fetch all user orders for real-time stats
  const { data: ordersData, isLoading: ordersLoading } = useQuery(
    ['userOrdersProfile'],
    async () => {
      const response = await axios.get('/api/users/orders?limit=1000');
      return response.data;
    },
    {
      retry: 2,
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 0, // Consider data stale immediately
    }
  );

  // Check for order status changes and play sounds
  useEffect(() => {
    if (ordersData?.data && previousOrdersRef.current.length > 0) {
      const currentOrders = ordersData.data;
      const previousOrders = previousOrdersRef.current;

      currentOrders.forEach(currentOrder => {
        const previousOrder = previousOrders.find(prev => prev._id === currentOrder._id);
        if (previousOrder && previousOrder.status !== currentOrder.status) {
          playOrderStatusSound(currentOrder.status, previousOrder.status);
        }
      });
    }
    
    if (ordersData?.data) {
      previousOrdersRef.current = ordersData.data;
    }
  }, [ordersData, playOrderStatusSound]);

  const orders = ordersData?.data || [];

  // Calculate stats from orders
  const nonCancelledOrders = orders.filter(order => order.status !== 'cancelled');
  const totalOrders = nonCancelledOrders.length;
  const totalSpent = nonCancelledOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const activeRentals = orders.filter(
    (order) => ['confirmed', 'rented'].includes(order.status)
  ).length;
  const overdueRentals = orders.filter(
    (order) => ['confirmed', 'rented'].includes(order.status) && new Date() > new Date(order.expectedReturnDate)
  ).length;
  const totalPenalty = orders.reduce((sum, order) => sum + (order.penaltyAmount || 0), 0);
  const userCancelledOrders = orders.filter(order => order.status === 'cancelled' && order.cancelledBy === 'user').length;
  const adminCancelledOrders = orders.filter(order => order.status === 'cancelled' && order.cancelledBy === 'admin').length;

  // For recent orders, show the 5 most recent
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
    },
  });

  const handleUpdateProfile = async (data) => {
    setIsLoading(true);
    try {
      const result = await updateProfile(data);
      if (result.success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
  };

  const handleProfilePictureUpload = () => {
    // Refresh user data after upload
    // The AuthContext will automatically update the user state
  };

  // Get profile picture URL
  const profilePictureUrl = user?.hasProfilePicture ? getProfilePictureUrl(user.id) : null;

  // Handle profile picture click
  const handleProfilePictureClick = () => {
    if (profilePictureUrl) {
      setShowProfileModal(true);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowProfileModal(false);
  };

  // Handle modal backdrop click
  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowProfileModal(false);
    }
  };

  // Account deletion handlers
  const handleDeleteAccountClick = () => {
    setShowDeleteModal(true);
    setDeleteStep(1);
    setDeleteOtp('');
    setDeleteOtpError('');
  };

  const handleDeleteAccountConfirm = async () => {
    setIsLoading(true);
    try {
      const result = await sendDeleteAccountOTP();
      if (result.success) {
        setDeleteStep(2);
        setResendDisabled(true);
        setCountdown(60); // 60 seconds countdown
      }
    } catch (error) {
      console.error('Delete account error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOtpSubmit = async (e) => {
    e.preventDefault();
    if (!deleteOtp || deleteOtp.length !== 6) {
      setDeleteOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setDeleteOtpError('');

    try {
      const result = await verifyDeleteAccountOTP(deleteOtp);
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      console.error('Delete OTP verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendDeleteOtp = async () => {
    setIsLoading(true);
    try {
      const result = await resendDeleteAccountOTP();
      if (result.success) {
        setResendDisabled(true);
        setCountdown(60);
      }
    } catch (error) {
      console.error('Resend delete OTP error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep(1);
    setDeleteOtp('');
    setDeleteOtpError('');
    setResendDisabled(false);
    setCountdown(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">

      {/* Audio elements for notifications */}
      <audio ref={confirmedAudioRef} src="/confimed.mp3" preload="auto" />
      <audio ref={rejectedAudioRef} src="/rejected.mp3" preload="auto" />
      
      {/* Profile Picture Modal */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={handleModalBackdropClick}
        >
          <div className="relative max-w-2xl max-h-full mx-4">
            <button
              onClick={handleCloseModal}
              className="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors duration-200 z-10"
            >
              <FiX className="w-5 h-5 text-gray-600" />
            </button>
            <img
              src={profilePictureUrl}
              alt="Profile"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 px-6 py-8">
            <div className="flex items-center space-x-4">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer hover:opacity-90 transition-opacity duration-200"
                  onClick={handleProfilePictureClick}
                  title="Click to view larger"
                />
              ) : (
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <FiUser className="w-8 h-8 text-green-600" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                <p className="text-green-100">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FiEdit2 className="mr-2 h-4 w-4" />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Profile Picture Section - Only show when editing */}
            {isEditing && (
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h3>
                <ProfilePictureUpload onUploadSuccess={handleProfilePictureUpload} />
              </div>
            )}

            <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register('name', { required: 'Name is required' })}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing ? 'bg-gray-50' : ''} ${
                        errors.name ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing ? 'bg-gray-50' : ''} ${
                        errors.email ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      {...register('phone', {
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: 'Please enter a valid 10-digit phone number',
                        },
                      })}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing ? 'bg-gray-50' : ''} ${
                        errors.phone ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campus Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register('address')}
                      disabled={!isEditing}
                      className={`input-field ${!isEditing ? 'bg-gray-50' : ''} ${
                        errors.address ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <FiSave className="mr-2 h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FiX className="mr-2 h-4 w-4" />
                    Cancel
                  </button>
                </div>
              )}
            </form>

            {/* Account Stats */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h3>
              {ordersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">📦</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Total Orders</p>
                        <p className="text-2xl font-semibold text-green-600">
                          {totalOrders}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">🔄</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Active Rentals</p>
                        <p className="text-2xl font-semibold text-blue-600">
                          {activeRentals}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">₹</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Total Spent</p>
                        <p className="text-2xl font-semibold text-orange-600">
                          ₹{totalSpent}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">📅</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Member Since</p>
                        <p className="text-lg font-semibold text-purple-600">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Statistics */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">⚠️</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Overdue Rentals</p>
                        <p className="text-2xl font-semibold text-red-600">
                          {overdueRentals}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">💰</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Total Penalties</p>
                        <p className="text-2xl font-semibold text-yellow-600">
                          ₹{totalPenalty}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User Cancelled Orders */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">🙋‍♂️</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">User Cancelled Orders</p>
                        <p className="text-2xl font-semibold text-gray-600">
                          {userCancelledOrders}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Admin Cancelled Orders */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">🛑</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">Admin Cancelled Orders</p>
                        <p className="text-2xl font-semibold text-gray-800">
                          {adminCancelledOrders}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Recent Orders Section */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <Link
                  to="/orders"
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  View All Orders
                </Link>
              </div>
              {recentOrders && recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            Order #{order._id.slice(-8).toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()} • ₹{order.totalAmount}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          order.status === 'returned' ? 'bg-gray-100 text-gray-800' :
                          order.status === 'rented' ? 'bg-green-100 text-green-800' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">No recent orders</p>
              )}
            </div>

            {/* Account Deletion Section */}
            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <FiAlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
                    <p className="mt-1 text-sm text-red-700">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <div className="mt-4">
                      <button
                        onClick={handleDeleteAccountClick}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FiTrash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={handleCloseDeleteModal}
        >
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {deleteStep === 1 ? (
              // Confirmation Step
              <div>
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <FiAlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete your account? This action cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-medium text-red-900 mb-2">What will be deleted:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Your profile information</li>
                    <li>• All your order history</li>
                    <li>• Your account settings</li>
                    <li>• All associated data</li>
                  </ul>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteAccountConfirm}
                    disabled={isLoading}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="spinner mr-2"></div>
                        Sending OTP...
                      </div>
                    ) : (
                      <>
                        <FiTrash2 className="mr-2 h-4 w-4" />
                        Continue
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCloseDeleteModal}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // OTP Step
              <div>
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <FiAlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">Verify Deletion</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  We've sent a 6-digit OTP to <strong>{user?.email}</strong>
                </p>
                <form onSubmit={handleDeleteOtpSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="deleteOtp" className="block text-sm font-medium text-gray-700 mb-2">
                      Enter OTP
                    </label>
                    <input
                      id="deleteOtp"
                      type="text"
                      value={deleteOtp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setDeleteOtp(value);
                        if (deleteOtpError) setDeleteOtpError('');
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md text-center text-2xl tracking-widest ${
                        deleteOtpError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'
                      } focus:outline-none`}
                      placeholder="000000"
                      maxLength={6}
                      autoComplete="off"
                    />
                    {deleteOtpError && (
                      <p className="mt-1 text-sm text-red-600">{deleteOtpError}</p>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={isLoading || !deleteOtp || deleteOtp.length !== 6}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="spinner mr-2"></div>
                          Deleting...
                        </div>
                      ) : (
                        <>
                          <FiTrash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseDeleteModal}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendDeleteOtp}
                      disabled={resendDisabled || isLoading}
                      className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendDisabled ? `Resend in ${countdown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 