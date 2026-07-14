const severityConfig = {
  None: {
    dot: '#10B981',
    border: 'rgba(16,185,129,0.3)',
    bg: 'rgba(16,185,129,0.1)',
    text: '#10B981',
    icon: '✓',
  },
  Low: {
    dot: '#F59E0B',
    border: 'rgba(245,158,11,0.3)',
    bg: 'rgba(245,158,11,0.1)',
    text: '#F59E0B',
    icon: '!',
  },
  Moderate: {
    dot: '#F97316',
    border: 'rgba(249,115,22,0.3)',
    bg: 'rgba(249,115,22,0.1)',
    text: '#F97316',
    icon: '!!',
  },
  High: {
    dot: '#F87171',
    border: 'rgba(248,113,113,0.3)',
    bg: 'rgba(248,113,113,0.1)',
    text: '#F87171',
    icon: '!!!',
  },
};

export default function SeverityBadge({ severity }) {
  const cfg = severityConfig[severity] || severityConfig.Low;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
      style={{
        background: cfg.bg,
        borderColor: cfg.border,
        color: cfg.text,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: cfg.dot }}
      />
      {severity || 'Unknown'}
    </span>
  );
}
