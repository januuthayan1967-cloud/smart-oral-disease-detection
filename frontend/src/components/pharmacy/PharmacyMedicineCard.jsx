import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { getImageUrl } from '../../utils/imageUrl';

export default function PharmacyMedicineCard({
  medicine,
  onEdit,
  onDelete,
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    medicineName = 'Medicine Name',
    category = 'General',
    description = '',
    price = 0,
    quantity = 0,
    image,
  } = medicine;

  // Stock Status determination matching reference
  let stockBadge = {
    label: 'IN STOCK',
    style: isDark
      ? 'bg-[#18D99B]/15 text-[#18D99B] border-[#18D99B]/40'
      : 'bg-[#16835D]/10 text-[#16835D] border-[#16835D]/30',
  };

  if (quantity === 0) {
    stockBadge = {
      label: 'OUT OF STOCK',
      style: isDark
        ? 'bg-[#FF6475]/15 text-[#FF6475] border-[#FF6475]/40'
        : 'bg-[#C83F4F]/10 text-[#C83F4F] border-[#C83F4F]/30',
    };
  } else if (quantity < 10) {
    stockBadge = {
      label: 'LOW STOCK',
      style: isDark
        ? 'bg-[#F5B942]/15 text-[#F5B942] border-[#F5B942]/40'
        : 'bg-[#A66A10]/10 text-[#A66A10] border-[#A66A10]/30',
    };
  }

  const imageUrl = getImageUrl(image);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={
        isDark
          ? { y: -5, boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(217, 173, 86, 0.2)' }
          : { y: -4, boxShadow: '0 12px 30px rgba(20, 36, 58, 0.08), 0 0 16px rgba(198, 156, 72, 0.15)' }
      }
      transition={{ duration: 0.25 }}
      className="pharmacy-inventory-card group relative flex flex-col justify-between overflow-hidden rounded-2xl transition-all duration-300"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, rgba(16, 36, 58, 0.8) 0%, rgba(11, 27, 45, 0.92) 100%)'
          : '#FFFFFF',
        border: isDark
          ? '1px solid rgba(217, 173, 86, 0.3)'
          : '1px solid rgba(198, 156, 72, 0.28)',
        boxShadow: isDark
          ? '0 8px 24px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(244, 213, 141, 0.1)'
          : '0 6px 20px rgba(20, 36, 58, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div>
        {/* Top Product Image Container */}
        <div
          className={`relative h-36 sm:h-40 w-full overflow-hidden flex items-center justify-center p-3 border-b ${
            isDark
              ? 'bg-[#071322]/80 border-[#D9AD56]/20'
              : 'bg-[#F8FAFC] border-[#DCE4EC]'
          }`}
        >
          <img
            src={imageUrl}
            alt={medicineName}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=60';
            }}
          />

          {/* Stock Badge on Top Right */}
          <span
            className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border shadow-sm ${stockBadge.style}`}
          >
            {stockBadge.label}
          </span>
        </div>

        {/* Card Content Body */}
        <div className="p-4 space-y-2">
          {/* Medicine Title */}
          <h3
            className={`font-bold text-base leading-snug line-clamp-1 transition-colors ${
              isDark
                ? 'text-[#F8FAFC] group-hover:text-[#F4D58D]'
                : 'text-[#14243A] group-hover:text-[#C69C48]'
            }`}
            title={medicineName}
          >
            {medicineName}
          </h3>

          {/* Category */}
          <p
            className="text-xs font-semibold"
            style={{ color: isDark ? '#00C9E8' : '#087F9C' }}
          >
            {category}
          </p>

          {/* Description */}
          <p
            className="text-xs line-clamp-2 min-h-[32px] leading-relaxed"
            style={{ color: isDark ? '#94A9BF' : '#52657A' }}
            title={description}
          >
            {description || 'Comprehensive oral care pharmaceutical medicine.'}
          </p>

          {/* Stock Info */}
          <div
            className="pt-2 text-xs font-semibold"
            style={{ color: isDark ? '#94A9BF' : '#52657A' }}
          >
            <span>Stock: </span>
            <span
              className={
                quantity === 0
                  ? isDark ? 'text-[#FF6475] font-bold' : 'text-[#C83F4F] font-bold'
                  : quantity < 10
                  ? isDark ? 'text-[#F5B942] font-bold' : 'text-[#A66A10] font-bold'
                  : isDark ? 'text-[#F8FAFC] font-bold' : 'text-[#14243A] font-bold'
              }
            >
              {quantity} units
            </span>
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div
        className={`p-4 pt-3 border-t flex items-center justify-between ${
          isDark ? 'border-[#D9AD56]/20' : 'border-[#DCE4EC]'
        }`}
      >
        <div>
          <span
            className="text-base sm:text-lg font-bold"
            style={{
              fontFamily: 'Outfit, sans-serif',
              color: isDark ? 'transparent' : '#14243A',
              ...(isDark
                ? {
                    backgroundImage: 'linear-gradient(135deg, #FFFFFF 30%, #F4D58D 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }
                : {}),
            }}
          >
            Rs. {Number(price).toFixed(2)}
          </span>
        </div>

        {/* Action Buttons: Edit & Delete */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(medicine)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all shadow-sm ${
              isDark
                ? 'border-[#D9AD56]/30 bg-[#10243A]/80 text-[#94A9BF] hover:text-[#F4D58D] hover:border-[#F4D58D] hover:bg-[#D9AD56]/15'
                : 'border-[#DCE4EC] bg-[#FFFFFF] text-[#52657A] hover:text-[#C69C48] hover:border-[#C69C48] hover:bg-[#FFFDF8]'
            }`}
            title="Edit Medicine"
            aria-label="Edit Medicine"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => onDelete(medicine)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all shadow-sm ${
              isDark
                ? 'border-[#FF6475]/30 bg-[#FF6475]/10 text-[#FF6475] hover:bg-[#FF6475]/25 hover:border-[#FF6475]'
                : 'border-[#C83F4F]/30 bg-[#C83F4F]/10 text-[#C83F4F] hover:bg-[#C83F4F]/20 hover:border-[#C83F4F]'
            }`}
            title="Delete Medicine"
            aria-label="Delete Medicine"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
