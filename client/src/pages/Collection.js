import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import axios from '../axios';
import { FaSearch, FaFilter, FaSort, FaEye, FaUser, FaMapMarkerAlt, FaClock, FaTag } from 'react-icons/fa';
import { FiHeart, FiMessageCircle } from 'react-icons/fi';
import ChatModal from '../components/ChatModal';
import toast from 'react-hot-toast';

const Collection = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'createdAt:desc',
  });
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { data: productsData, isLoading, error } = useQuery(
    ['products', filters],
    async () => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      
      const response = await axios.get(`/api/products?${params.toString()}`);
      return response.data;
    },
    {
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    if (filters.category) newSearchParams.set('category', filters.category);
    if (filters.search) newSearchParams.set('search', filters.search);
    if (filters.sort) newSearchParams.set('sort', filters.sort);
    
    setSearchParams(newSearchParams);
  }, [filters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by the filters state
  };

  const handleStartChat = (product) => {
    if (!user) {
      toast.error('Please login to start chat');
      return;
    }
    if (user.id === product.seller?._id) {
      toast.error('You cannot chat with yourself');
      return;
    }
    console.log('Starting chat with product:', {
      productId: product._id,
      sellerId: product.seller?._id,
      userId: user.id
    });
    setSelectedProduct(product);
    setShowChatModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Products</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const products = productsData?.data || [];
  const pagination = productsData?.pagination || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Campus Marketplace</h1>
          <p className="text-gray-600">
            Discover great deals from your fellow students - textbooks, electronics, furniture, and more!
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-soft p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </form>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="books">Books & Textbooks</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
                <option value="clothing">Clothing</option>
                <option value="sports">Sports Equipment</option>
                <option value="musical-instruments">Musical Instruments</option>
                <option value="lab-equipment">Lab Equipment</option>
                <option value="stationery">Stationery</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="createdAt:desc">Newest First</option>
                <option value="createdAt:asc">Oldest First</option>
                <option value="price:asc">Price: Low to High</option>
                <option value="price:desc">Price: High to Low</option>
                <option value="title:asc">Name: A to Z</option>
                <option value="title:desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {products.length} of {productsData?.total || 0} products
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const isSold = product.isSold;
              return (
                <div
                  key={product._id}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                    isSold ? 'opacity-75' : ''
                  }`}
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={product.images && product.images[0] ? product.images[0] : '/placeholder-product.jpg'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Image failed to load:', e.target.src);
                        e.target.src = '/placeholder-product.jpg';
                        e.target.onerror = null; // Prevent infinite loop
                      }}
                    />
                    {isSold && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-lg font-bold mb-1">Sold</div>
                          <div className="text-xs">No longer available</div>
                        </div>
                      </div>
                    )}
                    {/* Category Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 text-xs font-medium bg-green-600 text-white rounded-full capitalize">
                        {product.category}
                      </span>
                    </div>
                    {/* Favorite Button */}
                    <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors">
                      <FiHeart className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Product Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Seller Info */}
                    <div className="flex items-center space-x-2 mb-3 text-sm text-gray-500">
                      <FaUser className="w-3 h-3" />
                      <span>{product.seller?.name || 'Anonymous'}</span>
                      {product.location && (
                        <>
                          <span>•</span>
                          <FaMapMarkerAlt className="w-3 h-3" />
                          <span>{product.location}</span>
                        </>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xl font-bold text-green-600">
                          ₹{product.price}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            ₹{product.originalPrice}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isSold 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {isSold ? 'Sold' : 'Available'}
                        </span>
                      </div>
                    </div>

                    {/* Condition and Negotiable */}
                    <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                      <span className="capitalize">Condition: {product.condition}</span>
                      {product.isNegotiable && (
                        <span className="text-green-600 font-medium">Negotiable</span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <Link
                        to={`/product/${product._id}`}
                        className={`flex-1 text-sm px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                          isSold 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                        onClick={isSold ? (e) => e.preventDefault() : undefined}
                      >
                        <FaEye className="mr-1" />
                        {isSold ? 'Sold' : 'View Details'}
                      </Link>
                      {!isSold && (
                        <button 
                          onClick={() => handleStartChat(product)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <FiMessageCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              {pagination.hasPrev && (
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('page', pagination.current - 1);
                    setSearchParams(newParams);
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Previous
                </button>
              )}

              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('page', page);
                    setSearchParams(newParams);
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    page === pagination.current
                      ? 'bg-green-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              {pagination.hasNext && (
                <button
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('page', pagination.current + 1);
                    setSearchParams(newParams);
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Next
                </button>
              )}
            </nav>
          </div>
        )}

        {/* Chat Modal */}
        {showChatModal && selectedProduct && (
          <ChatModal
            isOpen={showChatModal}
            onClose={() => {
              setShowChatModal(false);
              setSelectedProduct(null);
            }}
            product={selectedProduct}
            sellerId={selectedProduct.seller?._id}
          />
        )}
      </div>
    </div>
  );
};

export default Collection; 