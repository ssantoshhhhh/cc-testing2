import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiPackage, FiCalendar, FiMapPin, FiClock, FiCheck, FiX, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from '../axios'; // use the custom axios instance
import useOrderNotifications from '../hooks/useOrderNotifications';

const OrderDetail = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const previousOrderRef = useRef(null);
  
  const {
    confirmedAudioRef,
    rejectedAudioRef,
    playOrderStatusSound
  } = useOrderNotifications();

  const { data: orderData, isLoading, error } = useQuery(
    ['order', id],
    async () => {
      const response = await axios.get(`/api/orders/${id}`);
      return response.data;
    },
    {
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  // Check for order status changes and play sounds
  useEffect(() => {
    if (orderData?.data && previousOrderRef.current) {
      const currentOrder = orderData.data;
      const previousOrder = previousOrderRef.current;
      
      if (previousOrder.status !== currentOrder.status) {
        playOrderStatusSound(currentOrder.status, previousOrder.status);
      }
    }
    
    if (orderData?.data) {
      previousOrderRef.current = orderData.data;
    }
  }, [orderData, playOrderStatusSound]);

  const cancelOrderMutation = useMutation(
    async (orderId) => {
      await axios.put(`/api/orders/${orderId}/cancel`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', id]);
        queryClient.invalidateQueries('orders');
        toast.success('Order cancelled successfully');
      },
      onError: (error) => {
        const message = error.response?.data?.message || 'Failed to cancel order';
        toast.error(message);
      },
    }
  );

  const order = orderData?.data;

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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-2" />
        {statusText}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateTotal = () => {
    if (!order) return 0;
    return order.totalAmount || order.items.reduce((total, item) => total + (item.totalPrice || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
            <p className="text-gray-600 mb-8">The order you're looking for doesn't exist.</p>
            <Link
              to="/orders"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FiArrowLeft className="mr-2 h-5 w-5" />
              Back to Orders
            </Link>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/orders"
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-4"
          >
            <FiArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-gray-600 mt-1">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center space-x-4">
              {order.canBeCancelled && (
                <button
                  onClick={() => handleCancelOrder(order._id)}
                  disabled={cancelOrderMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  {cancelOrderMutation.isLoading ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
              {getStatusBadge(order)}
            </div>
          </div>
        </div>

        {/* Cancel Timer for Pending Orders */}
        {order.canBeCancelled && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <FiClock className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                You can cancel this order for {order.remainingCancelTime} more minute{order.remainingCancelTime !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items.map((item, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.product?.images?.[0] || '/placeholder-product.svg'}
                        alt={item.product?.name || 'Product'}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{item.product?.name || 'Product'}</h3>
                        <p className="text-sm text-gray-600">{item.product?.description || 'No description available'}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          <span>Quantity: {item.quantity}</span>
                          <span>Duration: {order.rentalDays} {order.rentalDays === 1 ? 'day' : 'days'}</span>
                          <span>Price: ₹{item.pricePerDay}/day</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">₹{item.totalPrice}</p>
                        <p className="text-sm text-gray-600">
                          {order.rentalDays} {order.rentalDays === 1 ? 'day' : 'days'} × {item.quantity} {item.quantity === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiMapPin className="mr-2 h-5 w-5 text-green-600" />
                  Delivery Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
                  <p className="mt-1 text-sm text-gray-900">{order.deliveryAddress}</p>
                </div>
                {order.deliveryInstructions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivery Instructions</label>
                    <p className="mt-1 text-sm text-gray-900">{order.deliveryInstructions}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{order.paymentMethod}</p>
                </div>
              </div>
            </div>

            {/* Return Information */}
            {order.expectedReturnDate && (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FiCalendar className="mr-2 h-5 w-5 text-green-600" />
                    Return Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Expected Return Date</p>
                      <p className="text-lg font-semibold text-gray-900">{formatDate(order.expectedReturnDate)}</p>
                    </div>
                    {order.expectedReturnDate && new Date() > new Date(order.expectedReturnDate) && order.status !== 'returned' && (
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          <FiAlertCircle className="w-4 h-4 mr-1" />
                          Overdue
                        </span>
                      </div>
                    )}
                  </div>
                  {order.isOverdue && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-800">
                        This item is overdue. Please return it as soon as possible to avoid additional charges.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{calculateTotal()}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-semibold text-gray-900">₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="mt-8">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Order Timeline</h4>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Order Placed</p>
                      <p className="text-xs text-gray-600">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  
                  {order.status === 'confirmed' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order Confirmed</p>
                        <p className="text-xs text-gray-600">
                          {order.updatedAt ? formatDate(order.updatedAt) : 'Recently'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'rented' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order Confirmed</p>
                        <p className="text-xs text-gray-600">
                          {order.updatedAt ? formatDate(order.updatedAt) : 'Recently'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'delivered' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Delivered</p>
                        <p className="text-xs text-gray-600">Items delivered to campus</p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'returned' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Returned</p>
                        <p className="text-xs text-gray-600">Items returned successfully</p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'cancelled' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.cancelledBy === 'admin' ? 'Cancelled by Admin' : 'Order Cancelled'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {order.updatedAt ? formatDate(order.updatedAt) : 'Recently'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'overdue' && (
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Order Overdue</p>
                        <p className="text-xs text-gray-600">Return date has passed</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Support */}
              <div className="mt-8 p-4 bg-green-50 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 mb-2">Need Help?</h4>
                <p className="text-sm text-green-700 mb-3">
                  If you have any questions about your order, please contact our support team.
                </p>
                <Link
                  to="/contact"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail; 