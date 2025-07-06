# Inventory Management System

This document describes the comprehensive inventory management system implemented in the e-commerce rental platform.

## Overview

The inventory management system automatically tracks product availability, decreases stock when orders are placed, increases stock when items are returned, and prevents orders when items are out of stock.

## Features

### 1. Automatic Inventory Tracking

- **Order Placement**: When an order is placed, the system automatically decreases the `availableQuantity` for each product
- **Order Return**: When items are returned, the system increases the `availableQuantity` back to inventory
- **Order Cancellation**: When orders are cancelled, the system restores the `availableQuantity`

### 2. Out of Stock Management

- **Frontend Display**: Products with `availableQuantity = 0` show "Out of Stock" status
- **Order Prevention**: Users cannot place orders for out-of-stock items
- **Visual Indicators**: Red overlays and disabled buttons for out-of-stock products

### 3. Admin Inventory Management

- **Inventory Dashboard**: Real-time view of all product inventory levels
- **Restock Functionality**: Admins can add more items to inventory
- **Low Stock Alerts**: Automatic detection of products with low stock (≤5 items)
- **Statistics**: Total items, available items, rented items, and low stock items

## Database Schema

### Product Model
```javascript
{
  name: String,
  description: String,
  category: String,
  pricePerDay: Number,
  totalQuantity: Number,      // Total items owned
  availableQuantity: Number,  // Items currently available
  images: [String],
  isActive: Boolean
}
```

## API Endpoints

### Order Management
- `POST /api/orders` - Place order (decreases inventory)
- `PUT /api/orders/:id/return` - Return items (increases inventory)
- `PUT /api/orders/:id/cancel` - Cancel order (restores inventory)

### Admin Inventory
- `GET /api/admin/products/inventory` - Get inventory status
- `POST /api/admin/products/:id/restock` - Add items to inventory

## Frontend Components

### 1. Product Display

#### ProductDetail.js
- Shows "Out of Stock" overlay on product images
- Disables rental options for out-of-stock items
- Shows "Out of Stock" instead of available quantity
- Disables "Add to Cart" and "Rent Now" buttons

#### Collection.js
- Shows "Out of Stock" overlay on product cards
- Disables "View" button for out-of-stock items
- Shows "Out of Stock" status in product info

### 2. Cart Management

#### CartContext.js
- Validates available quantity before adding to cart
- Shows error messages for insufficient stock
- Prevents adding more items than available

### 3. Order Management

#### OrderDetail.js
- Return button for confirmed/rented orders
- Automatic inventory restoration on return
- Penalty calculation for late returns

### 4. Admin Interface

#### Inventory.js
- Real-time inventory dashboard
- Restock functionality
- Low stock alerts
- Inventory statistics

## Workflow

### Order Placement
1. User selects products and quantities
2. System validates available quantity
3. If sufficient stock, order is created
4. `availableQuantity` is decreased for each product
5. Order confirmation sent

### Order Return
1. User clicks "Return Items" button
2. System validates order status
3. Order status changed to "returned"
4. `availableQuantity` is increased for each product
5. Penalty calculated if overdue

### Order Cancellation
1. User cancels order (within 10 minutes)
2. Order status changed to "cancelled"
3. `availableQuantity` is restored for each product

## Error Handling

### Insufficient Stock
- Frontend validation prevents adding more than available
- Backend validation rejects orders with insufficient stock
- Clear error messages to users

### Out of Stock Items
- Visual indicators on product pages
- Disabled action buttons
- Clear "Out of Stock" messaging

## Testing

Run the test script to verify functionality:
```bash
node test-inventory-management.js
```

The test verifies:
- Order placement decreases inventory
- Order return increases inventory
- Out of stock validation
- Frontend display updates

## Security

- Inventory validation on both frontend and backend
- Admin-only access to inventory management
- Proper error handling and user feedback
- Transaction safety for inventory updates

## Monitoring

### Admin Dashboard
- Real-time inventory statistics
- Low stock alerts
- Recent order activity
- Inventory trends

### Alerts
- Low stock notifications (≤5 items)
- Out of stock notifications
- Overdue return reminders

## Future Enhancements

1. **Automated Alerts**: Email notifications for low stock
2. **Inventory Forecasting**: Predict stock needs based on trends
3. **Bulk Operations**: Mass restock functionality
4. **Inventory History**: Track inventory changes over time
5. **Reservation System**: Allow pre-booking of items

## Configuration

### Environment Variables
- `EMAIL_USER`: For admin notifications
- `EMAIL_PASS`: For admin notifications

### Thresholds
- Low Stock: ≤5 items
- Medium Stock: ≤10 items
- Out of Stock: 0 items

## Troubleshooting

### Common Issues

1. **Inventory Not Updating**
   - Check order status in database
   - Verify product IDs match
   - Check for transaction errors

2. **Out of Stock Items Still Available**
   - Clear browser cache
   - Check if product is active
   - Verify inventory calculations

3. **Admin Can't Restock**
   - Verify admin permissions
   - Check API endpoint
   - Validate request data

### Debug Commands
```bash
# Check product inventory
curl http://localhost:5000/api/products

# Check admin inventory
curl -H "Authorization: Bearer <admin-token>" http://localhost:5000/api/admin/products/inventory

# Test order placement
curl -X POST -H "Authorization: Bearer <user-token>" http://localhost:5000/api/orders
```

## Support

For issues with the inventory management system:
1. Check the logs for error messages
2. Verify database connectivity
3. Test with the provided test script
4. Contact the development team

---

*Last updated: December 2024* 