import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { FiX, FiDollarSign, FiMessageSquare, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from '../axios';

const BuyRequestModal = ({ isOpen, onClose, product, seller }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    offeredPrice: product?.price || 0,
    message: '',
    isNegotiable: false
  });

  const createBuyRequest = useMutation(
    async (data) => {
      const response = await axios.post('/api/buy-requests', {
        productId: product._id,
        offeredPrice: data.offeredPrice,
        message: data.message,
        isNegotiable: data.isNegotiable
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Buy request sent successfully!');
        queryClient.invalidateQueries(['buy-requests']);
        onClose();
        setFormData({
          offeredPrice: product?.price || 0,
          message: '',
          isNegotiable: false
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send buy request');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.offeredPrice || formData.offeredPrice <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    createBuyRequest.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-black-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-primary-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-primary-700 bg-black-900">
          <div className="flex items-center space-x-3">
            {seller?.profilePicture ? (
              <img
                src={`http://localhost:8001/api/users/profile-picture/${seller._id}`}
                alt={seller.name}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center ${seller?.profilePicture ? 'hidden' : ''}`}>
              <FiUser className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-500">Buy Request</h3>
              <p className="text-sm text-primary-200">Send to {seller?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-primary-200 hover:text-primary-500 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <img
              src={product?.images?.[0] || '/placeholder-product.jpg'}
              alt={product?.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div>
              <h4 className="font-medium text-gray-900">{product?.title}</h4>
              <p className="text-sm text-gray-600">Original Price: ${product?.price}</p>
              <p className="text-xs text-gray-500">{product?.condition} condition</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Offered Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiDollarSign className="inline w-4 h-4 mr-1" />
              Your Offered Price
            </label>
            <input
              type="number"
              name="offeredPrice"
              value={formData.offeredPrice}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter your offer"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Original price: ${product?.price}
            </p>
          </div>

          {/* Negotiable Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isNegotiable"
              checked={formData.isNegotiable}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Price is negotiable
            </label>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiMessageSquare className="inline w-4 h-4 mr-1" />
              Message (Optional)
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows="4"
              maxLength="500"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Tell the seller why you're interested in this item..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.message.length}/500 characters
            </p>
          </div>

          {/* Seller Info */}
          <div className="bg-primary-50 p-3 rounded-lg">
            <h5 className="font-medium text-primary-900 mb-2">Seller Information</h5>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {seller?.name}</p>
              <p><span className="font-medium">Contact:</span> {product?.contactInfo?.phone}</p>
              <p><span className="font-medium">Location:</span> {product?.location}</p>
              {product?.contactInfo?.whatsapp && (
                <p><span className="font-medium">WhatsApp:</span> {product.contactInfo.whatsapp}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createBuyRequest.isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createBuyRequest.isLoading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BuyRequestModal; 