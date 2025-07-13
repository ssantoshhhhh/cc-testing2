import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { FiMessageCircle, FiStar, FiTruck, FiShield, FiRefreshCw, FiUser, FiPhone, FiMail, FiHeart, FiDollarSign, FiMapPin, FiClock } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from '../axios';
import ChatModal from '../components/ChatModal';
import BuyRequestModal from '../components/BuyRequestModal';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getProfilePictureUrl } = useAuth();
  const queryClient = useQueryClient();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMarkSoldModal, setShowMarkSoldModal] = useState(false);
  const [showBuyRequestModal, setShowBuyRequestModal] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);

  const { data: productResponse, isLoading, error } = useQuery(
    ['product', id],
    async () => {
      const response = await axios.get(`/api/products/${id}`);
      return response.data;
    },
    {
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  const product = productResponse?.data;

  const markAsSoldMutation = useMutation(
    async ({ productId, buyerId }) => {
      await axios.put(`/api/products/${productId}/mark-sold`, { buyerId });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product', id]);
        toast.success('Product marked as sold successfully');
        setShowMarkSoldModal(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to mark as sold');
      },
    }
  );

  const toggleFavoriteMutation = useMutation(
    async () => {
      await axios.post(`/api/products/${id}/favorite`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['product', id]);
        toast.success('Favorite updated');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update favorite');
      },
    }
  );

  const handleContactSeller = () => {
    if (!user) {
      toast.error('Please login to contact seller');
      navigate('/login');
      return;
    }
    setShowContactModal(true);
  };

  const handleStartChat = () => {
    if (!user) {
      toast.error('Please login to start chat');
      navigate('/login');
      return;
    }
    if (user.id === product?.seller?._id) {
      toast.error('You cannot chat with yourself');
      return;
    }
    setShowChatModal(true);
  };

  const handleBuyRequest = () => {
    if (!user) {
      toast.error('Please login to send buy request');
      navigate('/login');
      return;
    }
    if (user.id === product?.seller?._id) {
      toast.error('You cannot buy your own product');
      return;
    }
    setShowBuyRequestModal(true);
  };

  const handleMarkAsSold = () => {
    if (!selectedBuyer) {
      toast.error('Please select a buyer');
      return;
    }
    markAsSoldMutation.mutate({ productId: id, buyerId: selectedBuyer });
  };

  const handleToggleFavorite = () => {
    if (!user) {
      toast.error('Please login to add to favorites');
      navigate('/login');
      return;
    }
    toggleFavoriteMutation.mutate();
  };

  const isOwner = user && product?.seller?._id === user.id;
  const isSold = product?.isSold;
  const isFavorited = product?.favorites?.includes(user?.id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product not found</h2>
          <button
            onClick={() => navigate('/collection')}
            className="btn-primary"
          >
            Back to Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-green-600 transition-colors"
              >
                Home
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <button
                  onClick={() => navigate('/collection')}
                  className="text-gray-500 hover:text-green-600 transition-colors"
                >
                  Collection
                </button>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-900">{product.title}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="space-y-4">
              <div className="aspect-w-1 aspect-h-1 w-full relative">
                <img
                  src={product.images && product.images[0] ? product.images[0] : '/placeholder-product.jpg'}
                  alt={product.title}
                  className="w-full h-96 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    console.log('Image failed to load:', e.target.src);
                    e.target.src = '/placeholder-product.jpg';
                    e.target.onerror = null; // Prevent infinite loop
                  }}
                />
                {isSold && (
                  <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <div className="text-2xl font-bold mb-2">Sold</div>
                      <div className="text-sm">This item is no longer available</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Additional Images */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1, 5).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${product.title} ${index + 2}`}
                      className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-75"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-2 rounded-full ${
                      isFavorited ? 'text-red-500' : 'text-gray-400'
                    } hover:text-red-500 transition-colors`}
                  >
                    <FiHeart className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <FiStar
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(product.seller?.sellerRating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">({product.seller?.sellerRating || 0}.0)</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{product.views} views</span>
                </div>
                
                <p className="text-gray-600 text-lg">{product.description}</p>
              </div>

              {/* Price */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">
                    ₹{product.price}
                  </span>
                  <div className="text-right">
                    {isSold ? (
                      <span className="text-sm text-red-600 font-medium">Sold</span>
                    ) : (
                      <span className="text-sm text-gray-500">Available</span>
                    )}
                  </div>
                </div>
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500 line-through">₹{product.originalPrice}</span>
                    <span className="text-sm text-green-600 ml-2">
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                    </span>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Product Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-medium capitalize">{product.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Condition:</span>
                    <span className="ml-2 font-medium capitalize">{product.condition}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-2 font-medium">{product.location}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Negotiable:</span>
                    <span className="ml-2 font-medium">{product.isNegotiable ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Seller Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FiUser className="mr-2 text-green-600" />
                  Seller Information
                </h3>
                <div className="flex items-start space-x-3 mb-4">
                  {product.seller?.profilePicture ? (
                    <img
                      src={getProfilePictureUrl(product.seller._id)}
                      alt={product.seller.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 bg-green-100 rounded-full flex items-center justify-center ${product.seller?.profilePicture ? 'hidden' : ''}`}>
                    <FiUser className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.seller?.name || 'Anonymous'}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FiMapPin className="w-4 h-4" />
                      <span>{product.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FiClock className="w-4 h-4" />
                      <span>Member since {new Date(product.seller?.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {product.contactInfo?.phone && (
                    <div className="flex items-center space-x-2">
                      <FiPhone className="text-green-600" />
                      <span className="text-gray-700">{product.contactInfo.phone}</span>
                    </div>
                  )}
                  {product.contactInfo?.email && (
                    <div className="flex items-center space-x-2">
                      <FiMail className="text-green-600" />
                      <span className="text-gray-700">{product.contactInfo.email}</span>
                    </div>
                  )}
                  {product.contactInfo?.whatsapp && (
                    <div className="flex items-center space-x-2">
                      <FaWhatsapp className="text-green-600" />
                      <span className="text-gray-700">{product.contactInfo.whatsapp}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {!isSold && !isOwner && (
                  <>
                    <button
                      onClick={handleBuyRequest}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <FiDollarSign />
                      <span>Send Buy Request</span>
                    </button>
                    <button
                      onClick={handleStartChat}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <FiMessageCircle />
                      <span>Start Chat</span>
                    </button>
                    <button
                      onClick={handleContactSeller}
                      className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <FiPhone />
                      <span>Contact Seller</span>
                    </button>
                  </>
                )}
                
                {isOwner && !isSold && (
                  <button
                    onClick={() => setShowMarkSoldModal(true)}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <FiShield />
                    <span>Mark as Sold</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Seller</h3>
                <div className="space-y-4">
                  {product.contactInfo?.phone && (
                    <a
                      href={`tel:${product.contactInfo.phone}`}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <FiPhone className="text-blue-600" />
                      <span>Call: {product.contactInfo.phone}</span>
                    </a>
                  )}
                  {product.contactInfo?.whatsapp && (
                    <a
                      href={`https://wa.me/${product.contactInfo.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <FaWhatsapp className="text-green-600" />
                      <span>WhatsApp: {product.contactInfo.whatsapp}</span>
                    </a>
                  )}
                  {product.contactInfo?.email && (
                    <a
                      href={`mailto:${product.contactInfo.email}`}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <FiMail className="text-blue-600" />
                      <span>Email: {product.contactInfo.email}</span>
                    </a>
                  )}
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mark as Sold Modal */}
        {showMarkSoldModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Mark as Sold</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buyer ID (Optional)</label>
                  <input
                    type="text"
                    value={selectedBuyer}
                    onChange={(e) => setSelectedBuyer(e.target.value)}
                    placeholder="Enter buyer's user ID"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowMarkSoldModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMarkAsSold}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
                  >
                    Mark Sold
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {showChatModal && (
          <ChatModal
            isOpen={showChatModal}
            onClose={() => setShowChatModal(false)}
            product={product}
            sellerId={product?.seller?._id}
          />
        )}

        {/* Buy Request Modal */}
        {showBuyRequestModal && (
          <BuyRequestModal
            isOpen={showBuyRequestModal}
            onClose={() => setShowBuyRequestModal(false)}
            product={product}
            seller={product?.seller}
          />
        )}
      </div>
    </div>
  );
};

export default ProductDetail; 