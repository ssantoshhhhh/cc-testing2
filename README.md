# Campus Connect - Campus Marketplace Platform

A full-stack web application for buying and selling items at the campus level. Built with React.js, Node.js, Express.js, and MongoDB.

## 🌟 Features

### User Features
- **User Authentication**: Register, login, forgot password, reset password
- **Product Browsing**: View and search through available items
- **Marketplace Management**: List items for sale, contact sellers, manage transactions
- **Profile Management**: Update personal information and view marketplace statistics
- **Responsive Design**: Mobile-friendly interface

### Admin Features
- **Dashboard**: Overview of users, transactions, and marketplace activity
- **User Management**: View and manage user accounts
- **Product Management**: Add, edit, and manage marketplace listings
- **Transaction Monitoring**: Track marketplace activity and user interactions
- **Content Moderation**: Monitor and manage reported items

## 🛠️ Tech Stack

### Frontend
- **React.js** - User interface framework
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React Hook Form** - Form handling and validation

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Bcryptjs** - Password hashing

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd campus-connect

# Install all dependencies
npm run install-all
```

### 2. Environment Configuration

Create `server/config.env`:
```env
PORT=8000
MONGODB_URI=mongodb://localhost:27017/campus_connect
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
JWT_EXPIRE=7d
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
CLIENT_URL=http://localhost:3000
```

### 3. Database Setup
```bash
# Start MongoDB
mongod

# Seed the database
cd server
node seed.js
```

### 4. Start the Application
```bash
# Development mode (both frontend and backend)
npm run dev
```

## 🚀 Quick Start

1. **Start the application**: `npm run dev`
2. **Open your browser**: Navigate to `http://localhost:3000`
3. **Login with demo accounts**:
   - **Admin**: admin@campusconnect.com / admin123
   - **User**: john@example.com / password123

## 📱 Usage Guide

### For Users
1. **Register/Login**: Create an account or sign in
2. **Browse Products**: View available items for sale
3. **Contact Sellers**: Message sellers directly through the platform
4. **List Items**: Add your own items for sale
5. **Manage Transactions**: Track your buying and selling activity

### For Admins
1. **Access Admin Panel**: Login with admin credentials
2. **Manage Listings**: Monitor and moderate marketplace content
3. **User Management**: View and manage user accounts
4. **Transaction Monitoring**: Track marketplace activity

## 🎨 Design System

### Color Palette
- **Primary Green**: #28a745
- **Background**: #f8f9fa
- **Text**: #111827

### Features
- **Responsive Design**: Mobile-first approach
- **Green & White Theme**: Clean and professional look
- **Modern UI**: Card-based layouts with shadows
- **Interactive Elements**: Hover effects and transitions

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for password security
- **Input Validation**: Server-side validation for all inputs
- **Protected Routes**: Role-based access control

## 📄 License

This project is licensed under the MIT License.

---

**Campus Connect** - Making campus buying and selling simple and efficient for students. 