import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { FiDollarSign, FiUser, FiClock, FiCheck, FiX, FiMessageCircle, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from '../axios';

const BuyRequests = () => {
  const { user, getProfilePictureUrl } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('all');

  const { data: requests, isLoading, error } = useQuery(
    ['buy-requests'],
    async () => {
      const response = await axios.get('/api/buy-requests');
      return response.data;
    },
    {
      refetchInterval: 10000, // Poll every 10 seconds
      retry: 2,
      onError: (error) => {
        console.error('Buy requests fetch error:', error);
        if (error.response?.status === 401) {
          toast.error('Please log in to view buy requests');
        } else {
          toast.error('Failed to load buy requests');
        }
      }
    }
  );

  const updateRequestStatus = useMutation(
    async ({ requestId, status }) => {
      await axios.put(`/api/buy-requests/${requestId}/status`, { status });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['buy-requests']);
        toast.success('Request status updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update request status');
      },
    }
  );

  const deleteRequest = useMutation(
    async (requestId) => {
      await axios.delete(`/api/buy-requests/${requestId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['buy-requests']);
        toast.success('Request deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete request');
      },
    }
  );

  const handleStatusUpdate = (requestId, status) => {
    updateRequestStatus.mutate({ requestId, status });
  };

  const handleDeleteRequest = (requestId) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      deleteRequest.mutate(requestId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="w-4 h-4" />;
      case 'accepted':
        return <FiCheck className="w-4 h-4" />;
      case 'rejected':
        return <FiX className="w-4 h-4" />;
      case 'completed':
        return <FiDollarSign className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

  const filteredRequests = requests?.filter(request => {
    if (selectedStatus === 'all') return true;
    return request.status === selectedStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Buy Requests</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy Requests</h1>
          <p className="text-gray-600">
            Manage your buy requests and offers
          </p>
        </div>

        {/* Status Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'accepted', 'rejected', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length > 0 ? (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const isSeller = request.seller._id === user?.id;
              const otherUser = isSeller ? request.buyer : request.seller;
              
              return (
                <div key={request._id} className="bg-white rounded-lg shadow-sm border">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      {/* User Info */}
                      <div className="flex items-start space-x-4">
                        {otherUser.profilePicture ? (
                          <img
                            src={getProfilePictureUrl(otherUser._id)}
                            alt={otherUser.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-12 h-12 bg-green-100 rounded-full flex items-center justify-center ${otherUser.profilePicture ? 'hidden' : ''}`}>
                          <FiUser className="text-green-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{otherUser.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                              {getStatusIcon(request.status)}
                              <span>{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span>
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <span>{isSeller ? 'Wants to buy' : 'You want to buy'}</span>
                            <span>•</span>
                            <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex items-center space-x-3 mb-3">
                            <img
                              src={request.product.images?.[0] || '/placeholder-product.jpg'}
                              alt={request.product.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">{request.product.title}</h4>
                              <p className="text-sm text-gray-600">Original Price: ₹{request.product.price}</p>
                              <p className="text-sm text-green-600 font-medium">
                                Offered Price: ₹{request.offeredPrice}
                              </p>
                            </div>
                          </div>
                          
                          {/* Message */}
                          {request.message && (
                            <div className="bg-gray-50 p-3 rounded-lg mb-3">
                              <p className="text-sm text-gray-700">{request.message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col space-y-2">
                        {isSeller && request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(request._id, 'accepted')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(request._id, 'rejected')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        
                        {isSeller && request.status === 'accepted' && (
                          <button
                            onClick={() => handleStatusUpdate(request._id, 'completed')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Mark Completed
                          </button>
                        )}
                        
                        {!isSeller && request.status === 'pending' && (
                          <button
                            onClick={() => handleDeleteRequest(request._id)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                          >
                            Cancel Request
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiDollarSign className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedStatus === 'all' ? 'No buy requests yet' : `No ${selectedStatus} requests`}
            </h3>
            <p className="text-gray-600">
              {selectedStatus === 'all' 
                ? 'Start browsing products and send buy requests!' 
                : `No ${selectedStatus} requests found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyRequests; 