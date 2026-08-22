import { motion } from 'framer-motion';
import { getImageUrl } from '../utils/imageUrl';

export default function MedicineCard({
  medicine,
  onEdit,
  onDelete,
  onAddToCart,
  isAdminView = false,
  isPharmacyView = false,
  isAdding = false,
}) {
  const {
    medicineName,
    category,
    description,
    price,
    quantity,
    expiryDate,
    image,
    pharmacyName,
  } = medicine;

  // Stock status
  let stockStatus = 'In Stock';
  let badgeColor = 'bg-green-500/15 text-green-400 border border-green-500/30';
  if (quantity === 0) {
    stockStatus = 'Out of Stock';
    badgeColor = 'bg-red-500/15 text-red-400 border border-red-500/30';
  } else if (quantity < 10) {
    stockStatus = 'Low Stock';
    badgeColor = 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30';
  }

  // Handle image URL resolution
  const imageUrl = getImageUrl(image);

  const formattedDate = expiryDate
    ? new Date(expiryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="card flex flex-col justify-between overflow-hidden border border-theme-border/40 bg-theme-surface/65 shadow-theme hover:border-theme-accent/30 hover:shadow-glow"
    >
      <div>
        {/* Medicine Image */}
        <div className="relative h-44 w-full overflow-hidden bg-theme-background/60">
          <img
            src={imageUrl}
            alt={medicineName}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';
            }}
          />
          <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${badgeColor}`}>
            {stockStatus}
          </span>
        </div>

        {/* Card Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-theme-heading line-clamp-1 text-lg" title={medicineName}>
              {medicineName}
            </h3>
          </div>

          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="rounded bg-theme-accent/10 px-2 py-0.5 text-xs font-medium text-theme-accent">
              {category}
            </span>
          </div>

          <p className="mt-3 text-sm text-theme-muted line-clamp-2 h-10" title={description}>
            {description || 'No description available for this medicine.'}
          </p>

          <div className="mt-4 space-y-1.5 border-t border-theme-border/20 pt-3 text-xs text-theme-muted">
            <div className="flex justify-between">
              <span>Expiry Date:</span>
              <span className="font-medium text-theme-text">{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Available Stock:</span>
              <span className={`font-semibold ${quantity === 0 ? 'text-red-400' : quantity < 10 ? 'text-yellow-400' : 'text-theme-text'}`}>
                {quantity} units
              </span>
            </div>
            {pharmacyName && (
              <div className="flex justify-between">
                <span>Pharmacy:</span>
                <span className="font-medium text-theme-accent max-w-[150px] truncate" title={pharmacyName}>
                  {pharmacyName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-theme-border/20 p-4 pt-3 flex items-center justify-between">
        <div>
          <span className="text-xs text-theme-muted block">Price</span>
          <span className="text-xl font-bold text-theme-heading">Rs. {price.toFixed(2)}</span>
        </div>

        {isPharmacyView ? (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(medicine)}
              className="rounded-lg border border-theme-border bg-theme-surface hover:bg-theme-accent/10 p-2 text-theme-text hover:text-theme-accent transition"
              title="Edit Medicine"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(medicine)}
              className="rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 p-2 text-red-400 transition"
              title="Delete Medicine"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        ) : onAddToCart ? (
          <button
            onClick={() => onAddToCart(medicine)}
            disabled={quantity === 0 || isAdding}
            className={`btn-primary px-4 py-2 text-sm flex items-center gap-1.5 ${
              quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span>{isAdding ? 'Adding...' : 'Add to Cart'}</span>
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}
