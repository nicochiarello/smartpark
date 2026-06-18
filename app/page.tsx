"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { ParkingSpace } from "@/lib/types";
import { PARKING_SPACES } from "@/lib/mockData";
import { getTodayString } from "@/lib/utils";
import SpaceDetailPanel from "@/components/SpaceDetailPanel";
import ReservationModal from "@/components/ReservationModal";
import TimeRangeSelector from "@/components/TimeRangeSelector";

// Dynamic import to avoid SSR issues with Leaflet
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function HomePage() {
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Shared filter state (filter bar + detail panel stay in sync)
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");

  const handleSelectSpace = useCallback((space: ParkingSpace) => {
    setSelectedSpace(space);
  }, []);

  function handleClosePanel() {
    setSelectedSpace(null);
  }

  function handleReserve() {
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setSelectedSpace(null);
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
      {/* Map fills the full viewport */}
      <Map
        spaces={PARKING_SPACES}
        selectedSpace={selectedSpace}
        onSelectSpace={handleSelectSpace}
      />

      {/* Floating filter bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-2xl px-4 pointer-events-none">
        <div className="glass rounded-2xl px-5 py-4 shadow-panel pointer-events-auto">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Date */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <svg className="w-4 h-4 text-brand-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                value={selectedDate}
                min={getTodayString()}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-surface-800 border border-surface-600 text-surface-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all w-36 cursor-pointer"
              />
            </div>

            <div className="hidden sm:block w-px h-6 bg-surface-600" />

            {/* Time range (compact) */}
            <div className="flex-1">
              <TimeRangeSelector
                fromValue={timeFrom}
                toValue={timeTo}
                onFromChange={setTimeFrom}
                onToChange={setTimeTo}
                compact
              />
            </div>

            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 flex-shrink-0 pl-2 border-l border-surface-700">
              <LegendDot color="bg-success" label="Free" />
              <LegendDot color="bg-warning" label="Reserved" />
              <LegendDot color="bg-danger" label="Full" />
            </div>
          </div>
        </div>
      </div>

      {/* Space count badge */}
      <div className="absolute bottom-6 left-4 z-20 glass rounded-xl px-4 py-2.5 flex items-center gap-2">
        <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
        <span className="text-sm text-surface-200 font-medium">
          {PARKING_SPACES.filter((s) => s.status === "available").length} spaces available
        </span>
      </div>

      {/* Detail panel — slides in from right */}
      {selectedSpace && !showModal && (
        <SpaceDetailPanel
          space={selectedSpace}
          selectedDate={selectedDate}
          timeFrom={timeFrom}
          timeTo={timeTo}
          onDateChange={setSelectedDate}
          onFromChange={setTimeFrom}
          onToChange={setTimeTo}
          onClose={handleClosePanel}
          onReserve={handleReserve}
        />
      )}

      {/* Reservation modal */}
      {showModal && selectedSpace && (
        <ReservationModal
          space={selectedSpace}
          date={selectedDate}
          timeFrom={timeFrom}
          timeTo={timeTo}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-surface-400">{label}</span>
    </div>
  );
}
