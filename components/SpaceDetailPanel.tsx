"use client";

import { ParkingSpace } from "@/lib/types";
import { calculateDuration, calculateTotal, formatARS, getTodayString } from "@/lib/utils";
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
  const duration   = timeFrom && timeTo ? calculateDuration(timeFrom, timeTo) : 0;
  const total      = duration > 0 ? calculateTotal(duration, space.pricePerHour) : 0;
  const canReserve = space.status === "available" && !!selectedDate && !!timeFrom && !!timeTo && duration > 0;

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-[420px] glass border-l border-surface-700/50 shadow-panel z-[1001] flex flex-col overflow-y-auto animate-slide-in-right">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[1002] w-8 h-8 flex items-center justify-center rounded-full bg-surface-700/80 hover:bg-surface-600 text-surface-400 hover:text-white transition-all duration-150"
        aria-label="Cerrar panel"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Imagen */}
      <div className="relative w-full h-44 flex-shrink-0 overflow-hidden">
        <img src={space.imageUrl} alt={space.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900 via-surface-900/40 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <StatusBadge status={space.status} />
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">
        {/* Encabezado */}
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

        {/* Info rápida */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-800 rounded-xl p-3">
            <div className="text-xs text-surface-500 uppercase tracking-wider mb-1">Estado</div>
            <StatusBadge status={space.status} size="sm" />
          </div>
          <div className="bg-surface-800 rounded-xl p-3">
            <div className="text-xs text-surface-500 uppercase tracking-wider mb-1">Tarifa</div>
            <div className="text-sm font-semibold text-white">{formatARS(space.pricePerHour)}</div>
            <div className="text-xs text-surface-500 mt-0.5">por hora</div>
          </div>
        </div>

        {/* Patente actual si está ocupado */}
        {space.currentLicensePlate && (
          <div className="bg-surface-800 rounded-xl p-3 border border-surface-700">
            <div className="text-xs text-surface-500 uppercase tracking-wider mb-1">Patente detectada</div>
            <div className="font-mono text-sm font-bold text-white">{space.currentLicensePlate}</div>
          </div>
        )}

        <p className="text-sm text-surface-400 leading-relaxed">{space.description}</p>

        <div className="border-t border-surface-700" />

        {/* Selección de horario */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">
            Seleccioná tu horario
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">Fecha</label>
              <input
                type="date"
                value={selectedDate}
                min={getTodayString()}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full bg-surface-700 border border-surface-600 text-surface-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
            </div>
            <TimeRangeSelector
              fromValue={timeFrom}
              toValue={timeTo}
              onFromChange={onFromChange}
              onToChange={onToChange}
            />
          </div>
        </div>

        {/* Resumen de precio */}
        {duration > 0 && (
          <div className="bg-surface-800 rounded-xl p-4 space-y-2 border border-surface-700 animate-fade-in">
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Duración</span>
              <span className="text-white font-medium">{duration} hora{duration !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Tarifa</span>
              <span className="text-white font-medium">{formatARS(space.pricePerHour)} / hr</span>
            </div>
            <div className="border-t border-surface-700 pt-2 flex justify-between">
              <span className="text-white font-semibold">Total a pagar</span>
              <span className="text-accent font-bold">{formatARS(total)}</span>
            </div>
          </div>
        )}

        {/* Botón reservar */}
        <button
          onClick={canReserve ? onReserve : undefined}
          disabled={!canReserve}
          className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            canReserve
              ? "gradient-brand text-white hover:opacity-90 active:scale-[0.98] shadow-glow-brand cursor-pointer"
              : "bg-surface-700 text-surface-500 cursor-not-allowed"
          }`}
        >
          {space.status === "reserved" ? (
            "Este lugar ya tiene una reserva activa"
          ) : space.status === "occupied_valid" ? (
            "Lugar ocupado — con reserva válida"
          ) : space.status === "occupied_illegal" ? (
            "Lugar ocupado — sin reserva (ilegal)"
          ) : !selectedDate || !timeFrom || !timeTo || duration <= 0 ? (
            "Seleccioná fecha y horario para reservar"
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Reservar con MercadoPago
            </>
          )}
        </button>

        <p className="text-xs text-surface-500 text-center leading-relaxed">
          Reserva registrada en blockchain — transparente e inmutable.
        </p>
      </div>
    </div>
  );
}
