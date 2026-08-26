import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Pharmacy from '../models/Pharmacy.js';
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import DirectOrder from '../models/DirectOrder.js';
import { addToCart, updateCartItem, getCart } from '../controllers/cartController.js';
import { placeOrder } from '../controllers/directOrderController.js';

// Helper mock response
function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

async function runTests() {
  console.log('--- Connecting to MongoDB ---');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB successfully.');

  let testUser1;
  let testUser2;
  let testPharmacy;
  let testMedicine1;
  let testMedicine2;

  try {
    // 0. Cleanup previous test data if any
    await User.deleteMany({ email: { $in: ['test_stock_user1@test.com', 'test_stock_user2@test.com'] } });
    await Pharmacy.deleteMany({ email: 'test_stock_pharmacy@test.com' });

    testUser1 = await User.create({
      name: 'Test Stock User 1',
      email: 'test_stock_user1@test.com',
      password: 'Password123!',
      role: 'user',
      address: '123 Main St',
      phone: '0771234567',
    });

    testUser2 = await User.create({
      name: 'Test Stock User 2',
      email: 'test_stock_user2@test.com',
      password: 'Password123!',
      role: 'user',
      address: '456 Elm St',
      phone: '0779876543',
    });

    testPharmacy = await Pharmacy.create({
      pharmacyName: 'Test Stock Validation Pharmacy',
      ownerName: 'Test Owner',
      email: 'test_stock_pharmacy@test.com',
      password: 'Password123!',
      phone: '0112345678',
      address: '789 Pharmacy St',
      city: 'Colombo',
      district: 'Colombo',
      location: { type: 'Point', coordinates: [79.8612, 6.9271] },
      licenseNumber: 'PHARM-TEST-999',
      status: 'approved',
      inventory: [
        {
          medicineName: 'Paracetamol 500mg',
          category: 'Pain Relief',
          price: 15.0,
          quantity: 10,
        },
        {
          medicineName: 'Amoxicillin 250mg',
          category: 'Antibiotics',
          price: 45.0,
          quantity: 0, // Out of stock initially
        },
      ],
    });

    testMedicine1 = testPharmacy.inventory[0];
    testMedicine2 = testPharmacy.inventory[1];

    console.log('\n================ TEST CASES ================');

    // -------------------------------------------------------------
    // TEST 1: Stock = 10, user buys 5 -> Purchase allowed, stock becomes 5
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Stock = 10, user buys 5');
    {
      const reqAdd = {
        user: testUser1,
        body: {
          pharmacyId: testPharmacy._id.toString(),
          inventoryItemId: testMedicine1._id.toString(),
          quantity: 5,
        },
      };
      const resAdd = createMockRes();
      await addToCart(reqAdd, resAdd);
      console.log('  -> Added 5 to cart. Cart items:', resAdd.data.data.items.length);

      const reqOrder = {
        user: testUser1,
        body: {
          pharmacyId: testPharmacy._id.toString(),
          customerName: 'Test User',
          deliveryAddress: '123 Main St',
          contactNumber: '0771234567',
        },
      };
      const resOrder = createMockRes();
      await placeOrder(reqOrder, resOrder);

      if (resOrder.statusCode === 201) {
        console.log('  -> ✅ Purchase allowed. Order created ID:', resOrder.data.data._id);
      } else {
        throw new Error(`Test 1 Failed: Expected status 201, got ${resOrder.statusCode}`);
      }

      const updatedPharm = await Pharmacy.findById(testPharmacy._id);
      const updatedItem = updatedPharm.inventory.id(testMedicine1._id);
      console.log('  -> Database stock after purchase:', updatedItem.quantity);
      if (updatedItem.quantity !== 5) {
        throw new Error(`Test 1 Failed: Expected stock 5, got ${updatedItem.quantity}`);
      }
      console.log('  -> ✅ Test 1 PASSED: Stock correctly deducted to 5');
    }

    // -------------------------------------------------------------
    // TEST 2: Stock = 5, user buys 5 -> Purchase allowed, stock becomes 0
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Stock = 5, user buys remaining 5');
    {
      const reqAdd = {
        user: testUser1,
        body: {
          pharmacyId: testPharmacy._id.toString(),
          inventoryItemId: testMedicine1._id.toString(),
          quantity: 5,
        },
      };
      const resAdd = createMockRes();
      await addToCart(reqAdd, resAdd);

      const reqOrder = {
        user: testUser1,
        body: {
          pharmacyId: testPharmacy._id.toString(),
          customerName: 'Test User',
          deliveryAddress: '123 Main St',
          contactNumber: '0771234567',
        },
      };
      const resOrder = createMockRes();
      await placeOrder(reqOrder, resOrder);

      if (resOrder.statusCode === 201) {
        console.log('  -> ✅ Purchase allowed. Order created ID:', resOrder.data.data._id);
      } else {
        throw new Error(`Test 2 Failed: Expected status 201, got ${resOrder.statusCode}`);
      }

      const updatedPharm = await Pharmacy.findById(testPharmacy._id);
      const updatedItem = updatedPharm.inventory.id(testMedicine1._id);
      console.log('  -> Database stock after purchase:', updatedItem.quantity);
      if (updatedItem.quantity !== 0) {
        throw new Error(`Test 2 Failed: Expected stock 0, got ${updatedItem.quantity}`);
      }
      console.log('  -> ✅ Test 2 PASSED: Stock correctly deducted to 0');
    }

    // -------------------------------------------------------------
    // Reset stock to 10 for subsequent tests
    // -------------------------------------------------------------
    await Pharmacy.updateOne(
      { _id: testPharmacy._id, 'inventory._id': testMedicine1._id },
      { $set: { 'inventory.$.quantity': 10 } }
    );

    // -------------------------------------------------------------
    // TEST 3: Stock = 10, user tries to buy 11 -> Blocked
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Stock = 10, user tries to add/buy 11');
    {
      let caughtError = null;
      try {
        const reqAdd = {
          user: testUser1,
          body: {
            pharmacyId: testPharmacy._id.toString(),
            inventoryItemId: testMedicine1._id.toString(),
            quantity: 11,
          },
        };
        const resAdd = createMockRes();
        await addToCart(reqAdd, resAdd);
      } catch (err) {
        caughtError = err;
      }

      if (caughtError && caughtError.message.includes('Only 10 items are available in stock.')) {
        console.log('  -> ✅ addToCart correctly blocked with:', caughtError.message);
      } else {
        throw new Error(`Test 3 Failed on addToCart: Expected "Only 10 items are available in stock.", got "${caughtError?.message}"`);
      }

      // Also test direct order if cart somehow had 11
      await Cart.findOneAndUpdate(
        { userId: testUser1._id },
        {
          $set: {
            items: [
              {
                pharmacyId: testPharmacy._id,
                pharmacyName: testPharmacy.pharmacyName,
                inventoryItemId: testMedicine1._id,
                medicineName: testMedicine1.medicineName,
                unitPrice: testMedicine1.price,
                quantity: 11,
              },
            ],
          },
        },
        { upsert: true }
      );

      let orderError = null;
      try {
        const reqOrder = {
          user: testUser1,
          body: {
            pharmacyId: testPharmacy._id.toString(),
            customerName: 'Test User',
            deliveryAddress: '123 Main St',
            contactNumber: '0771234567',
          },
        };
        const resOrder = createMockRes();
        await placeOrder(reqOrder, resOrder);
      } catch (err) {
        orderError = err;
      }

      if (orderError && orderError.message.includes('Only 10 items are available in stock.')) {
        console.log('  -> ✅ placeOrder correctly blocked with:', orderError.message);
      } else {
        throw new Error(`Test 3 Failed on placeOrder: Expected "Only 10 items are available in stock.", got "${orderError?.message}"`);
      }

      const pharm = await Pharmacy.findById(testPharmacy._id);
      const item = pharm.inventory.id(testMedicine1._id);
      if (item.quantity !== 10) {
        throw new Error(`Test 3 Failed: Stock should remain 10, got ${item.quantity}`);
      }
      console.log('  -> ✅ Test 3 PASSED');
    }

    // -------------------------------------------------------------
    // TEST 4: Stock = 0 -> Blocked with "This item is currently out of stock."
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Stock = 0, user tries to add/buy');
    {
      let caughtError = null;
      try {
        const reqAdd = {
          user: testUser1,
          body: {
            pharmacyId: testPharmacy._id.toString(),
            inventoryItemId: testMedicine2._id.toString(), // Medicine 2 has quantity 0
            quantity: 1,
          },
        };
        const resAdd = createMockRes();
        await addToCart(reqAdd, resAdd);
      } catch (err) {
        caughtError = err;
      }

      if (caughtError && caughtError.message.includes('This item is currently out of stock.')) {
        console.log('  -> ✅ addToCart correctly blocked with:', caughtError.message);
      } else {
        throw new Error(`Test 4 Failed: Expected "This item is currently out of stock.", got "${caughtError?.message}"`);
      }
      console.log('  -> ✅ Test 4 PASSED');
    }

    // -------------------------------------------------------------
    // TEST 5: Cart has qty 5 when stock was 10. Later stock drops to 3. User tries to buy 5.
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Cart has 5, stock changed to 3, user checks out');
    {
      // Prepare cart with 5
      await Cart.findOneAndUpdate(
        { userId: testUser1._id },
        {
          $set: {
            items: [
              {
                pharmacyId: testPharmacy._id,
                pharmacyName: testPharmacy.pharmacyName,
                inventoryItemId: testMedicine1._id,
                medicineName: testMedicine1.medicineName,
                unitPrice: testMedicine1.price,
                quantity: 5,
              },
            ],
          },
        },
        { upsert: true }
      );

      // Change DB stock to 3
      await Pharmacy.updateOne(
        { _id: testPharmacy._id, 'inventory._id': testMedicine1._id },
        { $set: { 'inventory.$.quantity': 3 } }
      );

      let orderError = null;
      try {
        const reqOrder = {
          user: testUser1,
          body: {
            pharmacyId: testPharmacy._id.toString(),
            customerName: 'Test User',
            deliveryAddress: '123 Main St',
            contactNumber: '0771234567',
          },
        };
        const resOrder = createMockRes();
        await placeOrder(reqOrder, resOrder);
      } catch (err) {
        orderError = err;
      }

      if (orderError && orderError.message.includes('Only 3 items are available in stock.')) {
        console.log('  -> ✅ placeOrder correctly blocked with:', orderError.message);
      } else {
        throw new Error(`Test 5 Failed: Expected "Only 3 items are available in stock.", got "${orderError?.message}"`);
      }

      const pharm = await Pharmacy.findById(testPharmacy._id);
      const item = pharm.inventory.id(testMedicine1._id);
      if (item.quantity !== 3) {
        throw new Error(`Test 5 Failed: Stock should remain 3, got ${item.quantity}`);
      }
      console.log('  -> ✅ Test 5 PASSED');
    }

    // -------------------------------------------------------------
    // TEST 6: Concurrency & Race Condition Test (2 users try to buy 4 when stock = 5)
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Concurrency test: Stock = 5, User 1 and User 2 both try to buy 4 simultaneously');
    {
      // Set stock to 5
      await Pharmacy.updateOne(
        { _id: testPharmacy._id, 'inventory._id': testMedicine1._id },
        { $set: { 'inventory.$.quantity': 5 } }
      );

      // Set carts for User 1 and User 2
      await Cart.findOneAndUpdate(
        { userId: testUser1._id },
        {
          $set: {
            items: [
              {
                pharmacyId: testPharmacy._id,
                pharmacyName: testPharmacy.pharmacyName,
                inventoryItemId: testMedicine1._id,
                medicineName: testMedicine1.medicineName,
                unitPrice: testMedicine1.price,
                quantity: 4,
              },
            ],
          },
        },
        { upsert: true }
      );

      await Cart.findOneAndUpdate(
        { userId: testUser2._id },
        {
          $set: {
            items: [
              {
                pharmacyId: testPharmacy._id,
                pharmacyName: testPharmacy.pharmacyName,
                inventoryItemId: testMedicine1._id,
                medicineName: testMedicine1.medicineName,
                unitPrice: testMedicine1.price,
                quantity: 4,
              },
            ],
          },
        },
        { upsert: true }
      );

      const runOrder1 = async () => {
        try {
          const req = {
            user: testUser1,
            body: {
              pharmacyId: testPharmacy._id.toString(),
              customerName: 'User 1',
              deliveryAddress: '123 St',
              contactNumber: '0771111111',
            },
          };
          const res = createMockRes();
          await placeOrder(req, res);
          return { success: true, user: 'User 1' };
        } catch (err) {
          return { success: false, user: 'User 1', error: err.message };
        }
      };

      const runOrder2 = async () => {
        try {
          const req = {
            user: testUser2,
            body: {
              pharmacyId: testPharmacy._id.toString(),
              customerName: 'User 2',
              deliveryAddress: '456 St',
              contactNumber: '0772222222',
            },
          };
          const res = createMockRes();
          await placeOrder(req, res);
          return { success: true, user: 'User 2' };
        } catch (err) {
          return { success: false, user: 'User 2', error: err.message };
        }
      };

      const [res1, res2] = await Promise.all([runOrder1(), runOrder2()]);

      console.log('  -> Result User 1:', res1);
      console.log('  -> Result User 2:', res2);

      const successCount = (res1.success ? 1 : 0) + (res2.success ? 1 : 0);
      const failCount = (!res1.success ? 1 : 0) + (!res2.success ? 1 : 0);

      if (successCount !== 1 || failCount !== 1) {
        throw new Error(`Test 6 Failed: Expected exactly 1 success and 1 failure, got ${successCount} success and ${failCount} failure`);
      }

      const pharm = await Pharmacy.findById(testPharmacy._id);
      const item = pharm.inventory.id(testMedicine1._id);
      console.log('  -> Final database stock after concurrent purchases:', item.quantity);

      if (item.quantity !== 1) {
        throw new Error(`Test 6 Failed: Expected remaining stock 1, got ${item.quantity}`);
      }

      if (item.quantity < 0) {
        throw new Error(`Test 6 Failed: Stock became negative! ${item.quantity}`);
      }

      console.log('  -> ✅ Test 6 PASSED: Concurrency handled safely, stock never negative');
    }

    // -------------------------------------------------------------
    // TEST 7: Cart Quantity Update Validation
    // -------------------------------------------------------------
    console.log('\n[TEST 7] updateCartItem validation against live stock');
    {
      // Stock is currently 1 for testMedicine1
      const cart = await Cart.findOne({ userId: testUser1._id });
      // Clear cart and add 1
      await Cart.findOneAndUpdate(
        { userId: testUser1._id },
        {
          $set: {
            items: [
              {
                pharmacyId: testPharmacy._id,
                pharmacyName: testPharmacy.pharmacyName,
                inventoryItemId: testMedicine1._id,
                medicineName: testMedicine1.medicineName,
                unitPrice: testMedicine1.price,
                quantity: 1,
              },
            ],
          },
        },
        { upsert: true }
      );

      const userCart = await Cart.findOne({ userId: testUser1._id });
      const cartItemId = userCart.items[0]._id.toString();

      let updateError = null;
      try {
        const reqUpdate = {
          user: testUser1,
          params: { itemId: cartItemId },
          body: { quantity: 5 }, // stock is 1
        };
        const resUpdate = createMockRes();
        await updateCartItem(reqUpdate, resUpdate);
      } catch (err) {
        updateError = err;
      }

      if (updateError && updateError.message.includes('Only 1 items are available in stock.')) {
        console.log('  -> ✅ updateCartItem correctly blocked with:', updateError.message);
      } else {
        throw new Error(`Test 7 Failed: Expected "Only 1 items are available in stock.", got "${updateError?.message}"`);
      }

      console.log('  -> ✅ Test 7 PASSED');
    }

    console.log('\n🎉 ALL 7 TEST CASES PASSED SUCCESSFULLY!');
  } finally {
    // Cleanup test data
    console.log('\n--- Cleaning up test fixtures ---');
    if (testUser1) {
      await Cart.deleteOne({ userId: testUser1._id });
      await DirectOrder.deleteMany({ userId: testUser1._id });
      await User.deleteOne({ _id: testUser1._id });
    }
    if (testUser2) {
      await Cart.deleteOne({ userId: testUser2._id });
      await DirectOrder.deleteMany({ userId: testUser2._id });
      await User.deleteOne({ _id: testUser2._id });
    }
    if (testPharmacy) {
      await Pharmacy.deleteOne({ _id: testPharmacy._id });
    }
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed with Error:\n', err);
  process.exit(1);
});
