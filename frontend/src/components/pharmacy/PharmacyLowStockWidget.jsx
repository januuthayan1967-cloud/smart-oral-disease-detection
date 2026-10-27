import { useTheme } from '../../context/ThemeContext';

export default function PharmacyLowStockWidget({ items = [], onViewAll, onRestock }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const lowStockItems = items.filter((item) => item.quantity < 10).slice(0, 5);

  return (
    <div
      className="rounded-2xl p-5 flex flex-col justify-between transition-colors"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.75) 0%, rgba(11, 27, 45, 0.85) 100%)'
          : '#FFFFFF',
        border: isDark
          ? '1px solid rgba(217, 173, 86, 0.28)'
          : '1px solid rgba(198, 156, 72, 0.28)',
        boxShadow: isDark
          ? '0 8px 24px rgba(0, 0, 0, 0.45)'
          : '0 8px 24px rgba(20, 36, 58, 0.06)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[#F5B942] font-bold text-base">⚠️</span>
          <h3
            className={`text-base font-bold ${isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'}`}
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Low Stock Medicines
          </h3>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
              isDark
                ? 'border-[#D9AD56]/30 bg-[#10243A]/60 text-[#F4D58D] hover:bg-[#D9AD56]/15 hover:border-[#F4D58D]'
                : 'border-[#C69C48]/35 bg-[#F8FAFC] text-[#8C6D23] hover:bg-[#F1F5F9] hover:border-[#C69C48]'
            }`}
          >
            View All
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr
              className={`border-b uppercase tracking-wider font-semibold text-[10px] ${
                isDark
                  ? 'border-[#D9AD56]/15 text-[#94A9BF]'
                  : 'border-[#DCE4EC] text-[#52657A]'
              }`}
            >
              <th className="py-2.5 pr-2">#</th>
              <th className="py-2.5 px-2">Medicine</th>
              <th className="py-2.5 px-2">Stock</th>
              <th className="py-2.5 px-2">Status</th>
              <th className="py-2.5 pl-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-[#D9AD56]/10' : 'divide-y divide-[#DCE4EC]'}>
            {lowStockItems.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-6 text-center text-[#18D99B] font-medium">
                  ✓ All medicines sufficiently stocked.
                </td>
              </tr>
            ) : (
              lowStockItems.map((med, idx) => (
                <tr
                  key={med._id || idx}
                  className={`transition-colors ${
                    isDark ? 'hover:bg-[#10243A]/40' : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <td className={`py-2.5 pr-2 font-mono ${isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'}`}>
                    {idx + 1}
                  </td>
                  <td
                    className={`py-2.5 px-2 font-semibold truncate max-w-[120px] ${
                      isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'
                    }`}
                    title={med.medicineName}
                  >
                    {med.medicineName}
                  </td>
                  <td className={`py-2.5 px-2 font-bold whitespace-nowrap ${
                    isDark ? 'text-[#F8FAFC]' : 'text-[#14243A]'
                  }`}>
                    {med.quantity}
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        med.quantity === 0
                          ? isDark
                            ? 'bg-[#FF6475]/15 text-[#FF6475] border border-[#FF6475]/30'
                            : 'bg-[#C83F4F]/10 text-[#C83F4F] border border-[#C83F4F]/25'
                          : isDark
                            ? 'bg-[#F5B942]/15 text-[#F5B942] border border-[#F5B942]/30'
                            : 'bg-[#A66A10]/10 text-[#A66A10] border border-[#A66A10]/25'
                      }`}
                    >
                      {med.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </td>
                  <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onRestock && onRestock(med)}
                      className={`p-1 rounded-lg border transition ${
                        isDark
                          ? 'border-[#00C9E8]/30 bg-[#00C9E8]/10 text-[#00C9E8] hover:bg-[#00C9E8]/25'
                          : 'border-[#087F9C]/35 bg-[#087F9C]/10 text-[#087F9C] hover:bg-[#087F9C]/20'
                      }`}
                      title="Update stock"
                      aria-label="Restock"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
