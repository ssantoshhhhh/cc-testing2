import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from '../axios';
import { FaArrowRight, FaStar, FaUsers, FaShieldAlt, FaHandshake, FaComments } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const [featuredProduct, setFeaturedProduct] = useState(null);
  const { isAuthenticated } = useAuth();

  // Fetch products for the collection preview
  const { data: products, isLoading } = useQuery(
    'homeProducts',
    async () => {
      const response = await axios.get('/api/products?limit=6');
      return response.data.data;
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Fetch public statistics from the database
  const { data: statsData, isLoading: statsLoading } = useQuery(
    'home-stats',
    async () => {
      const response = await axios.get('/api/public/stats');
      return response.data;
    },
    {
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (products && products.length > 0) {
      // Set the first product as featured
      setFeaturedProduct(products[0]);
    }
  }, [products]);

  const features = [
    {
      icon: <FaShieldAlt className="text-2xl" />,
      title: 'Safe & Secure',
      description: 'Direct communication with sellers and secure transactions within our campus community.'
    },
    {
      icon: <FaHandshake className="text-2xl" />,
      title: 'Trusted Community',
      description: 'Buy and sell with fellow students in a trusted campus marketplace environment.'
    },
    {
      icon: <FaComments className="text-2xl" />,
      title: 'Easy Communication',
      description: 'Chat directly with sellers to ask questions and negotiate prices.'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-black-900 to-black-700 min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            Campus
            <span className="text-primary-500 block">Marketplace</span>
          </h1>
          <p className="text-xl text-gray-200 leading-relaxed mb-8">
            Buy, sell, and trade with fellow students in your campus community. 
            Find great deals on textbooks, electronics, furniture, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-center">
            <Link
              to="/collection"
              className="bg-primary-600 hover:bg-primary-700 text-white text-lg px-8 py-3 rounded-lg flex items-center justify-center transition-colors duration-200 shadow"
            >
              Browse Items
              <FaArrowRight className="ml-2" />
            </Link>
            <Link
              to="/about"
              className="bg-black-700 hover:bg-black-800 text-white text-lg px-8 py-3 rounded-lg flex items-center justify-center transition-colors duration-200 border border-primary-500"
            >
              Learn More
            </Link>
          </div>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 w-full max-w-2xl mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">
                {statsLoading ? '...' : `${statsData?.data?.totalUsers || 0}+`}
              </div>
              <div className="text-sm text-gray-200">Active Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">
                {statsLoading ? '...' : `${statsData?.data?.totalProducts || 0}+`}
              </div>
              <div className="text-sm text-gray-200">Items Listed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">
                {statsLoading ? '...' : `${statsData?.data?.totalOrders || 0}+`}
              </div>
              <div className="text-sm text-gray-200">Successful Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-500">
                {statsLoading ? '...' : `${statsData?.data?.activeRentals || 0}+`}
              </div>
              <div className="text-sm text-gray-200">Active Listings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Campus Marketplace?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect with fellow students to buy, sell, and trade items in a safe and trusted environment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors duration-300"
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Preview Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Featured Items
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover great deals from your fellow students - textbooks, electronics, furniture, and more.
            </p>
          </div>

          {products && products.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {products.slice(0, 6).map((product) => (
                <div
                  key={product._id}
                  className="bg-white rounded-xl shadow-soft overflow-hidden hover:shadow-medium transition-shadow duration-300"
                >
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                    <img
                      src={product.images[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder-product.jpg';
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`badge ${
                        product.category === 'textbooks' ? 'badge-info' : 
                        product.category === 'electronics' ? 'badge-warning' :
                        product.category === 'furniture' ? 'badge-success' : 'badge-primary'
                      }`}>
                        {product.category}
                      </span>
                      <span className="text-sm text-gray-500">
                        {product.condition}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-primary-600">
                        ₹{product.price}
                      </span>
                      {product.seller && (
                        <div className="flex items-center text-sm text-gray-500">
                          <FaUsers className="mr-1" />
                          {product.seller.name}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link
                        to={`/product/${product._id}`}
                        className="btn-primary text-sm flex-1"
                      >
                        View Details
                      </Link>
                      {isAuthenticated && (
                        <button
                          className="btn-secondary text-sm"
                          onClick={() => {
                            // This would open chat modal in a real implementation
                            window.location.href = `/product/${product._id}`;
                          }}
                        >
                          Chat
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            <Link
              to="/collection"
              className="btn-primary text-lg px-8 py-3 inline-flex items-center"
            >
              View All Items
              <FaArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Only show when user is not logged in */}
      {!isAuthenticated && (
        <section className="py-20 bg-primary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join your campus marketplace community and start buying, selling, and trading with fellow students.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Sign Up Now
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home; 