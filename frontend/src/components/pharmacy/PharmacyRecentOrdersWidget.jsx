import { useTheme } from '../../context/ThemeContext';

export default function PharmacyRecentOrdersWidget({ orders = [], onViewAll }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const recentOrders = orders.slice(0, 5);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return isDark
          ? 'bg-[#18D99B]/15 text-[#18D99B] border border-[#18D99B]/30'
          : 'bg-[#16835D]/10 text-[#16835D] border border-[#16835D]/30';
      case 'preparing':
      case 'accepted':
      case 'out_for_delivery':
        return isDark
          ? 'bg-[#00C9E8]/15 text-[#00C9E8] border border-[#00C9E8]/30'
          : 'bg-[#087F9C]/10 text-[#087F9C] border border-[#087F9C]/30';
      case 'pending':
        return isDark
          ? 'bg-[#F5B942]/15 text-[#F5B942] border border-[#F5B942]/30'
          : 'bg-[#A66A10]/10 text-[#A66A10] border border-[#A66A10]/30';
      case 'cancelled':
        return isDark
          ? 'bg-[#FF6475]/15 text-[#FF6475] border border-[#FF6475]/30'
          : 'bg-[#C83F4F]/10 text-[#C83F4F] border border-[#C83F4F]/30';
      default:
        return isDark
          ? 'bg-[#94A9BF]/15 text-[#94A9BF] border border-[#94A9BF]/30'
          : 'bg-[#52657A]/10 text-[#52657A] border border-[#52657A]/30';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Pending';
    if (status === 'out_for_delivery') return 'Delivery';
    if (status === 'accepted') return 'Processing';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div
      className="rounded-2xl p-5 flex flex-col justify-between"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(16, 36, 58, 0.75) 0%, rgba(11, 27, 45, 0.85) 100%)'
          : '#FFFFFF',
        border: isDark
          ? '1px solid rgba(217, 173, 86, 0.28)'
          : '1px solid rgba(198, 156, 72, 0.28)',
        boxShadow: isDark
          ? '0 8px 24px rgba(0, 0, 0, 0.45)'
          : '0 8px 24px rgba(20, 36, 58, 0.05)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base" style={{ color: isDark ? '#D9AD56' : '#C69C48' }}>🏷️</span>
          <h3
            className="text-base font-bold"
            style={{
              fontFamily: 'Outfit, sans-serif',
              color: isDark ? '#F8FAFC' : '#14243A',
            }}
          >
            Recent Orders
          </h3>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
              isDark
                ? 'border-[#D9AD56]/30 bg-[#10243A]/60 text-[#F4D58D] hover:bg-[#D9AD56]/15 hover:border-[#F4D58D]'
                : 'border-[#DCE4EC] bg-[#F8FAFC] text-[#C69C48] hover:bg-[#FFFDF8] hover:border-[#C69C48]'
            }`}
          >
            View All
          </button>
        )}
      </div>

      {/* Orders Table */}
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
              <th className="py-2.5 px-2">Customer</th>
              <th className="py-2.5 px-2">Product</th>
              <th className="py-2.5 px-2">Date</th>
              <th className="py-2.5 px-2">Status</th>
              <th className="py-2.5 pl-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              isDark ? 'divide-[#D9AD56]/10' : 'divide-[#DCE4EC]/60'
            }`}
          >
            {recentOrders.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className={`py-6 text-center italic ${
                    isDark ? 'text-[#94A9BF]' : 'text-[#52657A]'
                  }`}
                >
                  No orders recorded yet.
                </td>
              </tr>
            ) : (
              recentOrders.map((order, idx) => {
                const customerName = order.customerName || order.userId?.name || 'Customer';
                const firstItem =
                  order.items?.[0]?.medicineName ||
                  order.prescriptionId?.medicines?.[0]?.medicineName ||
                  'Prescription Meds';
                const dateStr = order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recent';
                const total = order.totalAmount || 0;

                return (
                  <tr
                    key={order._id || idx}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-[#10243A]/40' : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <td
                      className="py-2.5 pr-2 font-mono"
                      style={{ color: isDark ? '#94A9BF' : '#52657A' }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      className="py-2.5 px-2 font-semibold truncate max-w-[100px]"
                      style={{ color: isDark ? '#F8FAFC' : '#14243A' }}
                    >
                      {customerName}
                    </td>
                    <td
                      className="py-2.5 px-2 truncate max-w-[110px]"
                      style={{ color: isDark ? '#94A9BF' : '#52657A' }}
                      title={firstItem}
                    >
                      {firstItem}
                    </td>
                    <td
                      className="py-2.5 px-2 whitespace-nowrap"
                      style={{ color: isDark ? '#94A9BF' : '#52657A' }}
                    >
                      {dateStr}
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(order.status)}`}>
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td
                      className="py-2.5 pl-2 text-right font-bold whitespace-nowrap"
                      style={{ color: isDark ? '#F4D58D' : '#14243A' }}
                    >
                      Rs. {Number(total).toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
