"use client";

import { useState, useEffect } from "react";
import { ParkingSpace } from "@/lib/types";
import { useApp } from "@/context/AppContext";
import { calculateDuration, calculateTotal, formatARS } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

type Step = "form" | "payment" | "processing" | "success";

interface Props {
  space: ParkingSpace;
  date: string;
  timeFrom: string;
  timeTo: string;
  onClose: () => void;
}

export default function ReservationModal({ space, date, timeFrom, timeTo, onClose }: Props) {
  const { addReservation, refreshSpaces } = useApp();
  const [step, setStep]                   = useState<Step>("form");
  const [userName, setUserName]           = useState("");
  const [plate, setPlate]                 = useState("");
  const [formError, setFormError]         = useState<string | null>(null);
  const [result, setResult]               = useState<{
    reservationId: string;
    mpMockId: string;
    txHash: string;
  } | null>(null);

  const duration = calculateDuration(timeFrom, timeTo);
  const total    = calculateTotal(duration, space.pricePerHour);

  // Cerrar con Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && step !== "processing") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, onClose]);

  function handleFormNext() {
    if (!userName.trim()) { setFormError("Ingresá tu nombre completo."); return; }
    if (!plate.trim())    { setFormError("Ingresá la patente del vehículo."); return; }
    setFormError(null);
    setStep("payment");
  }

  async function handlePay() {
    setStep("processing");
    try {
      await new Promise((r) => setTimeout(r, 1500)); // simula procesamiento MP

      const res = await fetch(`${BACKEND_URL}/api/reserve`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id:     space.id,
          user_name:    userName,
          license_plate: plate,
          date,
          time_from:    timeFrom,
          time_to:      timeTo,
          amount_pesos: total,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error del servidor.");

      setResult({
        reservationId: data.reservation_id ?? "N/A",
        mpMockId:      data.mp_mock_id,
        txHash:        data.blockchain?.tx_hash ?? "",
      });

      addReservation({
        id:          data.reservation_id ?? `res_${Date.now()}`,
        spaceId:     space.id,
        spaceName:   space.name,
        address:     space.address,
        date,
        timeFrom,
        timeTo,
        status:      "active",
        txHash:      data.blockchain?.tx_hash ?? "",
        amountPesos: total,
        userName,
        licensePlate: plate,
      });

      refreshSpaces();
      setStep("success");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al procesar la reserva.");
      setStep("form");
    }
  }

  return (
    <div className="fixed inset-0 z-[1003] flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={step !== "processing" ? onClose : undefined}
      />

      <div className="relative w-full max-w-md glass rounded-2xl shadow-panel border border-surface-700 animate-scale-in overflow-hidden">
        {step !== "processing" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-surface-700/80 hover:bg-surface-600 text-surface-400 hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* ── STEP 1: FORMULARIO ── */}
        {step === "form" && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-1">Reservar Lugar</h2>
            <p className="text-sm text-surface-400 mb-5">
              {space.name} · {timeFrom} → {timeTo}
            </p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-surface-700 border border-surface-600 text-surface-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-400 mb-1.5 uppercase tracking-wider">
                  Patente del vehículo
                </label>
                <input
                  type="text"
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="Ej: AB123CD"
                  className="w-full bg-surface-700 border border-surface-600 text-surface-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono tracking-widest transition-all"
                />
              </div>
            </div>

            {/* Resumen de precio */}
            <div className="bg-surface-800 rounded-xl p-4 border border-surface-700 mb-5 space-y-2">
              <Row label="Lugar"     value={space.name} />
              <Row label="Fecha"     value={date} />
              <Row label="Horario"   value={`${timeFrom} → ${timeTo}`} />
              <Row label="Duración"  value={`${duration} hora${duration !== 1 ? "s" : ""}`} />
              <div className="border-t border-surface-700 pt-2 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <span className="text-accent">{formatARS(total)}</span>
              </div>
            </div>

            {formError && (
              <div className="bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 mb-4 text-xs text-danger animate-fade-in">
                {formError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-surface-600 text-surface-300 font-medium text-sm hover:bg-surface-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleFormNext}
                className="flex-1 py-3 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 transition-all shadow-glow-brand"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: MOCK MERCADOPAGO ── */}
        {step === "payment" && (
          <div>
            {/* Header azul MP */}
            <div className="px-6 py-4 flex items-center gap-3" style={{ background: "#009EE3" }}>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-sm">MP</span>
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-tight">Mercado Pago</div>
                <div className="text-blue-100 text-xs">Pago seguro y protegido</div>
              </div>
              <div className="ml-auto">
                <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            <div className="p-6">
              {/* Monto */}
              <div className="text-center mb-5">
                <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">SmartPark · Reserva</p>
                <p className="text-3xl font-black text-white">{formatARS(total)}</p>
                <p className="text-sm text-surface-400 mt-1">
                  {space.name} · {timeFrom} → {timeTo}
                </p>
              </div>

              {/* Tarjeta simulada */}
              <div
                className="rounded-xl p-4 mb-5 shadow-lg"
                style={{ background: "linear-gradient(135deg, #009EE3 0%, #005A9C 100%)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-blue-200 text-xs font-medium uppercase tracking-wider">
                    Tarjeta de crédito
                  </span>
                  <span className="text-white text-sm font-black">VISA</span>
                </div>
                <div className="text-white font-mono text-base tracking-[0.2em] mb-3">
                  •••• •••• •••• 4242
                </div>
                <div className="flex justify-between text-xs text-blue-200">
                  <span>DEMO CARD</span>
                  <span>12/30</span>
                </div>
              </div>

              {/* Nota de simulación */}
              <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-700/30 rounded-xl px-4 py-3 mb-5">
                <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-emerald-400">
                  Transacción simulada — el pago es ficticio pero la reserva queda registrada en blockchain.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("form")}
                  className="flex-1 py-3 rounded-xl border border-surface-600 text-surface-300 font-medium text-sm hover:bg-surface-700 transition-all"
                >
                  ← Volver
                </button>
                <button
                  onClick={handlePay}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110"
                  style={{ background: "#009EE3" }}
                >
                  Pagar {formatARS(total)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: PROCESANDO ── */}
        {step === "processing" && (
          <div className="p-10 flex flex-col items-center text-center gap-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,158,227,0.15)", border: "1px solid rgba(0,158,227,0.4)" }}
            >
              <svg className="w-8 h-8 animate-spin" style={{ color: "#009EE3" }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Procesando pago...</h3>
              <p className="text-sm text-surface-400 mt-1">Registrando en blockchain</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-surface-500">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              <span>Conectando con Sepolia</span>
            </div>
          </div>
        )}

        {/* ── STEP 4: ÉXITO ── */}
        {step === "success" && result && (
          <div className="p-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">¡Reserva Confirmada!</h2>
              <p className="text-sm text-surface-400 mt-1">
                Tu lugar está reservado y sellado en blockchain.
              </p>
            </div>

            <div className="bg-surface-800 rounded-xl p-4 border border-surface-700 mb-5 space-y-3">
              <SuccessRow label="Lugar"       value={space.name} />
              <SuccessRow label="Patente"     value={plate} mono />
              <SuccessRow label="Horario"     value={`${timeFrom} → ${timeTo}`} />
              <SuccessRow label="Total pagado" value={formatARS(total)} accent />
              <div className="border-t border-surface-700 pt-3 space-y-2">
                <div>
                  <p className="text-xs text-surface-500 mb-0.5">MP Mock ID</p>
                  <p className="font-mono text-xs text-brand-300">{result.mpMockId}</p>
                </div>
                {result.txHash && (
                  <div>
                    <p className="text-xs text-surface-500 mb-0.5">Blockchain TX</p>
                    <p className="font-mono text-xs text-accent truncate">
                      {result.txHash.slice(0, 22)}…
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl gradient-brand text-white font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-glow-brand"
            >
              Listo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-surface-400">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

function SuccessRow({
  label, value, mono, accent,
}: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-surface-400">{label}</span>
      <span className={`text-sm font-medium ${accent ? "text-accent" : "text-white"} ${mono ? "font-mono tracking-wide" : ""}`}>
        {value}
      </span>
    </div>
  );
}
