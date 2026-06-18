"use client";

import { useState } from "react";
import { Reservation } from "@/lib/types";
import { useApp } from "@/context/AppContext";
import { formatEth, calculateDuration } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

const BORDER_COLORS: Record<Reservation["status"], string> = {
  active: "border-l-success",
  expired: "border-l-surface-600",
  cancelled: "border-l-danger",
};

interface ReservationCardProps {
  reservation: Reservation;
}

export default function ReservationCard({ reservation }: ReservationCardProps) {
  const { cancelReservation } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const duration = calculateDuration(reservation.timeFrom, reservation.timeTo);
  const truncatedHash = `${reservation.txHash.slice(0, 10)}...${reservation.txHash.slice(-8)}`;

  async function copyHash() {
    await navigator.clipboard.writeText(reservation.txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCancel() {
    cancelReservation(reservation.id);
    setShowConfirm(false);
  }

  function formatDisplayDate(dateStr: string) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div
      className={`bg-surface-800 rounded-2xl border-l-4 ${BORDER_COLORS[reservation.status]} border border-surface-700 p-5 transition-all duration-200 hover:border-surface-600`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white truncate">{reservation.spaceName}</h3>
          <div className="flex items-center gap-1 mt-0.5 text-sm text-surface-400">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="truncate">{reservation.address}</span>
          </div>
        </div>
        <StatusBadge status={reservation.status} size="sm" />
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <Detail
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          label="Date"
          value={formatDisplayDate(reservation.date)}
        />
        <Detail
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Time"
          value={`${reservation.timeFrom} → ${reservation.timeTo}`}
        />
        <Detail
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Duration"
          value={`${duration}h`}
        />
      </div>

      {/* Bottom row: tx hash + price */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-surface-700">
        {/* Tx hash */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <svg className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <code className="text-xs font-mono text-surface-400 truncate">{truncatedHash}</code>
          <button
            onClick={copyHash}
            className="flex-shrink-0 p-1 rounded bg-surface-700 hover:bg-surface-600 text-surface-500 hover:text-white transition-all"
            title="Copy transaction hash"
          >
            {copied ? (
              <svg className="w-3 h-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>

        {/* Price */}
        <span className="text-sm font-semibold text-white flex-shrink-0">
          {formatEth(reservation.totalEth)}
        </span>
      </div>

      {/* Cancel button — active only */}
      {reservation.status === "active" && (
        <div className="mt-4 pt-4 border-t border-surface-700">
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 text-sm text-danger hover:text-red-400 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel Reservation
            </button>
          ) : (
            <div className="flex items-center gap-3 animate-fade-in">
              <span className="text-sm text-surface-300">Are you sure?</span>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs font-semibold bg-danger/15 border border-danger/30 text-danger rounded-lg hover:bg-danger/25 transition-all"
              >
                Yes, cancel
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium bg-surface-700 text-surface-300 rounded-lg hover:bg-surface-600 transition-all"
              >
                No
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-surface-500">{icon}</span>
      <div>
        <div className="text-[10px] text-surface-500 uppercase tracking-wider">{label}</div>
        <div className="text-xs text-surface-200 font-medium">{value}</div>
      </div>
    </div>
  );
}
