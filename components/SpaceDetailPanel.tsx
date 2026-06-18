"use client";

import { useState } from "react";
import { ParkingSpace } from "@/lib/types";
import { useApp } from "@/context/AppContext";
import { calculateDuration, calculateTotal, formatEth, getTodayString } from "@/lib/utils";
import StatusBadge from "./StatusBadge";
import TimeRangeSelector from "./TimeRangeSelector";

interface SpaceDetailPanelProps {
  space: ParkingSpace;
  selectedDate: string;
  timeFrom: string;
  timeTo: string;
  onDateChange: (d: string) => void;
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onClose: () => void;
  onReserve: () => void;
}

export default function SpaceDetailPanel({
  space,
  selectedDate,
  timeFrom,
  timeTo,
  onDateChange,
  onFromChange,
  onToChange,
  onClose,
  onReserve,
}: SpaceDetailPanelProps) {
  const { walletAddress } = useApp();
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const duration = timeFrom && timeTo ? calculateDuration(timeFrom, timeTo) : 0;
  const total = duration > 0 ? calculateTotal(duration, space.pricePerHour) : 0;
  const canReserve =
    !!walletAddress &&
    !!selectedDate &&
    !!timeFrom &&
    !!timeTo &&
    duration > 0 &&
    space.status !== "occupied";

  const slotPercent = Math.round((space.availableSlots / space.totalSlots) * 100);

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-[420px] glass border-l border-surface-700/50 shadow-panel z-30 flex flex-col overflow-y-auto animate-slide-in-right">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-surface-700/80 hover:bg-surface-600 text-surface-400 hover:text-white transition-all duration-150"
        aria-label="Close panel"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image */}
      <div className="relative w-full h-44 flex-shrink-0 overflow-hidden">
        <img
          src={space.imageUrl}
          alt={space.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/40 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <StatusBadge status={space.status} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white leading-tight mb-1">{space.name}</h2>
          <div className="flex items-center gap-1.5 text-surface-400 text-sm">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{space.address}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Slots */}
          <div className="bg-surface-800 rounded-xl p-3">
            <div className="text-xs text-surface-500 uppercase tracking-wider mb-1">Availability</div>
            <div className="text-base font-semibold text-white">
              {space.availableSlots}
              <span className="text-surface-400 font-normal"> / {space.totalSlots}</span>
            </div>
            <div className="mt-2 h-1.5 bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${slotPercent}%`,
                  background: slotPercent > 50 ? "#10b981" : slotPercent > 20 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
          </div>

          {/* Price */}
          <div className="bg-surface-800 rounded-xl p-3">
            <div className="text-xs text-surface-500 uppercase tracking-wider mb-1">Price</div>
            <div className="text-base font-semibold text-white">
              {formatEth(space.pricePerHour)}
            </div>
            <div className="text-xs text-surface-500 mt-1">per hour</div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-surface-400 leading-relaxed">{space.description}</p>

        <div className="border-t border-surface-700" />

        {/* Date & Time selection */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
            Select your time
          </h3>

          <div className="space-y-3">
            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                min={getTodayString()}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full bg-surface-700 border border-surface-600 text-surface-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Time range */}
            <TimeRangeSelector
              fromValue={timeFrom}
              toValue={timeTo}
              onFromChange={onFromChange}
              onToChange={onToChange}
            />
          </div>
        </div>

        {/* Price summary */}
        {duration > 0 && (
          <div className="bg-surface-800 rounded-xl p-4 space-y-2 border border-surface-700 animate-fade-in">
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Duration</span>
              <span className="text-white font-medium">{duration} hour{duration !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Rate</span>
              <span className="text-white font-medium">{formatEth(space.pricePerHour)} / hr</span>
            </div>
            <div className="border-t border-surface-700 pt-2 flex justify-between">
              <span className="text-white font-semibold">Total</span>
              <span className="text-accent font-bold">{formatEth(total)}</span>
            </div>
          </div>
        )}

        {/* Reserve button */}
        <div className="relative">
          {!walletAddress && (
            <div
              className="absolute -top-12 left-1/2 -translate-x-1/2 w-max max-w-[240px] text-center"
              style={{ display: tooltipVisible ? "block" : "none" }}
            >
              <div className="bg-surface-700 text-surface-200 text-xs px-3 py-2 rounded-lg shadow-lg border border-surface-600">
                Connect your wallet to reserve
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-surface-700 border-b border-r border-surface-600 rotate-45" />
              </div>
            </div>
          )}
          <button
            onClick={canReserve ? onReserve : undefined}
            onMouseEnter={() => !walletAddress && setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            disabled={!canReserve}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              canReserve
                ? "gradient-brand text-white hover:opacity-90 active:scale-[0.98] shadow-glow-brand cursor-pointer"
                : "bg-surface-700 text-surface-500 cursor-not-allowed"
            }`}
          >
            {space.status === "occupied" ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                No slots available
              </>
            ) : !walletAddress ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Connect wallet to reserve
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reserve Parking
              </>
            )}
          </button>
        </div>

        {/* Blockchain note */}
        <p className="text-xs text-surface-500 text-center leading-relaxed">
          Reservation secured by blockchain — transparent, tamper-proof.
        </p>
      </div>
    </div>
  );
}
