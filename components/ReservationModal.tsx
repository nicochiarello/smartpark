"use client";

import { useState, useEffect } from "react";
import { ParkingSpace } from "@/lib/types";
import { useApp } from "@/context/AppContext";
import { formatEth, generateTxHash, calculateDuration, calculateTotal, generateReservationId } from "@/lib/utils";

type ModalState = "confirm" | "processing" | "success";

interface ReservationModalProps {
  space: ParkingSpace;
  date: string;
  timeFrom: string;
  timeTo: string;
  onClose: () => void;
}

export default function ReservationModal({
  space,
  date,
  timeFrom,
  timeTo,
  onClose,
}: ReservationModalProps) {
  const { addReservation } = useApp();
  const [state, setState] = useState<ModalState>("confirm");
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);

  const duration = calculateDuration(timeFrom, timeTo);
  const total = calculateTotal(duration, space.pricePerHour);

  // Trap escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && state !== "processing") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, onClose]);

  async function handleConfirm() {
    setState("processing");
    await new Promise((r) => setTimeout(r, 2000));
    const hash = generateTxHash();
    setTxHash(hash);
    setState("success");
  }

  function handleDone() {
    addReservation({
      id: generateReservationId(),
      spaceId: space.id,
      spaceName: space.name,
      address: space.address,
      date,
      timeFrom,
      timeTo,
      status: "active",
      txHash,
      totalEth: total,
    });
    onClose();
  }

  async function copyHash() {
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const truncatedHash = txHash ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={state !== "processing" ? onClose : undefined}
      />

      {/* Modal card */}
      <div className="relative w-full max-w-md glass rounded-2xl shadow-panel border border-surface-700 animate-scale-in">
        {/* Close button */}
        {state !== "processing" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-700/80 hover:bg-surface-600 text-surface-400 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="p-6">
          {/* CONFIRM STATE */}
          {state === "confirm" && (
            <>
              <h2 className="text-xl font-bold text-white mb-1">Confirmar Reserva</h2>
              <p className="text-sm text-surface-400 mb-6">Revisá los detalles de tu reserva</p>

              {/* Summary card */}
              <div className="bg-surface-800 rounded-xl p-4 space-y-3 border border-surface-700 mb-5">
                <InfoRow icon="📍" label={space.name} sub={space.address} />
                <InfoRow icon="📅" label={formatDate(date)} />
                <InfoRow icon="🕐" label={`${timeFrom} → ${timeTo}`} />
                <InfoRow
                  icon="⏱"
                  label={`${duration} hora${duration !== 1 ? "s" : ""}`}
                />
                <div className="border-t border-surface-700 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">Ξ</span>
                      <span className="text-white font-medium">Total a pagar</span>
                    </div>
                    <span className="text-accent font-bold text-lg">{formatEth(total)}</span>
                  </div>
                </div>
              </div>

              {/* Blockchain notice */}
              <div className="flex items-start gap-2.5 bg-brand-950/50 border border-brand-800/30 rounded-xl px-4 py-3 mb-6">
                <svg className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-brand-300 leading-relaxed">
                  Esta transacción quedará registrada permanentemente en la blockchain, garantizando transparencia total e inmutabilidad.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-surface-600 text-surface-300 font-medium text-sm hover:bg-surface-700 hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-glow-brand"
                >
                  Confirmar y Pagar
                </button>
              </div>
            </>
          )}

          {/* PROCESSING STATE */}
          {state === "processing" && (
            <div className="py-8 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-900/50 border border-brand-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Procesando transacción...</h3>
                <p className="text-sm text-surface-400 mt-1">Transmitiendo a la blockchain</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-surface-500">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                <span>Esperando confirmación</span>
              </div>
            </div>
          )}

          {/* SUCCESS STATE */}
          {state === "success" && (
            <>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-success"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                      strokeDasharray="100"
                      strokeDashoffset="0"
                      style={{ animation: "check-draw 0.5s ease-out forwards" }}
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">¡Reserva Confirmada!</h2>
                <p className="text-sm text-surface-400 mt-1">
                  Tu lugar de estacionamiento quedó registrado en la blockchain
                </p>
              </div>

              {/* Tx hash */}
              <div className="bg-surface-800 rounded-xl p-4 border border-surface-700 mb-5">
                <div className="text-xs text-surface-500 uppercase tracking-wider mb-2">
                  Hash de Transacción
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono text-accent truncate">{truncatedHash}</code>
                  <button
                    onClick={copyHash}
                    className="flex-shrink-0 p-1.5 rounded-lg bg-surface-700 hover:bg-surface-600 text-surface-400 hover:text-white transition-all"
                    title="Copiar hash completo"
                  >
                    {copied ? (
                      <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <a
                  href="#"
                  className="mt-3 flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver en el Explorador
                </a>
              </div>

              <button
                onClick={handleDone}
                className="w-full py-3.5 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-glow-brand"
              >
                Listo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, sub }: { icon: string; label: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base leading-none mt-0.5">{icon}</span>
      <div>
        <div className="text-sm text-white font-medium">{label}</div>
        {sub && <div className="text-xs text-surface-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}
