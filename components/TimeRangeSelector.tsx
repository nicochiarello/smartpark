"use client";

import { useEffect, useState } from "react";

const HOURS = Array.from({ length: 15 }, (_, i) => {
  const h = i + 8;
  return `${String(h).padStart(2, "0")}:00`;
});

interface TimeRangeSelectorProps {
  fromValue: string;
  toValue: string;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  compact?: boolean;
}

export default function TimeRangeSelector({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  compact = false,
}: TimeRangeSelectorProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fromValue && toValue) {
      const [fh] = fromValue.split(":").map(Number);
      const [th] = toValue.split(":").map(Number);
      if (th <= fh) {
        setError("La hora de fin debe ser posterior a la de inicio");
      } else {
        setError(null);
      }
    }
  }, [fromValue, toValue]);

  const selectClass = compact
    ? "w-full bg-surface-800 border border-surface-600 text-surface-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all cursor-pointer hover:border-surface-500"
    : "w-full bg-surface-700 border border-surface-600 text-surface-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all cursor-pointer hover:border-surface-500";

  return (
    <div>
      <div className={compact ? "flex items-center gap-2" : "grid grid-cols-2 gap-3"}>
        <div>
          {!compact && (
            <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">
              Desde
            </label>
          )}
          <select value={fromValue} onChange={(e) => onFromChange(e.target.value)} className={selectClass}>
            <option value="">Desde</option>
            {HOURS.slice(0, -1).map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        {compact && (
          <svg className="w-4 h-4 text-surface-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        )}

        <div>
          {!compact && (
            <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">
              Hasta
            </label>
          )}
          <select value={toValue} onChange={(e) => onToChange(e.target.value)} className={selectClass}>
            <option value="">Hasta</option>
            {HOURS.slice(1).map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && !compact && (
        <p className="mt-2 text-xs text-danger flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
