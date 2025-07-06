import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { FiTrendingUp, FiSearch, FiPlus, FiMinus, FiAlertCircle, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const AdminInventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showReduceModal, setShowReduceModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockAmount, setRestockAmount] = useState('');
  const [reduceAmount, setReduceAmount] = useState('');
  const [actionType, setActionType] = useState('restock'); // 'restock' or 'reduce'
  const queryClient = useQueryClient();

  const { data: inventoryData, isLoading, error } = useQuery(
    ['admin-inventory', filter],
    async () => {
      const response = await axios.get('/api/admin/products/inventory');
      return response.data;
    },
    {
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  const restockMutation = useMutation(
    async ({ productId, quantity }) => {
      await axios.post(`/api/admin/products/${productId}/restock`, { quantity });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-inventory');
        toast.success('Stock updated successfully');
        setShowRestockModal(false);
        setSelectedProduct(null);
        setRestockAmount('');
      },
      onError: () => {
        toast.error('Failed to update stock');
      },
    }
  );

  const reduceStockMutation = useMutation(
    async ({ productId, quantity }) => {
      await axios.post(`/api/admin/products/${productId}/reduce-stock`, { quantity });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-inventory');
        toast.success('Stock reduced successfully');
        setShowReduceModal(false);
        setSelectedProduct(null);
        setReduceAmount('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reduce stock');
      },
    }
  );

  const filteredInventory = inventoryData?.data?.products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleRestock = () => {
    if (!restockAmount || restockAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    restockMutation.mutate({
      productId: selectedProduct._id,
      quantity: parseInt(restockAmount),
    });
  };

  const handleReduceStock = () => {
    if (!reduceAmount || reduceAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (parseInt(reduceAmount) > selectedProduct.availableQuantity) {
      toast.error('Cannot reduce more than available quantity');
      return;
    }
    if (parseInt(reduceAmount) > selectedProduct.totalQuantity) {
      toast.error('Cannot reduce more than total quantity');
      return;
    }
    reduceStockMutation.mutate({
      productId: selectedProduct._id,
      quantity: parseInt(reduceAmount),
    });
  };

  const getStockStatus = (availableQuantity) => {
    if (availableQuantity === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (availableQuantity <= 5) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    if (availableQuantity <= 10) return { status: 'Medium Stock', color: 'bg-orange-100 text-orange-800' };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' };
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error loading inventory</h2>
            <p className="text-gray-600">Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  const inventoryStats = inventoryData?.data?.stats || {
    totalItems: 0,
    availableItems: 0,
    rentedItems: 0,
    lowStockItems: 0
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory Control</h1>
          <p className="text-gray-600 mt-2">Monitor and manage your stock levels</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <FiPackage className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Total Items</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {inventoryStats.totalItems}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <FiTrendingUp className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Available Items</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {inventoryStats.availableItems}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <FiPackage className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Rented Items</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {inventoryStats.rentedItems}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                  <FiAlertCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Low Stock Items</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {inventoryStats.lowStockItems}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => setFilter('in-stock')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'in-stock'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                In Stock
              </button>
              <button
                onClick={() => setFilter('low-stock')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'low-stock'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Low Stock
              </button>
              <button
                onClick={() => setFilter('out-of-stock')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'out-of-stock'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Out of Stock
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Inventory List */}
        {filteredInventory.length > 0 ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Inventory ({filteredInventory.length} items)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((product) => {
                    const stockStatus = getStockStatus(product.availableQuantity);
                    return (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={product.images?.[0] || '/placeholder-product.svg'}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ₹{product.pricePerDay}/day
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {product.category.replace('-', ' ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.totalQuantity} units</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.availableQuantity} units</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                            {stockStatus.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowRestockModal(true);
                              }}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              <FiPlus className="mr-1 h-3 w-3" />
                              Restock
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowReduceModal(true);
                              }}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <FiMinus className="mr-1 h-3 w-3" />
                              Reduce
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiTrendingUp className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No inventory found</h2>
            <p className="text-gray-600">
              {searchTerm 
                ? `No items match "${searchTerm}"`
                : `No ${filter} items found.`
              }
            </p>
          </div>
        )}

        {/* Restock Modal */}
        {showRestockModal && selectedProduct && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Restock Product</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Product: {selectedProduct.name}</p>
                  <p className="text-sm text-gray-600">Current Total: {selectedProduct.totalQuantity} units</p>
                  <p className="text-sm text-gray-600">Available: {selectedProduct.availableQuantity} units</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Add
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowRestockModal(false);
                      setSelectedProduct(null);
                      setRestockAmount('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRestock}
                    disabled={restockMutation.isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {restockMutation.isLoading ? 'Updating...' : 'Update Stock'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reduce Stock Modal */}
        {showReduceModal && selectedProduct && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reduce Stock</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Product: {selectedProduct.name}</p>
                  <p className="text-sm text-gray-600">Current Total: {selectedProduct.totalQuantity} units</p>
                  <p className="text-sm text-gray-600">Available: {selectedProduct.availableQuantity} units</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Reduce
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={Math.min(selectedProduct.totalQuantity, selectedProduct.availableQuantity)}
                    value={reduceAmount}
                    onChange={(e) => setReduceAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter amount"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: {Math.min(selectedProduct.totalQuantity, selectedProduct.availableQuantity)} units
                  </p>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowReduceModal(false);
                      setSelectedProduct(null);
                      setReduceAmount('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReduceStock}
                    disabled={reduceStockMutation.isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {reduceStockMutation.isLoading ? 'Updating...' : 'Reduce Stock'}
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

export default AdminInventory; 