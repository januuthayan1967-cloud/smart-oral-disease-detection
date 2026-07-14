import { Router } from 'express';
import {
  getPharmacyOrders,
  updateOrderStatus,
  acceptOrder,
  rejectOrder,
  getOrderHistory,
  getPharmacyDirectOrders,
  updateDirectOrderStatus,
  updateDirectOrderPaymentStatus,
  getPharmacyProfile,
  updatePharmacyProfile,
  getInventory,
  updateInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../controllers/pharmacyController.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/AppError.js';
import { medicineUpload } from '../middleware/medicineUpload.js';

const router = Router();

router.use(protect, authorize('pharmacy'));

// ─── Prescription-based Orders ─────────────────────────────────────────────
router.get('/orders', asyncHandler(getPharmacyOrders));
router.put('/order-status/:id', asyncHandler(updateOrderStatus));
router.put('/orders/:id/accept', asyncHandler(acceptOrder));
router.put('/orders/:id/reject', asyncHandler(rejectOrder));
router.get('/orders/history', asyncHandler(getOrderHistory));

// ─── Direct Orders (marketplace) ──────────────────────────────────────────
router.get('/direct-orders', asyncHandler(getPharmacyDirectOrders));
router.patch('/direct-orders/:id/status', asyncHandler(updateDirectOrderStatus));
router.patch('/direct-orders/:id/payment-status', asyncHandler(updateDirectOrderPaymentStatus));

// ─── Profile ──────────────────────────────────────────────────────────────
router.get('/profile', asyncHandler(getPharmacyProfile));
router.put('/profile', asyncHandler(updatePharmacyProfile));

// ─── Inventory ────────────────────────────────────────────────────────────
router.get('/inventory', asyncHandler(getInventory));
router.put('/inventory', asyncHandler(updateInventory));
router.post('/inventory', medicineUpload.single('image'), asyncHandler(addInventoryItem));
router.put('/inventory/:itemId', medicineUpload.single('image'), asyncHandler(updateInventoryItem));
router.delete('/inventory/:itemId', asyncHandler(deleteInventoryItem));

export default router;
