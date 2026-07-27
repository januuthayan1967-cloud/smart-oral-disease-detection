import React from 'react';
import { getFirstAidTips, DISCLAIMER_TEXT } from '../utils/firstAidTips';

export default function FirstAidTips({ predictedClass }) {
  const firstAid = getFirstAidTips(predictedClass);

  if (!firstAid || !firstAid.tips || firstAid.tips.length === 0) {
    return null;
  }

  return (
    <div
      className="mt-5 rounded-2xl p-5"
      style={{
        background: 'color-mix(in srgb, var(--surface-2) 80%, transparent)',
        border: '1px solid var(--border-soft)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-xl">🩹</span>
        <h3
          className="text-lg font-bold"
          style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--heading)' }}
        >
          First Aid Tips
        </h3>
      </div>

      <ul className="space-y-2 mb-4">
        {firstAid.tips.map((tip, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text)' }}>
            <span className="mt-1 text-xs" style={{ color: 'var(--accent)' }}>•</span>
            <span className="leading-relaxed">{tip}</span>
          </li>
        ))}
      </ul>

      <div
        className="rounded-xl p-3 text-xs leading-relaxed flex items-start gap-2"
        style={{
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.25)',
          color: 'var(--text)',
        }}
      >
        <span className="text-sm shrink-0">⚠️</span>
        <p>
          <strong className="text-amber-500">Disclaimer:</strong> {DISCLAIMER_TEXT}
        </p>
      </div>
    </div>
  );
}
