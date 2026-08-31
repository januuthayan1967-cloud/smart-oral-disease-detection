import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Pharmacy from '../models/Pharmacy.js';
import User from '../models/User.js';
import Prescription from '../models/Prescription.js';
import Dentist from '../models/Dentist.js';
import Payment from '../models/Payment.js';
import MedicineOrder from '../models/MedicineOrder.js';
import DirectOrder from '../models/DirectOrder.js';
import OrderTrackingHistory from '../models/OrderTrackingHistory.js';
import {
  sendPrescriptionToPharmacy,
  getOrderHistory,
  getOrderById,
  getOrderTracking,
  cancelOrder,
  confirmOrder,
} from '../controllers/orderController.js';
import {
  acceptOrder,
  updateOrderStatus,
  updateDirectOrderStatus,
} from '../controllers/pharmacyController.js';
import {
  placeOrder,
  getMyOrders,
  getDirectOrderTracking,
} from '../controllers/directOrderController.js';
import Cart from '../models/Cart.js';

// Helper mock response builder
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
  console.log('Connected to MongoDB successfully.\n');

  let testUser;
  let unauthorizedUser;
  let testPharmacy;
  let testDentistUser;
  let testDentistProfile;
  let testPrescription;

  try {
    // 0. Cleanup previous test data
    console.log('--- Cleaning up previous test data ---');
    await User.deleteMany({
      email: {
        $in: [
          'track_test_user@test.com',
          'track_unauthorized_user@test.com',
          'track_dentist@test.com',
          'track_pharmacy_user@test.com',
        ],
      },
    });
    await Pharmacy.deleteMany({ email: 'track_test_pharmacy@test.com' });
    await Prescription.deleteMany({ patientName: 'Track Test User' });
    await OrderTrackingHistory.deleteMany({ message: { $regex: /Track Test/i } });

    // 1. Create seed entities
    testUser = await User.create({
      name: 'Track Test User',
      email: 'track_test_user@test.com',
      password: 'Password123!',
      role: 'user',
      address: '123 Test Avenue, Colombo',
      phone: '0771234567',
    });

    unauthorizedUser = await User.create({
      name: 'Unauthorized User',
      email: 'track_unauthorized_user@test.com',
      password: 'Password123!',
      role: 'user',
      address: '999 Other St',
      phone: '0779999999',
    });

    testDentistUser = await User.create({
      name: 'Dr. Track Dentist',
      email: 'track_dentist@test.com',
      password: 'Password123!',
      role: 'dentist',
    });

    testDentistProfile = await Dentist.create({
      userId: testDentistUser._id,
      name: 'Dr. Track Dentist',
      email: 'track_dentist@test.com',
      qualification: 'BDS, MDS',
      specialization: 'Orthodontics',
      experience: 10,
      phone: '0771234568',
      professionalLicenseNumber: 'DEN-TRACK-001',
    });

    testPharmacy = await Pharmacy.create({
      pharmacyName: 'Track City Care Pharmacy',
      ownerName: 'Pharmacy Manager',
      email: 'track_test_pharmacy@test.com',
      password: 'Password123!',
      phone: '0119876543',
      address: '456 Pharmacy Road',
      city: 'Colombo',
      district: 'Colombo',
      location: { type: 'Point', coordinates: [79.8612, 6.9271] },
      licenseNumber: 'PHARM-TRACK-001',
      status: 'approved',
      inventory: [
        {
          medicineName: 'Amoxicillin 500mg',
          category: 'Antibiotics',
          price: 50.0,
          quantity: 100,
        },
        {
          medicineName: 'Paracetamol 500mg',
          category: 'Pain Relief',
          price: 20.0,
          quantity: 100,
        },
      ],
    });

    testPrescription = await Prescription.create({
      patientId: testUser._id,
      dentistId: testDentistProfile._id,
      patientName: 'Track Test User',
      diagnosis: 'Dental Infection',
      prescriptionFee: 500,
      paymentStatus: 'paid',
      medicines: [
        {
          medicineName: 'Amoxicillin 500mg',
          dosage: '1 tablet 3x daily',
          frequency: '3 times daily',
          duration: '5 days',
          quantity: 10,
          instructions: 'Take after meals',
        },
      ],
    });

    const testPayment = await Payment.create({
      userId: testUser._id,
      orderId: testPrescription._id,
      orderType: 'prescription',
      amount: 500,
      method: 'card',
      status: 'paid',
      paidAt: new Date(),
    });
    testPrescription.paymentId = testPayment._id;
    await testPrescription.save();

    console.log('Seed entities created successfully.\n');
    console.log('================== RUNNING TEST CASES ==================\n');

    let placedOrderId;

    // ─────────────────────────────────────────────────────────────
    // TC01: User places pharmacy order → tracking history contains initial order event
    // ─────────────────────────────────────────────────────────────
    console.log('👉 [TC01] User places pharmacy order → tracking history contains initial order event');
    {
      const req = {
        user: testUser,
        body: {
          prescriptionId: testPrescription._id.toString(),
          pharmacyId: testPharmacy._id.toString(),
          deliveryAddress: '123 Test Avenue, Colombo',
          paymentMethod: 'cod',
        },
      };
      const res = createMockRes();
      await sendPrescriptionToPharmacy(req, res);

      if (res.statusCode !== 201) {
        throw new Error(`TC01 Failed: Expected status 201, got ${res.statusCode}`);
      }

      placedOrderId = res.data.data._id;
      const initialStatus = res.data.data.status;
      console.log(`  ✓ Order created successfully. Order ID: ${placedOrderId}, Status: ${initialStatus}`);

      if (initialStatus !== 'pending') {
        throw new Error(`TC01 Failed: Expected initial status 'pending', got '${initialStatus}'`);
      }

      // Verify tracking history in database
      const trackingRecords = await OrderTrackingHistory.find({ orderId: placedOrderId }).sort({ createdAt: 1 });
      console.log(`  ✓ Tracking history record count in DB: ${trackingRecords.length}`);

      if (trackingRecords.length !== 1) {
        throw new Error(`TC01 Failed: Expected 1 tracking event, found ${trackingRecords.length}`);
      }

      const initialEvent = trackingRecords[0];
      console.log(`  ✓ Initial Event -> status: '${initialEvent.status}', previousStatus: ${initialEvent.previousStatus}, message: '${initialEvent.message}'`);

      if (initialEvent.status !== 'pending' || initialEvent.previousStatus !== null) {
        throw new Error(`TC01 Failed: Initial event status incorrect. Expected 'pending' with null previousStatus.`);
      }

      console.log('  ✅ TC01 PASSED!\n');
    }

    // ─────────────────────────────────────────────────────────────
    // TC02: Pharmacy accepts order → order status changes correctly
    // ─────────────────────────────────────────────────────────────
    console.log('👉 [TC02] Pharmacy accepts order → order status changes correctly');
    {
      const req = {
        user: testPharmacy,
        params: { id: placedOrderId.toString() },
        body: {},
      };
      const res = createMockRes();
      await acceptOrder(req, res);

      if (res.statusCode !== 200) {
        throw new Error(`TC02 Failed: Expected status 200, got ${res.statusCode}`);
      }

      const updatedOrder = await MedicineOrder.findById(placedOrderId);
      console.log(`  ✓ DB Order status after accept: '${updatedOrder.status}'`);

      if (updatedOrder.status !== 'accepted') {
        throw new Error(`TC02 Failed: Expected status 'accepted', got '${updatedOrder.status}'`);
      }

      console.log('  ✅ TC02 PASSED!\n');
    }

    // ─────────────────────────────────────────────────────────────
    // TC03: Pharmacy accepts order → tracking history receives a new event
    // ─────────────────────────────────────────────────────────────
    console.log('👉 [TC03] Pharmacy accepts order → tracking history receives a new event');
    {
      const trackingRecords = await OrderTrackingHistory.find({ orderId: placedOrderId }).sort({ createdAt: 1 });
      console.log(`  ✓ Tracking records count in DB: ${trackingRecords.length}`);

      if (trackingRecords.length !== 2) {
        throw new Error(`TC03 Failed: Expected 2 tracking events after accept, found ${trackingRecords.length}`);
      }

      const acceptEvent = trackingRecords[1];
      console.log(`  ✓ Accept Event -> status: '${acceptEvent.status}', previousStatus: '${acceptEvent.previousStatus}', actionByName: '${acceptEvent.actionByName}', actionByRole: '${acceptEvent.actionByRole}'`);

      if (acceptEvent.status !== 'accepted') {
        throw new Error(`TC03 Failed: Expected new event status 'accepted', got '${acceptEvent.status}'`);
      }
      if (acceptEvent.previousStatus !== 'pending') {
        throw new Error(`TC03 Failed: Expected previousStatus 'pending', got '${acceptEvent.previousStatus}'`);
      }
      if (acceptEvent.actionByRole !== 'pharmacy') {
        throw new Error(`TC03 Failed: Expected actionByRole 'pharmacy', got '${acceptEvent.actionByRole}'`);
      }

      console.log('  ✅ TC03 PASSED!\n');
    }

    // ─────────────────────────────────────────────────────────────
    // TC04: User opens Track Order → accepted status is displayed
    // ─────────────────────────────────────────────────────────────
    console.log('👉 [TC04] User opens Track Order → accepted status is displayed');
    {
      const req = {
        user: testUser,
        params: { id: placedOrderId.toString() },
      };
      const res = createMockRes();
      await getOrderTracking(req, res);

      if (res.statusCode !== 200) {
        throw new Error(`TC04 Failed: Expected status 200, got ${res.statusCode}`);
      }

      const { data: trackingList, order } = res.data;
      console.log(`  ✓ Tracking API returned ${trackingList.length} events, Order status: '${order.status}'`);

      if (order.status !== 'accepted') {
        throw new Error(`TC04 Failed: Expected order status 'accepted', got '${order.status}'`);
      }

      const latestEvent = trackingList[trackingList.length - 1];
      if (latestEvent.status !== 'accepted') {
        throw new Error(`TC04 Failed: Expected latest event status 'accepted', got '${latestEvent.status}'`);
      }

      console.log('  ✅ TC04 PASSED!\n');
    }

    // ─────────────────────────────────────────────────────────────
    // TC05: User refreshes Track Order → accepted event remains visible
    // ─────────────────────────────────────────────────────────────
    console.log('👉 [TC05] User refreshes Track Order → accepted event remains visible');
    {
      const req = {
        user: testUser,
      };
      const res = createMockRes();
      await getOrderHistory(req, res);

      if (res.statusCode !== 200) {
        throw new Error(`TC05 Failed: Expected status 200, got ${res.statusCode}`);
      }

      const matchedOrder = res.data.data.find((o) => o._id.toString() === placedOrderId.toString());
      if (!matchedOrder) {
        throw new Error(`TC05 Failed: Order not found in getOrderHistory response`);
      }

      console.log(`  ✓ Order history retrieved. Order status: '${matchedOrder.status}', Attached tracking history items: ${matchedOrder.trackingHistory?.length}`);

      if (matchedOrder.status !== 'accepted') {
        throw new Error(`TC05 Failed: Expected status 'accepted', got '${matchedOrder.status}'`);
      }
      if (!matchedOrder.trackingHistory || matchedOrder.trackingHistory.length !== 2) {
        throw new Error(`TC05 Failed: Expected 2 tracking events attached, got ${matchedOrder.trackingHistory?.length}`);
      }

      console.log('  ✅ TC05 PASSED!\n');
    }

    // ─────────────────────────────────────────────────────────────
    // TC06: Multiple status changes → each status change creates a separate history event in chronological order
    // ─────────────────────────────────────────────────────────────
    console.log('👉 [TC06] Multiple status changes (preparing → out_for_delivery → delivered → completed)');
    {
      // 1. Pharmacy marks preparing
      const reqPrep = {
        user: testPharmacy,
        params: { id: placedOrderId.toString() },
        body: { status: 'preparing' },
      };
      const resPrep = createMockRes();
      await updateOrderStatus(reqPrep, resPrep);
      console.log('  ✓ Updated to preparing');

      // 2. Pharmacy marks out_for_delivery
      const reqDelivery = {
        user: testPharmacy,
        params: { id: placedOrderId.toString() },
        body: { status: 'out_for_delivery' },
      };
      const resDelivery = createMockRes();
      await updateOrderStatus(reqDelivery, resDelivery);
      console.log('  ✓ Updated to out_for_delivery');

      // 3. Pharmacy marks delivered
      const reqDelivered = {
        user: testPharmacy,
        params: { id: placedOrderId.toString() },
        body: { status: 'delivered' },
      };
      const resDelivered = createMockRes();
      await updateOrderStatus(reqDelivered, resDelivered);
      console.log('  ✓ Updated to delivered');

      // 4. User confirms receipt -> completed
      const reqConfirm = {
        user: testUser,
        params: { id: placedOrderId.toString() },
      };
      const resConfirm = createMockRes();
      await confirmOrder(reqConfirm, resConfirm);
      console.log('  ✓ User confirmed delivery receipt -> completed');

      // Check all events in order
      const allEvents = await OrderTrackingHistory.find({ orderId: placedOrderId }).sort({ createdAt: 1 });
      console.log(`  ✓ Total tracking history events recorded: ${allEvents.length}`);

      const expectedStatuses = ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'completed'];
      if (allEvents.length !== expectedStatuses.length) {
        throw new Error(`TC06 Failed: Expected ${expectedStatuses.length} events, found ${allEvents.length}`);
      }

      for (let i = 0; i < expectedStatuses.length; i++) {
        const ev = allEvents[i];
        const expected = expectedStatuses[i];
        console.log(`    Event #${i + 1}: status='${ev.status}', prev='${ev.previousStatus}', msg='${ev.message}', by='${ev.actionByName}' (${ev.actionByRole})`);
        if (ev.status !== expected) {
          throw new Error(`TC06 Failed: Event #${i + 1} status mismatch: expected '${expected}', got '${ev.status}'`);
        }
      }

      console.log('  ✅ TC06 PASSED!\n');
    }

    // ─────────────────────────────────────────────────────────────
    // TC07: Unauthorized user cannot modify or view another user's order
    // ─────────────────────────────────────────────────────────────
    console.log("👉 [TC07] Unauthorized user cannot modify or view another user's order");
    {
      const reqUnauthTrack = {
        user: unauthorizedUser,
        params: { id: placedOrderId.toString() },
      };
      const resUnauthTrack = createMockRes();

      let blocked = false;
      try {
        await getOrderTracking(reqUnauthTrack, resUnauthTrack);
      } catch (err) {
        if (err.statusCode === 403) {
          blocked = true;
          console.log('  ✓ Access correctly blocked with 403 Forbidden for unauthorized user tracking request');
        }
      }

      if (!blocked) {
        throw new Error('TC07 Failed: Unauthorized user was able to fetch tracking history.');
      }

      let cancelBlocked = false;
      const reqUnauthCancel = {
        user: unauthorizedUser,
        params: { id: placedOrderId.toString() },
      };
      const resUnauthCancel = createMockRes();
      try {
        await cancelOrder(reqUnauthCancel, resUnauthCancel);
      } catch (err) {
        if (err.statusCode === 403) {
          cancelBlocked = true;
          console.log('  ✓ Cancel correctly blocked with 403 Forbidden for unauthorized user');
        }
      }

      if (!cancelBlocked) {
        throw new Error('TC07 Failed: Unauthorized user was able to cancel order.');
      }

      console.log('  ✅ TC07 PASSED!\n');
    }

    // ─────────────────────────────────────────────────────────────
    // TC08: Duplicate accept request does not create duplicate tracking-history events
    // ─────────────────────────────────────────────────────────────
    console.log('👉 [TC08] Duplicate accept request does not create duplicate tracking-history events');
    {
      const testPrescription2 = await Prescription.create({
        patientId: testUser._id,
        dentistId: testDentistProfile._id,
        patientName: 'Track Test User',
        diagnosis: 'Toothache',
        prescriptionFee: 500,
        paymentStatus: 'paid',
        medicines: [
          {
            medicineName: 'Paracetamol 500mg',
            dosage: '1 tablet as needed',
            frequency: 'As needed',
            duration: '3 days',
            quantity: 5,
            instructions: 'Take after food',
          },
        ],
      });

      const testPayment2 = await Payment.create({
        userId: testUser._id,
        orderId: testPrescription2._id,
        orderType: 'prescription',
        amount: 500,
        method: 'card',
        status: 'paid',
        paidAt: new Date(),
      });
      testPrescription2.paymentId = testPayment2._id;
      await testPrescription2.save();

      // Create a fresh test order
      const reqOrder = {
        user: testUser,
        body: {
          prescriptionId: testPrescription2._id.toString(),
          pharmacyId: testPharmacy._id.toString(),
          deliveryAddress: '123 Test Avenue, Colombo',
          paymentMethod: 'cod',
        },
      };
      const resOrder = createMockRes();
      await sendPrescriptionToPharmacy(reqOrder, resOrder);
      const duplicateTestOrderId = resOrder.data.data._id;

      // 1st Accept
      const reqAccept1 = {
        user: testPharmacy,
        params: { id: duplicateTestOrderId.toString() },
        body: {},
      };
      const resAccept1 = createMockRes();
      await acceptOrder(reqAccept1, resAccept1);

      const eventsAfterFirstAccept = await OrderTrackingHistory.find({ orderId: duplicateTestOrderId });
      console.log(`  ✓ Events after 1st accept: ${eventsAfterFirstAccept.length}`);
      if (eventsAfterFirstAccept.length !== 2) {
        throw new Error(`TC08 Failed: Expected 2 events after first accept, found ${eventsAfterFirstAccept.length}`);
      }

      // 2nd Accept (duplicate click)
      const reqAccept2 = {
        user: testPharmacy,
        params: { id: duplicateTestOrderId.toString() },
        body: {},
      };
      const resAccept2 = createMockRes();
      await acceptOrder(reqAccept2, resAccept2);

      const eventsAfterSecondAccept = await OrderTrackingHistory.find({ orderId: duplicateTestOrderId });
      console.log(`  ✓ Events after 2nd accept: ${eventsAfterSecondAccept.length}`);

      if (eventsAfterSecondAccept.length !== 2) {
        throw new Error(`TC08 Failed: Duplicate accept created extra tracking event. Expected 2, found ${eventsAfterSecondAccept.length}`);
      }

      console.log('  ✅ TC08 PASSED: Duplicate accept correctly handled without duplicate tracking events!\n');
    }

    // ─────────────────────────────────────────────────────────────
    // Direct Order Tracking Test
    // ─────────────────────────────────────────────────────────────
    console.log('👉 [BONUS] Direct Marketplace Order Tracking Lifecycle Verification');
    {
      // Place direct order
      await Cart.deleteMany({ userId: testUser._id });
      const cart = await Cart.create({
        userId: testUser._id,
        items: [
          {
            pharmacyId: testPharmacy._id,
            pharmacyName: testPharmacy.pharmacyName,
            inventoryItemId: testPharmacy.inventory[0]._id,
            medicineName: testPharmacy.inventory[0].medicineName,
            quantity: 2,
            unitPrice: testPharmacy.inventory[0].price,
          },
        ],
      });

      const reqDirectOrder = {
        user: testUser,
        body: {
          pharmacyId: testPharmacy._id.toString(),
          customerName: 'Track Test User',
          deliveryAddress: '123 Test Avenue, Colombo',
          contactNumber: '0771234567',
        },
      };
      const resDirectOrder = createMockRes();
      await placeOrder(reqDirectOrder, resDirectOrder);

      const directOrderId = resDirectOrder.data.data._id;
      console.log(`  ✓ Direct order placed: ID = ${directOrderId}`);

      // Check initial event
      let directEvents = await OrderTrackingHistory.find({ orderId: directOrderId }).sort({ createdAt: 1 });
      if (directEvents.length !== 1 || directEvents[0].status !== 'pending') {
        throw new Error('Direct Order initial tracking event failed.');
      }

      // Pharmacy accepts direct order
      const reqAcceptDirect = {
        user: testPharmacy,
        params: { id: directOrderId.toString() },
        body: { status: 'accepted' },
      };
      const resAcceptDirect = createMockRes();
      await updateDirectOrderStatus(reqAcceptDirect, resAcceptDirect);

      directEvents = await OrderTrackingHistory.find({ orderId: directOrderId }).sort({ createdAt: 1 });
      console.log(`  ✓ Direct order accepted. Tracking events: ${directEvents.length}`);
      if (directEvents.length !== 2 || directEvents[1].status !== 'accepted') {
        throw new Error('Direct Order accept tracking event failed.');
      }

      // User fetches direct order tracking
      const reqGetDirectTrack = {
        user: testUser,
        params: { id: directOrderId.toString() },
      };
      const resGetDirectTrack = createMockRes();
      await getDirectOrderTracking(reqGetDirectTrack, resGetDirectTrack);

      if (resGetDirectTrack.data.data.length !== 2) {
        throw new Error('Direct order getDirectOrderTracking response failed.');
      }

      console.log('  ✅ Direct Order tracking verified successfully!\n');
    }

    console.log('========================================================');
    console.log('🎉 ALL 8 TEST CASES + DIRECT ORDER TESTS PASSED PERFECTLY!');
    console.log('========================================================\n');
  } finally {
    // Cleanup
    console.log('--- Cleaning up test records ---');
    if (testUser) await User.deleteMany({ email: { $in: ['track_test_user@test.com', 'track_unauthorized_user@test.com', 'track_dentist@test.com'] } });
    if (testPharmacy) await Pharmacy.deleteMany({ email: 'track_test_pharmacy@test.com' });
    if (testPrescription) {
      await Prescription.deleteMany({ patientName: 'Track Test User' });
      await Payment.deleteMany({ orderId: testPrescription._id });
    }
    if (testDentistProfile) await Dentist.deleteMany({ _id: testDentistProfile._id });
    await OrderTrackingHistory.deleteMany({ actionByName: { $in: ['Track Test User', 'Track City Care Pharmacy', 'Unauthorized User'] } });
    await MedicineOrder.deleteMany({ deliveryAddress: '123 Test Avenue, Colombo' });
    await DirectOrder.deleteMany({ deliveryAddress: '123 Test Avenue, Colombo' });
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
