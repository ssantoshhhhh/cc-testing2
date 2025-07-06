import React from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { FiUsers, FiPackage, FiShoppingCart, FiTrendingUp, FiAlertCircle, FiCheckCircle, FiRefreshCw, FiX } from 'react-icons/fi';
import axios from '../../axios'; // use the custom axios instance

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { data: dashboardData, isLoading, refetch } = useQuery(
    'admin-dashboard',
    async () => {
      const response = await axios.get('/api/admin/dashboard');
      return response.data;
    },
    {
      retry: 2,
      refetchOnWindowFocus: true,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 0, // Consider data stale immediately
    }
  );

  const stats = dashboardData?.data?.stats;
  const recentOrders = dashboardData?.data?.recentOrders;
  const lowStockProducts = dashboardData?.data?.lowStockProducts;



  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FiAlertCircle },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: FiCheckCircle },
      delivered: { color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
      returned: { color: 'bg-gray-100 text-gray-800', icon: FiCheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FiAlertCircle },
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your rental platform.</p>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <FiRefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalUsers || 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-600">Registered users</span>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <FiShoppingCart className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalOrders || 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-600">Total orders placed (excluding cancelled)</span>
            </div>
          </div>

          {/* Cancelled Orders */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <FiAlertCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Cancelled Orders</p>
                <p className="text-2xl font-semibold text-red-600">{stats?.adminCancelledOrders || 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-red-600">Orders cancelled by admin</span>
            </div>
          </div>

          {/* User Cancelled Orders */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <FiX className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">User Cancelled</p>
                <p className="text-2xl font-semibold text-orange-600">{stats?.userCancelledOrders || 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-orange-600">Orders cancelled by users</span>
            </div>
          </div>

          {/* Active Rentals */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                  <FiPackage className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Active Rentals</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.activeRentals || 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-yellow-600">Currently active</span>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <FiTrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">₹{stats?.totalRevenue || 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600">Total revenue</span>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                  <FiAlertCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Pending Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.pendingOrders || 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-orange-600">Awaiting confirmation</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <FiAlertCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Overdue Rentals</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.overdueRentals || 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-red-600">Requires attention</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <FiPackage className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Total Products</p>
                <p className="text-2xl font-semibold text-gray-900">{stats?.totalProducts || 0}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-indigo-600">Available for rent</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <Link
                  to="/admin/orders"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  View All
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentOrders && recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.user?.name || 'Unknown User'} • {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(order.status)}
                        <span className="text-sm font-medium text-gray-900">
                          ₹{order.totalAmount || order.items.reduce((total, item) => total + (item.totalPrice || 0), 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <p className="text-gray-600">No recent orders</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-4">
              <Link
                to="/admin/products"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FiPackage className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Manage Products</p>
                  <p className="text-sm text-gray-600">Add, edit, or remove rental items</p>
                </div>
              </Link>

              <Link
                to="/admin/orders"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiShoppingCart className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Process Orders</p>
                  <p className="text-sm text-gray-600">Confirm and track rental orders</p>
                </div>
              </Link>

              <Link
                to="/admin/users"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FiUsers className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Manage Users</p>
                  <p className="text-sm text-gray-600">View and manage user accounts</p>
                </div>
              </Link>

              <Link
                to="/admin/inventory"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">Inventory Control</p>
                  <p className="text-sm text-gray-600">Monitor stock levels and restock</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Low Stock Products */}
        {lowStockProducts && lowStockProducts.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Low Stock Products</h2>
                <Link
                  to="/admin/inventory"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Manage Inventory
                </Link>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {lowStockProducts.map((product) => (
                <div key={product._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.images?.[0] || '/placeholder-product.svg'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">Available: {product.availableQuantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.availableQuantity === 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.availableQuantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts and Notifications */}
        {stats?.overdueRentals > 0 && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <FiAlertCircle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Overdue Rentals Alert</h3>
                <p className="text-red-700 mt-1">
                  You have {stats.overdueRentals} overdue rentals that need attention. 
                  <Link to="/admin/orders" className="ml-2 underline hover:no-underline">
                    View overdue orders
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {lowStockProducts && lowStockProducts.length > 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <FiAlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-yellow-800">Low Stock Alert</h3>
                <p className="text-yellow-700 mt-1">
                  {lowStockProducts.length} items are running low on stock. 
                  <Link to="/admin/inventory" className="ml-2 underline hover:no-underline">
                    Check inventory
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 