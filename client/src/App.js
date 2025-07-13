import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Layout from './components/Layout';
import ScrollToTop from './ScrollToTop';

// Pages
import Home from './pages/Home';
import Collection from './pages/Collection';
import About from './pages/About';
import Contact from './pages/Contact';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';

// Marketplace Pages
import SellerDashboard from './pages/SellerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import AddProduct from './pages/AddProduct';
import Chats from './pages/Chats';
import BuyRequests from './pages/BuyRequests';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminProducts from './pages/admin/Products';

function App() {
  return (
    <AuthProvider>
        <ScrollToTop />
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/collection" element={<Collection />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            
            {/* Protected Routes */}
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
          
          {/* Marketplace Routes */}
          <Route path="/seller-dashboard" element={
            <PrivateRoute>
              <SellerDashboard />
            </PrivateRoute>
          } />
          <Route path="/buyer-dashboard" element={
              <PrivateRoute>
              <BuyerDashboard />
              </PrivateRoute>
            } />
          <Route path="/add-product" element={
              <PrivateRoute>
              <AddProduct />
              </PrivateRoute>
            } />
          <Route path="/chats" element={
              <PrivateRoute>
              <Chats />
              </PrivateRoute>
            } />
          <Route path="/buy-requests" element={
              <PrivateRoute>
              <BuyRequests />
              </PrivateRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            } />
            <Route path="/admin/products" element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            } />
          </Routes>
        </Layout>
    </AuthProvider>
  );
}

export default App; 