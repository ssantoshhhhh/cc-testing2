import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiShoppingCart, FiSearch, FiEye, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from '../../axios'; // Use the custom axios instance for correct base URL

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();
  const audioRef = useRef(null);
  const unlockRef = useRef(null);
  const lastOrderIdRef = useRef(null);
  const [audioUnlocked, setAudioUnlocked] = useState(() => {
    const saved = localStorage.getItem('adminAudioUnlocked');
    return saved !== null ? JSON.parse(saved) : true; // Default to true
  });
  const [showUnlockBanner, setShowUnlockBanner] = useState(() => {
    const saved = localStorage.getItem('adminAudioUnlocked');
    return saved === null ? false : !JSON.parse(saved); // Show banner only if not saved or explicitly disabled
  });

  const { data: ordersData, isLoading, error } = useQuery(
    ['admin-orders', filter],
    async () => {
      const response = await axios.get(`/api/admin/orders?status=${filter}`);
      return response.data;
    },
    {
      retry: 2,
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 0, // Consider data stale immediately
    }
  );

  const updateOrderStatusMutation = useMutation(
    async ({ orderId, status }) => {
      await axios.put(`/api/admin/orders/${orderId}/status`, { status });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-orders');
        toast.success('Order status updated successfully');
      },
      onError: () => {
        toast.error('Failed to update order status');
      },
    }
  );

  const orders = ordersData?.data || [];

  // Auto-unlock audio on component mount
  useEffect(() => {
    const unlockAudio = async () => {
      try {
        if (unlockRef.current) {
          // Try to play a silent audio to unlock audio context
          unlockRef.current.volume = 0;
          await unlockRef.current.play();
          unlockRef.current.pause();
          unlockRef.current.currentTime = 0;
          
          // Only update state if we don't have a saved preference or if it was enabled
          const saved = localStorage.getItem('adminAudioUnlocked');
          if (saved === null || JSON.parse(saved)) {
            setAudioUnlocked(true);
            setShowUnlockBanner(false);
            localStorage.setItem('adminAudioUnlocked', 'true');
          }
        }
      } catch (error) {
        // If auto-play fails, only show banner if we don't have a saved preference
        const saved = localStorage.getItem('adminAudioUnlocked');
        if (saved === null) {
          setShowUnlockBanner(true);
          setAudioUnlocked(false);
          localStorage.setItem('adminAudioUnlocked', 'false');
        }
      }
    };
    
    // Try to unlock audio after a short delay to allow page to load
    const timer = setTimeout(unlockAudio, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Play sound if a new order is detected
  useEffect(() => {
    if (audioUnlocked && orders && orders.length > 0) {
      const latestOrderId = orders[0]._id;
      if (lastOrderIdRef.current && lastOrderIdRef.current !== latestOrderId) {
        // New order detected
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
      }
      lastOrderIdRef.current = latestOrderId;
    }
  }, [orders, audioUnlocked]);

  // Handler to unlock audio
  const handleUnlockAudio = () => {
    if (unlockRef.current) {
      unlockRef.current.volume = 0;
      unlockRef.current.play().then(() => {
        unlockRef.current.pause();
        unlockRef.current.currentTime = 0;
        setAudioUnlocked(true);
        setShowUnlockBanner(false);
        localStorage.setItem('adminAudioUnlocked', 'true');
      }).catch(() => {
        setAudioUnlocked(false);
        setShowUnlockBanner(true);
        localStorage.setItem('adminAudioUnlocked', 'false');
      });
    }
  };

  // Handle page click to unlock audio
  const handlePageClick = () => {
    if (!audioUnlocked && unlockRef.current) {
      handleUnlockAudio();
    }
  };

  // Add a toggle function to manually enable/disable notifications
  const toggleNotifications = () => {
    const newState = !audioUnlocked;
    setAudioUnlocked(newState);
    setShowUnlockBanner(!newState);
    localStorage.setItem('adminAudioUnlocked', JSON.stringify(newState));
  };

  // Updated filter: always include orders with missing user info, and allow searching for 'unknown' or 'no email'
  const filteredOrders = orders.filter(order => {
    const idMatch = order._id.toLowerCase().includes(searchTerm.toLowerCase());
    const name = order.user?.name ? order.user.name.toLowerCase() : 'unknown user';
    const email = order.user?.email ? order.user.email.toLowerCase() : 'no email';
    const nameMatch = name.includes(searchTerm.toLowerCase());
    const emailMatch = email.includes(searchTerm.toLowerCase());
    return idMatch || nameMatch || emailMatch;
  }) || [];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FiAlertCircle },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: FiCheck },
      rented: { color: 'bg-green-100 text-green-800', icon: FiCheck },
      delivered: { color: 'bg-green-100 text-green-800', icon: FiCheck },
      returned: { color: 'bg-gray-100 text-gray-800', icon: FiCheck },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FiX },
      overdue: { color: 'bg-red-100 text-red-800', icon: FiAlertCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateTotal = (order) => {
    return order.totalAmount || order.items.reduce((total, item) => total + (item.totalPrice || 0), 0);
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading orders</h2>
            <p className="text-gray-600">Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" onClick={handlePageClick}>
      {/* Audio unlock banner */}
      {showUnlockBanner && (
        <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-900 px-4 py-2 text-center cursor-pointer" onClick={handleUnlockAudio}>
          Click here to enable sound notifications for new orders.
        </div>
      )}
      {/* Audio element for alert */}
      <audio ref={audioRef} src="/alert.mp3" preload="auto" />
      {/* Silent audio for unlocking */}
      <audio ref={unlockRef} src="/alert.mp3" preload="auto" style={{ display: 'none' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
              <p className="text-gray-600 mt-2">Process and track rental orders</p>
            </div>
            <button
              onClick={toggleNotifications}
              className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                audioUnlocked
                  ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              {audioUnlocked ? '🔊' : '🔇'} Notifications {audioUnlocked ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('confirmed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'confirmed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setFilter('rented')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'rented'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rented
              </button>
              <button
                onClick={() => setFilter('delivered')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'delivered'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Delivered
              </button>
              <button
                onClick={() => setFilter('overdue')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'overdue'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Overdue
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Orders ({filteredOrders.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order._id.slice(-8).toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items.length} items
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user?.email || 'No email'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={order.deliveryAddress}>
                          {order.deliveryAddress || 'No address'}
                        </div>
                        {order.deliveryInstructions && (
                          <div className="text-xs text-gray-500 max-w-xs truncate" title={order.deliveryInstructions}>
                            📝 {order.deliveryInstructions}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">
                          {order.paymentMethod || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.items.map(item => item.product?.name || 'Product').join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{calculateTotal(order)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-green-600 hover:text-green-900">
                            <FiEye className="h-4 w-4" />
                          </button>
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'confirmed')}
                                className="text-blue-600 hover:text-blue-900"
                                title="Confirm Order"
                              >
                                <FiCheck className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel Order"
                              >
                                <FiX className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'rented')}
                              className="text-green-600 hover:text-green-900"
                              title="Mark as Rented"
                            >
                              <FiCheck className="h-4 w-4" />
                            </button>
                          )}
                          {order.status === 'rented' && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'delivered')}
                              className="text-blue-600 hover:text-blue-900"
                              title="Mark as Delivered"
                            >
                              <FiCheck className="h-4 w-4" />
                            </button>
                          )}
                          {['rented', 'delivered'].includes(order.status) && (
                            <button
                              onClick={() => handleStatusUpdate(order._id, 'returned')}
                              className="text-green-600 hover:text-green-900"
                              title="Mark as Returned"
                            >
                              <FiCheck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders found</h2>
            <p className="text-gray-600">
              {searchTerm 
                ? `No orders match "${searchTerm}"`
                : `No ${filter} orders found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders; 