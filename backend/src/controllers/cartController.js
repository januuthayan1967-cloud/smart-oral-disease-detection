import Cart from '../models/Cart.js';
import Pharmacy from '../models/Pharmacy.js';
import { AppError } from '../utils/AppError.js';

/**
 * GET /api/cart
 * Get the authenticated user's cart enriched with real-time stock.
 */
export const getCart = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart || !cart.items || cart.items.length === 0) {
    return res.json({ success: true, data: cart || { items: [] } });
  }

  // Fetch pharmacies for items in cart to get real-time stock
  const pharmacyIds = [...new Set(cart.items.map((i) => i.pharmacyId.toString()))];
  const pharmacies = await Pharmacy.find({ _id: { $in: pharmacyIds }, status: 'approved' });
  const pharmacyMap = new Map(pharmacies.map((p) => [p._id.toString(), p]));

  const enrichedItems = cart.items.map((item) => {
    const itemObj = item.toObject ? item.toObject() : { ...item };
    const pharmacy = pharmacyMap.get(item.pharmacyId.toString());
    const inventoryItem = pharmacy ? pharmacy.inventory.id(item.inventoryItemId) : null;
    const availableStock = inventoryItem ? inventoryItem.quantity : 0;
    return {
      ...itemObj,
      availableStock,
      isOutOfStock: availableStock === 0,
      isExceedingStock: item.quantity > availableStock,
    };
  });

  const cartObj = cart.toObject ? cart.toObject() : { ...cart };
  cartObj.items = enrichedItems;

  res.json({ success: true, data: cartObj });
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

  const requestedQty = parseInt(quantity, 10);
  if (!requestedQty || requestedQty < 1) {
    throw new AppError('Quantity must be at least 1.', 400);
  }

  // Verify the medicine exists in the pharmacy inventory
  const pharmacy = await Pharmacy.findOne({ _id: pharmacyId, status: 'approved' });
  if (!pharmacy) throw new AppError('Pharmacy not found or not approved.', 404);

  const inventoryItem = pharmacy.inventory.id(inventoryItemId);
  if (!inventoryItem) throw new AppError('Medicine not found in pharmacy inventory.', 404);

  if (inventoryItem.quantity < 1) {
    throw new AppError('This item is currently out of stock.', 400);
  }

  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    cart = new Cart({ userId: req.user._id, items: [] });
  }

  // Check if item already in cart
  const existingItem = cart.items.find(
    (item) =>
      item.pharmacyId.toString() === pharmacyId.toString() &&
      item.inventoryItemId.toString() === inventoryItemId.toString()
  );

  if (existingItem) {
    const newQty = existingItem.quantity + requestedQty;
    if (newQty > inventoryItem.quantity) {
      throw new AppError(`Only ${inventoryItem.quantity} items are available in stock.`, 400);
    }
    existingItem.quantity = newQty;
  } else {
    if (requestedQty > inventoryItem.quantity) {
      throw new AppError(`Only ${inventoryItem.quantity} items are available in stock.`, 400);
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
  return getCart(req, res);
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

  const pharmacy = await Pharmacy.findOne({ _id: item.pharmacyId, status: 'approved' });
  if (!pharmacy) throw new AppError('Pharmacy not found or not approved.', 404);

  const inventoryItem = pharmacy.inventory.id(item.inventoryItemId);
  if (!inventoryItem) throw new AppError('Medicine not found in pharmacy inventory.', 404);

  if (inventoryItem.quantity < 1) {
    throw new AppError('This item is currently out of stock.', 400);
  }

  if (parsedQty > inventoryItem.quantity) {
    throw new AppError(`Only ${inventoryItem.quantity} items are available in stock.`, 400);
  }

  item.quantity = parsedQty;
  await cart.save();
  return getCart(req, res);
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
  return getCart(req, res);
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
