import React from 'react';

export default function SparklineWave({
  color = '#00C9E8',
  id = 'wave',
  data = null,
  className = 'w-24 h-7 shrink-0'
}) {
  // If real historical numeric array is provided, compute dynamic SVG path
  let pathD = 'M0,20 Q12,6 25,16 T50,10 T75,18 T100,6';
  let areaD = 'M0,20 Q12,6 25,16 T50,10 T75,18 T100,6 L100,30 L0,30 Z';

  if (Array.isArray(data) && data.length > 2) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = 25 - ((val - min) / range) * 20; // 5 to 25
      return { x, y };
    });

    pathD = `M${points[0].x},${points[0].y} ` + points.slice(1).map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    areaD = `${pathD} L100,30 L0,30 Z`;
  }

  const safeId = `spark-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  return (
    <div className={className}>
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
        <defs>
          <linearGradient id={safeId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${safeId})`} />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
