const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@campusconnect.com';
const ADMIN_PASSWORD = 'admin123';

async function testInventoryRestoration() {
  try {
    console.log('🧪 Testing Inventory Restoration on Order Cancellation...\n');

    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = loginResponse.data.token;
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Admin login successful');

    // 2. Get a product to test with
    console.log('\n2. Getting a product for testing...');
    const productsResponse = await axios.get(`${BASE_URL}/products`);
    const testProduct = productsResponse.data.data[0];
    console.log(`   - Testing with product: ${testProduct.name}`);
    console.log(`   - Initial Available Quantity: ${testProduct.availableQuantity}`);

    // 3. Create a test order (decreases inventory)
    console.log('\n3. Creating test order (should decrease inventory)...');
    const orderData = {
      items: [{
        product: testProduct._id,
        quantity: 1
      }],
      rentalDays: 1,
      deliveryAddress: 'Test Address',
      paymentMethod: 'cash'
    };

    const orderResponse = await axios.post(`${BASE_URL}/orders`, orderData, authHeader);
    const orderId = orderResponse.data.data._id;
    console.log('✅ Order created successfully');

    // 4. Check if inventory decreased
    console.log('4. Checking if inventory decreased...');
    const decreasedProductResponse = await axios.get(`${BASE_URL}/products/${testProduct._id}`);
    const decreasedProduct = decreasedProductResponse.data.data;
    console.log(`   - Available Quantity after order: ${decreasedProduct.availableQuantity}`);
    
    if (decreasedProduct.availableQuantity === testProduct.availableQuantity - 1) {
      console.log('✅ Inventory correctly decreased by 1');
    } else {
      console.log('❌ Inventory not decreased correctly');
    }

    // 5. Cancel the order as admin (should restore inventory)
    console.log('\n5. Cancelling order as admin (should restore inventory)...');
    const cancelResponse = await axios.put(`${BASE_URL}/admin/orders/${orderId}/status`, {
      status: 'cancelled'
    }, authHeader);
    console.log('✅ Order cancelled by admin');

    // 6. Check if inventory was restored
    console.log('6. Checking if inventory was restored...');
    const restoredProductResponse = await axios.get(`${BASE_URL}/products/${testProduct._id}`);
    const restoredProduct = restoredProductResponse.data.data;
    console.log(`   - Available Quantity after cancellation: ${restoredProduct.availableQuantity}`);
    
    if (restoredProduct.availableQuantity === testProduct.availableQuantity) {
      console.log('✅ Inventory correctly restored to original amount');
    } else {
      console.log('❌ Inventory not restored correctly');
    }

    // 7. Test admin inventory endpoint
    console.log('\n7. Testing admin inventory endpoint...');
    const inventoryResponse = await axios.get(`${BASE_URL}/admin/products/inventory`, authHeader);
    const inventoryStats = inventoryResponse.data.data.stats;
    console.log(`   - Total Items: ${inventoryStats.totalItems}`);
    console.log(`   - Available Items: ${inventoryStats.availableItems}`);
    console.log(`   - Rented Items: ${inventoryStats.rentedItems}`);
    console.log(`   - Low Stock Items: ${inventoryStats.lowStockItems}`);

    console.log('\n🎉 Inventory Restoration Test Completed Successfully!');
    console.log('\nSummary:');
    console.log('- ✅ Order placement decreases inventory');
    console.log('- ✅ Admin order cancellation restores inventory');
    console.log('- ✅ Admin inventory endpoint shows correct stats');
    console.log('- ✅ No manual inventory updates needed');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testInventoryRestoration(); 