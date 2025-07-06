import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiPackage, FiCalendar, FiClock, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from '../axios'; // use the custom axios instance
import useOrderNotifications from '../hooks/useOrderNotifications';

const OrderHistory = () => {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();
  const previousOrdersRef = useRef([]);
  
  const {
    confirmedAudioRef,
    rejectedAudioRef,
    playOrderStatusSound
  } = useOrderNotifications();

  const { data: ordersData, isLoading, error } = useQuery(
    ['orders', filter],
    async () => {
      const response = await axios.get(`/api/users/orders?status=${filter}`);
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

  const cancelOrderMutation = useMutation(
    async (orderId) => {
      await axios.put(`/api/orders/${orderId}/cancel`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast.success('Order cancelled successfully');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to cancel order';
        toast.error(message);
      },
    }
  );

  const orders = ordersData?.data || [];

  const handleCancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const getStatusBadge = (order) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FiClock },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: FiPackage },
      rented: { color: 'bg-green-100 text-green-800', icon: FiCheck },
      delivered: { color: 'bg-green-100 text-green-800', icon: FiCheck },
      returned: { color: 'bg-gray-100 text-gray-800', icon: FiCheck },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FiX },
      overdue: { color: 'bg-red-100 text-red-800', icon: FiAlertCircle },
    };

    const config = statusConfig[order.status] || statusConfig.pending;
    const Icon = config.icon;

    let statusText = order.status.charAt(0).toUpperCase() + order.status.slice(1);
    
    // Show who cancelled the order if it's cancelled
    if (order.status === 'cancelled' && order.cancelledBy) {
      statusText = `Cancelled by ${order.cancelledBy.charAt(0).toUpperCase() + order.cancelledBy.slice(1)}`;
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {statusText}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateTotal = (order) => {
    return order.totalAmount || order.items.reduce((total, item) => total + (item.totalPrice || 0), 0);
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffInMinutes = Math.floor((now - orderTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
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
    <div className="min-h-screen bg-gray-50 py-8">

      {/* Audio elements for notifications */}
      <audio ref={confirmedAudioRef} src="/confimed.mp3" preload="auto" />
      <audio ref={rejectedAudioRef} src="/rejected.mp3" preload="auto" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track your rental orders and their status</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
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
              onClick={() => setFilter('returned')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'returned'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Returned
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'cancelled'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Orders List */}
        {orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </h3>
                      {getStatusBadge(order)}
                    </div>
                    <div className="flex items-center space-x-3">
                      {order.canBeCancelled && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancelOrderMutation.isLoading}
                          className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200 disabled:opacity-50"
                        >
                          {cancelOrderMutation.isLoading ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
                      <Link
                        to={`/orders/${order._id}`}
                        className="text-green-600 hover:text-green-700 font-medium text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-medium">{formatDate(order.createdAt)}</p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-medium">₹{calculateTotal(order)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Items</p>
                      <p className="font-medium">{order.items.length} items</p>
                    </div>
                  </div>

                  {/* Cancel Timer for Pending Orders */}
                  {order.canBeCancelled && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FiClock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          You can cancel this order for {order.remainingCancelTime} more minute{order.remainingCancelTime !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Order Items Preview */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <img
                            src={item.product?.images?.[0] || '/placeholder-product.svg'}
                            alt={item.product?.name || 'Product'}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.product?.name || 'Product'}</p>
                            <p className="text-xs text-gray-600">
                              {item.quantity} × {order.rentalDays} {order.rentalDays === 1 ? 'day' : 'days'}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="flex items-center text-sm text-gray-600">
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Return Date Info */}
                  {order.expectedReturnDate && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FiCalendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-blue-800">
                          Return by: {formatDate(order.expectedReturnDate)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Overdue Warning */}
                  {order.expectedReturnDate && new Date() > new Date(order.expectedReturnDate) && order.status !== 'returned' && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FiAlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-800">
                          This item is overdue. Please return it as soon as possible.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiPackage className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No orders found</h2>
            <p className="text-gray-600 mb-8">
              {filter === 'all' 
                ? "You haven't placed any orders yet."
                : `No ${filter} orders found.`
              }
            </p>
            <Link
              to="/collection"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory; 