import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FaSearch, 
  FaUser, 
  FaBars, 
  FaTimes,
  FaSignOutAlt,
  FaCog
} from 'react-icons/fa';
import { FiMessageCircle } from 'react-icons/fi';

const Layout = ({ children }) => {
  const { user, isAuthenticated, logout, getProfilePictureUrl } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/collection?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  const navItems = [
    { name: 'HOME', path: '/' },
    { name: 'COLLECTION', path: '/collection' },
    { name: 'ABOUT', path: '/about' },
    { name: 'CONTACT', path: '/contact' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Get profile picture URL
  const profilePictureUrl = user?.hasProfilePicture ? getProfilePictureUrl(user.id) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-black-900 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <img src="/logo.jpg" alt="Logo" className="w-10 h-10 object-contain mr-2 rounded-lg" />
                <span className="text-xl font-bold text-primary-500">Campus Connect</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'text-primary-500 bg-black-700'
                        : 'text-gray-200 hover:text-primary-500 hover:bg-black-800'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-black-700 bg-black-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-500"
                >
                  <FaSearch size={16} />
                </button>
              </form>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              {/* Search button for mobile */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-200 hover:text-primary-500 hover:bg-black-800"
              >
                {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>

              {/* Profile/Login */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-md text-gray-200 hover:text-primary-500 hover:bg-black-800 transition-colors duration-200"
                  >
                    {profilePictureUrl ? (
                      <img
                        src={profilePictureUrl}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-black-700 rounded-full flex items-center justify-center">
                        <FaUser size={14} className="text-gray-400" />
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.name?.split(' ')[0]}
                    </span>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-black-800 rounded-md shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-200 hover:bg-black-700 hover:text-primary-500"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FaUser className="inline mr-2" />
                        Profile
                      </Link>
                      <Link
                        to="/seller-dashboard"
                        className="block px-4 py-2 text-sm text-gray-200 hover:bg-black-700 hover:text-primary-500"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FaCog className="inline mr-2" />
                        Sell Items
                      </Link>
                      <Link
                        to="/buyer-dashboard"
                        className="block px-4 py-2 text-sm text-gray-200 hover:bg-black-700 hover:text-primary-500"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FaCog className="inline mr-2" />
                        My Purchases
                      </Link>
                      <Link
                        to="/chats"
                        className="block px-4 py-2 text-sm text-gray-200 hover:bg-black-700 hover:text-primary-500"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FiMessageCircle className="inline mr-2" />
                        My Chats
                      </Link>
                      <Link
                        to="/buy-requests"
                        className="block px-4 py-2 text-sm text-gray-200 hover:bg-black-700 hover:text-primary-500"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FaCog className="inline mr-2" />
                        Buy Requests
                      </Link>
                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-200 hover:bg-black-700 hover:text-primary-500"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <FaCog className="inline mr-2" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-black-700 hover:text-primary-500"
                      >
                        <FaSignOutAlt className="inline mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-black-700 bg-black-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-500"
                    >
                      <FaSearch size={16} />
                    </button>
                  </div>
                </form>

                {/* Mobile Navigation */}
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'text-primary-500 bg-black-700'
                        : 'text-gray-200 hover:text-primary-500 hover:bg-black-800'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black-900 text-primary-100">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary-500">Campus Connect</h3>
              <p className="text-primary-100">
                Your trusted platform for buying and selling on campus.
              </p>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4 text-primary-500">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/" className="text-primary-100 hover:text-primary-500">Home</Link></li>
                <li><Link to="/collection" className="text-primary-100 hover:text-primary-500">Collection</Link></li>
                <li><Link to="/about" className="text-primary-100 hover:text-primary-500">About</Link></li>
                <li><Link to="/contact" className="text-primary-100 hover:text-primary-500">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4 text-primary-500">Categories</h4>
              <ul className="space-y-2">
                <li><Link to="/collection?category=electronics" className="text-primary-100 hover:text-primary-500">Electronics</Link></li>
                <li><Link to="/collection?category=books" className="text-primary-100 hover:text-primary-500">Books</Link></li>
                <li><Link to="/collection?category=furniture" className="text-primary-100 hover:text-primary-500">Furniture</Link></li>
                <li><Link to="/collection?category=clothing" className="text-primary-100 hover:text-primary-500">Clothing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-4 text-primary-500">Contact Info</h4>
              <p className="text-primary-100">
                Email: info@campusconnect.com<br />
                Phone: +1 (555) 123-4567<br />
                Address: Campus Address
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-black-700 text-center text-primary-100">
            <p>&copy; 2024 Campus Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Click outside to close dropdowns */}
      {(isProfileMenuOpen || isMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileMenuOpen(false);
            setIsMenuOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Layout; 