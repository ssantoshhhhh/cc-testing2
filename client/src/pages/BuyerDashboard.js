import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../axios';

const BuyerDashboard = () => {
  const [purchasedItems, setPurchasedItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    completedPurchases: 0,
    totalSpent: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [ratingModal, setRatingModal] = useState({ show: false, product: null });

  useEffect(() => {
    fetchBuyerData();
  }, []);

  const fetchBuyerData = async () => {
    try {
      const [purchasedRes, favoritesRes] = await Promise.all([
        axios.get('/api/products/purchased'),
        axios.get('/api/products/favorites')
      ]);

      setPurchasedItems(purchasedRes.data.data);
      setFavorites(favoritesRes.data.data);

      const completedPurchases = purchasedRes.data.data.filter(p => p.isSold).length;
      const totalSpent = purchasedRes.data.data
        .filter(p => p.isSold)
        .reduce((sum, p) => sum + p.price, 0);
      const ratedProducts = purchasedRes.data.data.filter(p => p.buyerRating);
      const averageRating = ratedProducts.length > 0 
        ? ratedProducts.reduce((sum, p) => sum + p.buyerRating, 0) / ratedProducts.length 
        : 0;

      setStats({
        totalPurchases: purchasedRes.data.data.length,
        completedPurchases,
        totalSpent,
        averageRating: Math.round(averageRating * 10) / 10
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching buyer data:', error);
      setLoading(false);
    }
  };

  const rateSeller = async (productId, rating, review) => {
    try {
      await axios.post(`/api/products/${productId}/rate-seller`, { rating, review });
      setRatingModal({ show: false, product: null });
      fetchBuyerData(); // Refresh data
    } catch (error) {
      console.error('Error rating seller:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
          <p className="mt-2 text-gray-600">Track your purchases and favorites</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedPurchases}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalSpent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">My Purchases</h2>
          </div>
          <div className="p-6">
            {purchasedItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No purchases yet. Start shopping!</p>
                <Link to="/collection" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded">
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchasedItems.map((product) => (
                  <div key={product._id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{product.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">₹{product.price}</p>
                      <div className="flex items-center mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isSold ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.isSold ? 'Purchased' : 'In Progress'}
                        </span>
                        {product.sellerRating && (
                          <div className="ml-2 flex items-center">
                            <span className="text-yellow-400">★</span>
                            <span className="text-xs text-gray-500 ml-1">{product.sellerRating}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <Link
                          to={`/product/${product._id}`}
                          className="flex-1 bg-blue-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-blue-700"
                        >
                          View Details
                        </Link>
                        {product.isSold && !product.buyerRating && (
                          <button
                            onClick={() => setRatingModal({ show: true, product })}
                            className="flex-1 bg-yellow-600 text-white py-2 px-3 rounded text-sm hover:bg-yellow-700"
                          >
                            Rate Seller
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">My Favorites</h2>
          </div>
          <div className="p-6">
            {favorites.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No favorites yet.</p>
                <Link to="/collection" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded">
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((product) => (
                  <div key={product._id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                      {product.images && product.images.length > 0 && (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{product.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">₹{product.price}</p>
                      <div className="flex items-center mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.isSold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {product.isSold ? 'Sold' : 'Available'}
                        </span>
                      </div>
                      <Link
                        to={`/product/${product._id}`}
                        className="mt-4 inline-block w-full bg-blue-600 text-white text-center py-2 px-3 rounded text-sm hover:bg-blue-700"
                      >
                        View Product
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rating Modal */}
        {ratingModal.show && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Rate Seller</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very Good</option>
                    <option value="3">3 - Good</option>
                    <option value="2">2 - Fair</option>
                    <option value="1">1 - Poor</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Review (Optional)</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    rows="3"
                    placeholder="Share your experience with this seller..."
                  ></textarea>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setRatingModal({ show: false, product: null })}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => rateSeller(ratingModal.product._id, 5, "Great seller!")}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                  >
                    Submit Rating
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard; 