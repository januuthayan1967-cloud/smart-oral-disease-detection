import Pharmacy from '../models/Pharmacy.js';

const MEDICINE_CATEGORIES = [
  'General', 'Antibiotics', 'Pain Relief', 'Antiseptic', 'Anti-inflammatory',
  'Vitamins & Supplements', 'Dental', 'Antifungal', 'Prescription', 'Other',
];

/**
 * GET /api/medicines
 * Browse all medicines from all approved pharmacies.
 * Supports: ?search=, ?category=, ?page=, ?limit=, ?pharmacyId=
 */
export const getAllMedicines = async (req, res) => {
  const { search, category, pharmacyId, page = 1, limit = 20 } = req.query;

  const matchQuery = { status: 'approved', 'inventory.0': { $exists: true } };
  if (pharmacyId) matchQuery._id = pharmacyId;

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  // Build medicine-level filter pipeline
  const inventoryFilter = {};
  if (search) {
    inventoryFilter.$or = [
      { 'inventory.medicineName': { $regex: search, $options: 'i' } },
      { 'inventory.category': { $regex: search, $options: 'i' } },
      { 'inventory.description': { $regex: search, $options: 'i' } },
    ];
  }
  if (category && category !== 'All') {
    inventoryFilter['inventory.category'] = { $regex: category, $options: 'i' };
  }

  const pipeline = [
    { $match: matchQuery },
    {
      $project: {
        pharmacyName: 1,
        address: 1,
        city: 1,
        phone: 1,
        inventory: 1,
      },
    },
    { $unwind: '$inventory' },
    ...(search
      ? [{
          $match: {
            $or: [
              { 'inventory.medicineName': { $regex: search, $options: 'i' } },
              { 'inventory.category': { $regex: search, $options: 'i' } },
              { 'inventory.description': { $regex: search, $options: 'i' } },
            ],
          },
        }]
      : []),
    ...(category && category !== 'All'
      ? [{ $match: { 'inventory.category': { $regex: `^${category}$`, $options: 'i' } } }]
      : []),
    {
      $project: {
        _id: 0,
        pharmacyId: '$_id',
        pharmacyName: 1,
        address: 1,
        city: 1,
        phone: 1,
        itemId: '$inventory._id',
        medicineName: '$inventory.medicineName',
        category: '$inventory.category',
        description: '$inventory.description',
        image: '$inventory.image',
        quantity: '$inventory.quantity',
        price: '$inventory.price',
        expiryDate: '$inventory.expiryDate',
      },
    },
    { $sort: { medicineName: 1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: parseInt(limit, 10) }],
        total: [{ $count: 'count' }],
      },
    },
  ];

  const [result] = await Pharmacy.aggregate(pipeline);
  const medicines = result?.data || [];
  const total = result?.total?.[0]?.count || 0;

  res.json({
    success: true,
    count: medicines.length,
    total,
    page: parseInt(page, 10),
    totalPages: Math.ceil(total / parseInt(limit, 10)),
    categories: MEDICINE_CATEGORIES,
    data: medicines,
  });
};

/**
 * GET /api/medicines/categories
 * Returns the list of available medicine categories.
 */
export const getCategories = async (_req, res) => {
  res.json({ success: true, data: MEDICINE_CATEGORIES });
};

export default { getAllMedicines, getCategories };
