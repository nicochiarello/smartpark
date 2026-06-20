"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { ParkingSpace } from "@/lib/types";
import { useApp } from "@/context/AppContext";
import { getTodayString } from "@/lib/utils";
import SpaceDetailPanel from "@/components/SpaceDetailPanel";
import ReservationModal from "@/components/ReservationModal";
import TimeRangeSelector from "@/components/TimeRangeSelector";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function HomePage() {
  const { spaces, spacesLoading, spacesError } = useApp();
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  const availableCount = spaces.filter((s) => s.status === "available").length;

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
      <Map
        spaces={spaces}
        selectedSpace={selectedSpace}
        onSelectSpace={handleSelectSpace}
      />

      {/* Floating filter bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] w-full max-w-2xl px-4 pointer-events-none">
        <div className="glass rounded-2xl px-5 py-4 shadow-panel pointer-events-auto">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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

            <div className="flex-1">
              <TimeRangeSelector
                fromValue={timeFrom}
                toValue={timeTo}
                onFromChange={setTimeFrom}
                onToChange={setTimeTo}
                compact
              />
            </div>

            <div className="hidden sm:flex items-center gap-3 flex-shrink-0 pl-2 border-l border-surface-700">
              <LegendDot color="bg-success" label="Libre" />
              <LegendDot color="bg-warning" label="Reservado" />
              <LegendDot color="bg-danger" label="Completo" />
            </div>
          </div>
        </div>
      </div>

      {/* Space count / loading badge */}
      <div className="absolute bottom-6 left-4 z-[1001] glass rounded-xl px-4 py-2.5 flex items-center gap-2">
        {spacesLoading ? (
          <>
            <svg className="w-4 h-4 text-brand-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-surface-400">Cargando espacios...</span>
          </>
        ) : spacesError ? (
          <>
            <svg className="w-4 h-4 text-danger flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-danger truncate max-w-xs">{spacesError}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="text-sm text-surface-200 font-medium">
              {availableCount} espacio{availableCount !== 1 ? "s" : ""} disponible{availableCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>

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
