"use client";

import { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { formatAddress } from "@/lib/utils";
import { ReservationStatus } from "@/lib/types";
import ReservationCard from "@/components/ReservationCard";

type FilterTab = "all" | ReservationStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "active", label: "Activas" },
  { key: "expired", label: "Vencidas" },
  { key: "cancelled", label: "Canceladas" },
];

export default function ReservationsPage() {
  const { reservations, reservationsLoading, walletAddress } = useApp();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const filtered =
    activeTab === "all"
      ? reservations
      : reservations.filter((r) => r.status === activeTab);

  const counts = {
    all: reservations.length,
    active: reservations.filter((r) => r.status === "active").length,
    expired: reservations.filter((r) => r.status === "expired").length,
    cancelled: reservations.filter((r) => r.status === "cancelled").length,
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-900">
      {/* Page header */}
      <div className="border-b border-surface-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Mis Reservas</h1>
              <p className="text-surface-400 mt-1 text-sm">
                Tu historial de estacionamiento registrado en la blockchain
              </p>
            </div>
            {walletAddress && (
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-800 border border-surface-700 rounded-full">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-mono text-surface-300">{formatAddress(walletAddress)}</span>
              </div>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mt-6 bg-surface-800 p-1 rounded-xl w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-surface-700 text-white shadow-sm"
                    : "text-surface-400 hover:text-surface-200"
                }`}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      activeTab === tab.key
                        ? "bg-brand-500/20 text-brand-400"
                        : "bg-surface-700 text-surface-500"
                    }`}
                  >
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {reservationsLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <svg className="w-8 h-8 text-brand-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-surface-400">Cargando reservas desde la blockchain...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={activeTab} walletConnected={!!walletAddress} />
        ) : (
          <div className="space-y-4">
            {filtered.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ filter, walletConnected }: { filter: FilterTab; walletConnected: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-2xl bg-surface-800 border border-surface-700 flex items-center justify-center mb-6">
        <svg className="w-9 h-9 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {filter === "active" ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          ) : filter === "cancelled" ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          ) : filter === "expired" ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          )}
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">No se encontraron reservas</h3>
      <p className="text-sm text-surface-400 max-w-sm mb-6">
        {!walletConnected
          ? "Conectá tu billetera para ver tus reservas registradas en la blockchain."
          : filter === "active"
          ? "No tenés reservas activas. Buscá un lugar en el mapa."
          : filter === "cancelled"
          ? "Todavía no tenés reservas canceladas."
          : filter === "expired"
          ? "Todavía no tenés reservas vencidas."
          : "Todavía no realizaste ninguna reserva. Explorá el mapa para empezar."}
      </p>

      {filter === "active" || filter === "all" ? (
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 gradient-brand text-white font-semibold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow-glow-brand"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          Buscar Estacionamiento
        </Link>
      ) : null}
    </div>
  );
}
