import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User.js';
import Dentist from '../models/Dentist.js';
import Pharmacy from '../models/Pharmacy.js';
import Prescription from '../models/Prescription.js';
import Payment from '../models/Payment.js';
import MedicineOrder from '../models/MedicineOrder.js';

import { getNearbyPharmacies, sendPrescriptionToPharmacy } from '../controllers/orderController.js';
import { downloadPrescription } from '../controllers/prescriptionController.js';
import { processPrescriptionPayment } from '../controllers/paymentController.js';

// Helper mock response
function createMockRes() {
  const headers = {};
  const chunks = [];
  const res = {
    statusCode: 200,
    data: null,
    headers,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
    setHeader(key, val) {
      headers[key] = val;
    },
    write(chunk) {
      chunks.push(chunk);
    },
    end(chunk) {
      if (chunk) chunks.push(chunk);
      this.ended = true;
    },
    on(event, handler) {},
    once(event, handler) {},
    emit(event, ...args) {},
  };
  return res;
}

async function runRegressionTests() {
  console.log('=== Connecting to MongoDB for Regression Tests ===');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB successfully.\n');

  let testUser1;
  let testUser2;
  let testDentistProfile;
  let testColomboPharmacy;
  let testJaffnaPharmacy;
  let testPrescription;

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`  ❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passedTests++;
    console.log(`  ✅ PASSED: ${message}`);
  }

  try {
    // 0. Clean previous test fixtures
    await User.deleteMany({ email: { $in: ['reg_user1@test.com', 'reg_user2@test.com', 'reg_dentist@test.com'] } });
    await Dentist.deleteMany({ email: 'reg_dentist@test.com' });
    await Pharmacy.deleteMany({ email: { $in: ['colombo_pharmacy@test.com', 'jaffna_pharmacy@test.com'] } });

    testUser1 = await User.create({
      name: 'Regression User 1',
      email: 'reg_user1@test.com',
      password: 'Password123!',
      role: 'user',
      address: 'Meesalai, Chavakachcheri, Sri Lanka',
      phone: '0771111111',
    });

    testUser2 = await User.create({
      name: 'Regression User 2',
      email: 'reg_user2@test.com',
      password: 'Password123!',
      role: 'user',
      address: 'Colombo 03, Sri Lanka',
      phone: '0772222222',
    });

    const dentistUser = await User.create({
      name: 'Dr. Test Dentist',
      email: 'reg_dentist@test.com',
      password: 'Password123!',
      role: 'dentist',
      phone: '0773333333',
    });

    testDentistProfile = await Dentist.create({
      userId: dentistUser._id,
      name: 'Dr. Test Dentist',
      qualification: 'BDS, MDS',
      specialization: 'Periodontology',
      experience: 8,
      phone: '0773333333',
      email: 'reg_dentist@test.com',
    });

    // Colombo Pharmacy: [lng: 79.8612, lat: 6.9271]
    testColomboPharmacy = await Pharmacy.create({
      pharmacyName: 'Colombo Central Pharmacy',
      ownerName: 'Colombo Owner',
      email: 'colombo_pharmacy@test.com',
      password: 'Password123!',
      phone: '0112345678',
      address: '100 Galle Road, Colombo 03',
      city: 'Colombo',
      district: 'Colombo',
      licenseNumber: 'PH-REG-COL-001',
      status: 'approved',
      location: {
        type: 'Point',
        coordinates: [79.8612, 6.9271], // [lng, lat]
      },
      inventory: [
        { medicineName: 'Amoxicillin 500mg', category: 'Antibiotics', price: 20.0, quantity: 50 },
        { medicineName: 'Paracetamol 500mg', category: 'Pain Relief', price: 5.0, quantity: 100 },
      ],
    });

    // Jaffna / Northern Pharmacy near Meesalai: [lng: 80.0200, lat: 9.6600] (~14 km from Meesalai)
    testJaffnaPharmacy = await Pharmacy.create({
      pharmacyName: 'Northern Health Pharmacy',
      ownerName: 'Jaffna Owner',
      email: 'jaffna_pharmacy@test.com',
      password: 'Password123!',
      phone: '0212345678',
      address: '50 Hospital Road, Jaffna',
      city: 'Jaffna',
      district: 'Jaffna',
      licenseNumber: 'PH-REG-JAF-002',
      status: 'approved',
      location: {
        type: 'Point',
        coordinates: [80.0200, 9.6600], // [lng, lat]
      },
      inventory: [
        { medicineName: 'Amoxicillin 500mg', category: 'Antibiotics', price: 18.0, quantity: 30 },
        { medicineName: 'Paracetamol 500mg', category: 'Pain Relief', price: 5.0, quantity: 80 },
      ],
    });

    console.log('====================================================');
    console.log('SECTION 1: BUG 1 — NEARBY PHARMACY GEOLOCATION TESTS');
    console.log('====================================================');

    // TEST 1.1: Search from Meesalai coordinates (lat: 9.6800, lng: 80.1400) within 10 km
    {
      const req = {
        query: { latitude: '9.6800', longitude: '80.1400', radius: '10' },
        user: testUser1,
      };
      const res = createMockRes();
      await getNearbyPharmacies(req, res);
      assert(res.data.success === true, 'Nearby search succeeded for Meesalai coordinates');
      assert(
        !res.data.data.some((p) => p._id.toString() === testColomboPharmacy._id.toString()),
        'Colombo pharmacy (~305 km away) is correctly NOT returned within 10 km of Meesalai'
      );
      assert(
        res.data.data.every((p) => p.distanceKm <= 10),
        'All returned pharmacies are strictly within 10 km'
      );
    }

    // TEST 1.2: Search from Meesalai coordinates within 500 km (or all)
    {
      const req = {
        query: { latitude: '9.6800', longitude: '80.1400', radius: '500' },
        user: testUser1,
      };
      const res = createMockRes();
      await getNearbyPharmacies(req, res);
      assert(res.data.success === true, 'Nearby search succeeded within 500 km');
      const colomboFound = res.data.data.find((p) => p._id.toString() === testColomboPharmacy._id.toString());
      assert(colomboFound !== undefined, 'Colombo pharmacy is found in 500 km search');
      assert(
        colomboFound.distanceKm >= 300 && colomboFound.distanceKm <= 320,
        `Distance from Meesalai to Colombo pharmacy is correctly calculated as ~305 km (got ${colomboFound?.distanceKm} km)`
      );
      const jaffnaFound = res.data.data.find((p) => p._id.toString() === testJaffnaPharmacy._id.toString());
      assert(jaffnaFound !== undefined, 'Jaffna pharmacy is found');
      assert(
        jaffnaFound.distanceKm < colomboFound.distanceKm,
        `Jaffna pharmacy (${jaffnaFound?.distanceKm} km) is correctly sorted closer than Colombo (${colomboFound?.distanceKm} km)`
      );
    }

    // TEST 1.3: Search with invalid coordinates
    {
      let errLat = null;
      try {
        await getNearbyPharmacies({ query: { latitude: '999', longitude: '80.14' }, user: testUser1 }, createMockRes());
      } catch (err) {
        errLat = err;
      }
      assert(errLat !== null && errLat.statusCode === 400, 'Invalid latitude (> 90) returns 400 Bad Request');

      let errLng = null;
      try {
        await getNearbyPharmacies({ query: { latitude: '9.68', longitude: '-200' }, user: testUser1 }, createMockRes());
      } catch (err) {
        errLng = err;
      }
      assert(errLng !== null && errLng.statusCode === 400, 'Invalid longitude (<-180) returns 400 Bad Request');

      let errMissing = null;
      try {
        await getNearbyPharmacies({ query: { latitude: '', longitude: '' }, user: testUser1 }, createMockRes());
      } catch (err) {
        errMissing = err;
      }
      assert(errMissing !== null && errMissing.statusCode === 400, 'Missing coordinates returns 400 Bad Request');
    }

    console.log('\n======================================================');
    console.log('SECTION 2: BUG 2 — PRESCRIPTION PAYMENT & ACCESS TESTS');
    console.log('======================================================');

    // Create an initial prescription (unpaid, paymentStatus: 'pending')
    testPrescription = await Prescription.create({
      patientId: testUser1._id,
      dentistId: testDentistProfile._id,
      medicines: [
        { medicineName: 'Amoxicillin 500mg', dosage: '1 tablet 3x daily', duration: '5 days', quantity: 15 },
        { medicineName: 'Paracetamol 500mg', dosage: '1 tablet as needed', duration: '3 days', quantity: 10 },
      ],
      notes: 'Take with food',
      caseDiagnosis: 'Gingivitis / Mild Periodontitis',
      prescriptionFee: 500,
      paymentStatus: 'pending',
    });

    // ── TC1: UNPAID PRESCRIPTION ──────────────────────────────────────────
    console.log('\n[TC1] Unpaid Prescription (paymentStatus: pending, no payment)');
    {
      let downloadErr = null;
      try {
        await downloadPrescription({ params: { id: testPrescription._id }, user: testUser1 }, createMockRes());
      } catch (err) {
        downloadErr = err;
      }
      assert(
        downloadErr !== null && downloadErr.statusCode === 402,
        'TC1.1: Download prescription BLOCKED with 402 Payment Required'
      );

      let sendErr = null;
      try {
        await sendPrescriptionToPharmacy(
          {
            body: {
              prescriptionId: testPrescription._id.toString(),
              pharmacyId: testColomboPharmacy._id.toString(),
              deliveryAddress: 'Meesalai, Sri Lanka',
              paymentMethod: 'cod',
            },
            user: testUser1,
          },
          createMockRes()
        );
      } catch (err) {
        sendErr = err;
      }
      assert(
        sendErr !== null && sendErr.statusCode === 402,
        'TC1.2: Send to pharmacy BLOCKED with 402 Payment Required'
      );
    }

    // ── TC2: FAILED PAYMENT ───────────────────────────────────────────────
    console.log('\n[TC2] Failed Payment (Payment record status: failed)');
    {
      const failedPayment = await Payment.create({
        userId: testUser1._id,
        orderId: testPrescription._id,
        orderType: 'prescription',
        amount: 500,
        method: 'card',
        status: 'failed',
      });
      testPrescription.paymentId = failedPayment._id;
      testPrescription.paymentStatus = 'pending';
      await testPrescription.save();

      let downloadErr = null;
      try {
        await downloadPrescription({ params: { id: testPrescription._id }, user: testUser1 }, createMockRes());
      } catch (err) {
        downloadErr = err;
      }
      assert(
        downloadErr !== null && downloadErr.statusCode === 402,
        'TC2.1: Download prescription with failed payment BLOCKED (402)'
      );

      let sendErr = null;
      try {
        await sendPrescriptionToPharmacy(
          {
            body: {
              prescriptionId: testPrescription._id.toString(),
              pharmacyId: testColomboPharmacy._id.toString(),
              deliveryAddress: 'Meesalai, Sri Lanka',
              paymentMethod: 'cod',
            },
            user: testUser1,
          },
          createMockRes()
        );
      } catch (err) {
        sendErr = err;
      }
      assert(
        sendErr !== null && sendErr.statusCode === 402,
        'TC2.2: Send to pharmacy with failed payment BLOCKED (402)'
      );

      await Payment.deleteOne({ _id: failedPayment._id });
    }

    // ── TC3: CANCELLED PAYMENT ────────────────────────────────────────────
    console.log('\n[TC3] Cancelled Payment (Payment record status: cancelled)');
    {
      const cancelledPayment = await Payment.create({
        userId: testUser1._id,
        orderId: testPrescription._id,
        orderType: 'prescription',
        amount: 500,
        method: 'card',
        status: 'cancelled',
      });
      testPrescription.paymentId = cancelledPayment._id;
      testPrescription.paymentStatus = 'pending';
      await testPrescription.save();

      let downloadErr = null;
      try {
        await downloadPrescription({ params: { id: testPrescription._id }, user: testUser1 }, createMockRes());
      } catch (err) {
        downloadErr = err;
      }
      assert(
        downloadErr !== null && downloadErr.statusCode === 402,
        'TC3.1: Download prescription with cancelled payment BLOCKED (402)'
      );

      let sendErr = null;
      try {
        await sendPrescriptionToPharmacy(
          {
            body: {
              prescriptionId: testPrescription._id.toString(),
              pharmacyId: testColomboPharmacy._id.toString(),
              deliveryAddress: 'Meesalai, Sri Lanka',
              paymentMethod: 'cod',
            },
            user: testUser1,
          },
          createMockRes()
        );
      } catch (err) {
        sendErr = err;
      }
      assert(
        sendErr !== null && sendErr.statusCode === 402,
        'TC3.2: Send to pharmacy with cancelled payment BLOCKED (402)'
      );

      await Payment.deleteOne({ _id: cancelledPayment._id });
    }

    // ── TC4: SUCCESSFUL PAYMENT ───────────────────────────────────────────
    console.log('\n[TC4] Successful Payment Processed');
    {
      // Process legitimate payment through paymentController
      const payReq = {
        body: {
          prescriptionId: testPrescription._id.toString(),
          cardHolderName: 'Regression User 1',
          cardNumber: '4242424242424242',
          cardExpiry: '12/28',
          cvv: '123',
        },
        user: testUser1,
      };
      const payRes = createMockRes();
      await processPrescriptionPayment(payReq, payRes);
      assert(payRes.statusCode === 201, 'Payment processed successfully (201)');
      assert(payRes.data?.data?.paymentStatus === 'paid', 'Payment status is paid');

      // Now attempt download
      const dlRes = createMockRes();
      await downloadPrescription({ params: { id: testPrescription._id }, user: testUser1 }, dlRes);
      assert(dlRes.headers['Content-Type'] === 'application/pdf', 'TC4.1: Download allowed — PDF Content-Type returned');
      assert(
        dlRes.headers['Content-Disposition'].includes(`prescription-${testPrescription._id}.pdf`),
        'TC4.1: Attachment disposition set correctly'
      );

      // Now attempt sending to pharmacy
      const sendRes = createMockRes();
      await sendPrescriptionToPharmacy(
        {
          body: {
            prescriptionId: testPrescription._id.toString(),
            pharmacyId: testColomboPharmacy._id.toString(),
            deliveryAddress: 'Meesalai, Chavakachcheri, Sri Lanka',
            paymentMethod: 'cod',
          },
          user: testUser1,
        },
        sendRes
      );
      assert(sendRes.statusCode === 201, 'TC4.2: Send to pharmacy ALLOWED after payment — Order created (201)');
      assert(sendRes.data.data.status === 'pending', 'Order status initialized to pending');
      assert(sendRes.data.data.deliveryAddress === 'Meesalai, Chavakachcheri, Sri Lanka', 'Order delivery address recorded');
    }

    // ── TC5: ANOTHER USER\'S PRESCRIPTION ─────────────────────────────────
    console.log('\n[TC5] Another User Access Restriction (Cross-user)');
    {
      let crossDlErr = null;
      try {
        await downloadPrescription({ params: { id: testPrescription._id }, user: testUser2 }, createMockRes());
      } catch (err) {
        crossDlErr = err;
      }
      assert(
        crossDlErr !== null && crossDlErr.statusCode === 403,
        'TC5.1: Cross-user download BLOCKED with 403 Forbidden'
      );

      let crossSendErr = null;
      try {
        await sendPrescriptionToPharmacy(
          {
            body: {
              prescriptionId: testPrescription._id.toString(),
              pharmacyId: testColomboPharmacy._id.toString(),
              deliveryAddress: 'Colombo 03, Sri Lanka',
              paymentMethod: 'cod',
            },
            user: testUser2,
          },
          createMockRes()
        );
      } catch (err) {
        crossSendErr = err;
      }
      assert(
        crossSendErr !== null && crossSendErr.statusCode === 403,
        'TC5.2: Cross-user send to pharmacy BLOCKED with 403 Forbidden'
      );
    }

    // ── TC6: DIRECT API DOWNLOAD WITHOUT VALID PAYMENT ────────────────────
    console.log('\n[TC6] Direct API Access to Prescription Download');
    {
      // Create another unpaid prescription
      const unpaidRx = await Prescription.create({
        patientId: testUser1._id,
        dentistId: testDentistProfile._id,
        medicines: [{ medicineName: 'Amoxicillin 500mg', dosage: '1 tab', duration: '3 days', quantity: 6 }],
        prescriptionFee: 500,
        paymentStatus: 'pending',
      });

      let directDlErr = null;
      try {
        await downloadPrescription({ params: { id: unpaidRx._id }, user: testUser1 }, createMockRes());
      } catch (err) {
        directDlErr = err;
      }
      assert(
        directDlErr !== null && directDlErr.statusCode === 402,
        'TC6: Direct API download on unpaid prescription returns 402 (No PDF leak)'
      );
    }

    // ── TC7: DIRECT API SEND PRESCRIPTION WITHOUT VALID PAYMENT ───────────
    console.log('\n[TC7] Direct API Send Prescription to Pharmacy');
    {
      // Create unpaid prescription
      const unpaidRx2 = await Prescription.create({
        patientId: testUser1._id,
        dentistId: testDentistProfile._id,
        medicines: [{ medicineName: 'Amoxicillin 500mg', dosage: '1 tab', duration: '3 days', quantity: 6 }],
        prescriptionFee: 500,
        paymentStatus: 'pending',
      });

      let directSendErr = null;
      try {
        await sendPrescriptionToPharmacy(
          {
            body: {
              prescriptionId: unpaidRx2._id.toString(),
              pharmacyId: testJaffnaPharmacy._id.toString(),
              deliveryAddress: 'Meesalai, Sri Lanka',
              paymentMethod: 'cod',
            },
            user: testUser1,
          },
          createMockRes()
        );
      } catch (err) {
        directSendErr = err;
      }
      assert(
        directSendErr !== null && directSendErr.statusCode === 402,
        'TC7: Direct API send on unpaid prescription returns 402 (No order placed, no stock deducted)'
      );
    }

    console.log(`\n🎉 ALL ${passedTests}/${totalTests} REGRESSION TESTS PASSED SUCCESSFULLY!`);
  } finally {
    // Cleanup test data
    console.log('\n--- Cleaning up test fixtures ---');
    if (testUser1) {
      await MedicineOrder.deleteMany({ userId: testUser1._id });
      await Payment.deleteMany({ userId: testUser1._id });
      await Prescription.deleteMany({ patientId: testUser1._id });
      await User.deleteMany({ email: { $in: ['reg_user1@test.com', 'reg_user2@test.com', 'reg_dentist@test.com'] } });
    }
    if (testDentistProfile) {
      await Dentist.deleteOne({ _id: testDentistProfile._id });
    }
    if (testColomboPharmacy) {
      await Pharmacy.deleteOne({ _id: testColomboPharmacy._id });
    }
    if (testJaffnaPharmacy) {
      await Pharmacy.deleteOne({ _id: testJaffnaPharmacy._id });
    }
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

runRegressionTests().catch((err) => {
  console.error('Fatal error during regression test execution:', err);
  process.exit(1);
});
