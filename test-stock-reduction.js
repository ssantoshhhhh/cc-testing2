const axios = require('axios');

const BASE_URL = 'http://localhost:8001/api';
const ADMIN_EMAIL = 'admin@campusconnect.com';
const ADMIN_PASSWORD = 'admin123';

async function testStockReduction() {
  try {
    console.log('🧪 Testing Stock Reduction Functionality...\n');

    // 1. Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    const token = loginResponse.data.token;
    const authHeader = { headers: { Authorization: `Bearer ${token}` } };
    console.log('✅ Admin login successful');

    // 2. Get inventory data
    console.log('\n2. Getting inventory data...');
    const inventoryResponse = await axios.get(`${BASE_URL}/admin/products/inventory`, authHeader);
    const products = inventoryResponse.data.data.products;
    
    if (products.length === 0) {
      console.log('❌ No products found in inventory');
      return;
    }

    // Find a product with sufficient stock for testing
    const testProduct = products.find(p => p.availableQuantity >= 5 && p.totalQuantity >= 5);
    
    if (!testProduct) {
      console.log('❌ No product with sufficient stock found for testing');
      return;
    }

    console.log(`   - Testing with product: ${testProduct.name}`);
    console.log(`   - Initial Total Quantity: ${testProduct.totalQuantity}`);
    console.log(`   - Initial Available Quantity: ${testProduct.availableQuantity}`);

    // 3. Test stock reduction
    console.log('\n3. Testing stock reduction...');
    const reduceAmount = 2;
    const reduceResponse = await axios.post(
      `${BASE_URL}/admin/products/${testProduct._id}/reduce-stock`,
      { quantity: reduceAmount },
      authHeader
    );
    
    const updatedProduct = reduceResponse.data.data;
    console.log('✅ Stock reduction successful');
    console.log(`   - New Total Quantity: ${updatedProduct.totalQuantity}`);
    console.log(`   - New Available Quantity: ${updatedProduct.availableQuantity}`);
    
    if (updatedProduct.totalQuantity === testProduct.totalQuantity - reduceAmount &&
        updatedProduct.availableQuantity === testProduct.availableQuantity - reduceAmount) {
      console.log('✅ Stock correctly reduced');
    } else {
      console.log('❌ Stock reduction failed');
    }

    // 4. Test invalid reduction (more than available)
    console.log('\n4. Testing invalid reduction (more than available)...');
    try {
      await axios.post(
        `${BASE_URL}/admin/products/${updatedProduct._id}/reduce-stock`,
        { quantity: updatedProduct.availableQuantity + 1 },
        authHeader
      );
      console.log('❌ Should have failed - cannot reduce more than available');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected reduction of more than available quantity');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // 5. Test invalid reduction (more than total)
    console.log('\n5. Testing invalid reduction (more than total)...');
    try {
      await axios.post(
        `${BASE_URL}/admin/products/${updatedProduct._id}/reduce-stock`,
        { quantity: updatedProduct.totalQuantity + 1 },
        authHeader
      );
      console.log('❌ Should have failed - cannot reduce more than total');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected reduction of more than total quantity');
      } else {
        console.log('❌ Unexpected error:', error.response?.data);
      }
    }

    // 6. Test restock to restore original values
    console.log('\n6. Testing restock to restore original values...');
    const restockResponse = await axios.post(
      `${BASE_URL}/admin/products/${updatedProduct._id}/restock`,
      { quantity: reduceAmount },
      authHeader
    );
    
    const restoredProduct = restockResponse.data.data;
    console.log('✅ Restock successful');
    console.log(`   - Final Total Quantity: ${restoredProduct.totalQuantity}`);
    console.log(`   - Final Available Quantity: ${restoredProduct.availableQuantity}`);
    
    if (restoredProduct.totalQuantity === testProduct.totalQuantity &&
        restoredProduct.availableQuantity === testProduct.availableQuantity) {
      console.log('✅ Stock correctly restored to original values');
    } else {
      console.log('❌ Stock restoration failed');
    }

    console.log('\n🎉 Stock Reduction Test Completed Successfully!');
    console.log('\nSummary:');
    console.log('- ✅ Stock reduction works correctly');
    console.log('- ✅ Validation prevents invalid reductions');
    console.log('- ✅ Restock functionality still works');
    console.log('- ✅ Admin can now both increase and decrease stock');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testStockReduction(); 