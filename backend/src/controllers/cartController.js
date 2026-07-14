import Cart from '../models/Cart.js';
import Pharmacy from '../models/Pharmacy.js';
import { AppError } from '../utils/AppError.js';

/**
 * GET /api/cart
 * Get the authenticated user's cart.
 */
export const getCart = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });
  res.json({ success: true, data: cart || { items: [] } });
};

/**
 * POST /api/cart
 * Add an item to cart or increment existing quantity.
 * Body: { pharmacyId, inventoryItemId, quantity }
 */
export const addToCart = async (req, res) => {
  const { pharmacyId, inventoryItemId, quantity = 1 } = req.body;

  if (!pharmacyId || !inventoryItemId) {
    throw new AppError('pharmacyId and inventoryItemId are required.', 400);
  }

  // Verify the medicine exists in the pharmacy inventory
  const pharmacy = await Pharmacy.findOne({ _id: pharmacyId, status: 'approved' });
  if (!pharmacy) throw new AppError('Pharmacy not found or not approved.', 404);

  const inventoryItem = pharmacy.inventory.id(inventoryItemId);
  if (!inventoryItem) throw new AppError('Medicine not found in pharmacy inventory.', 404);

  if (inventoryItem.quantity < 1) {
    throw new AppError('This medicine is currently out of stock.', 400);
  }

  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    cart = new Cart({ userId: req.user._id, items: [] });
  }

  // Check if item already in cart
  const existingItem = cart.items.find(
    (item) =>
      item.pharmacyId.toString() === pharmacyId &&
      item.inventoryItemId.toString() === inventoryItemId
  );

  const requestedQty = parseInt(quantity, 10);

  if (existingItem) {
    const newQty = existingItem.quantity + requestedQty;
    if (newQty > inventoryItem.quantity) {
      throw new AppError(`Only ${inventoryItem.quantity} units available.`, 400);
    }
    existingItem.quantity = newQty;
  } else {
    if (requestedQty > inventoryItem.quantity) {
      throw new AppError(`Only ${inventoryItem.quantity} units available.`, 400);
    }
    cart.items.push({
      pharmacyId,
      pharmacyName: pharmacy.pharmacyName,
      inventoryItemId,
      medicineName: inventoryItem.medicineName,
      category: inventoryItem.category || 'General',
      image: inventoryItem.image || '',
      unitPrice: inventoryItem.price,
      quantity: requestedQty,
    });
  }

  await cart.save();
  res.json({ success: true, data: cart });
};

/**
 * PUT /api/cart/:itemId
 * Update quantity of a cart item.
 * Body: { quantity }
 */
export const updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  const parsedQty = parseInt(quantity, 10);

  if (!parsedQty || parsedQty < 1) {
    throw new AppError('Quantity must be at least 1.', 400);
  }

  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) throw new AppError('Cart not found.', 404);

  const item = cart.items.id(req.params.itemId);
  if (!item) throw new AppError('Cart item not found.', 404);

  item.quantity = parsedQty;
  await cart.save();
  res.json({ success: true, data: cart });
};

/**
 * DELETE /api/cart/:itemId
 * Remove a single item from cart.
 */
export const removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) throw new AppError('Cart not found.', 404);

  cart.items.pull(req.params.itemId);
  await cart.save();
  res.json({ success: true, data: cart });
};

/**
 * DELETE /api/cart
 * Clear entire cart.
 */
export const clearCart = async (req, res) => {
  await Cart.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { items: [] } },
    { upsert: true }
  );
  res.json({ success: true, data: { items: [] } });
};

export default { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
