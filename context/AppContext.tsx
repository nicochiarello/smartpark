"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { ParkingSpace, Reservation } from "@/lib/types";
import { PARKING_SPACES } from "@/lib/mockData";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
const POLL_MS = 3000;

interface AppContextType {
  spaces: ParkingSpace[];
  spacesLoading: boolean;
  spacesError: string | null;
  refreshSpaces: () => void;
  reservations: Reservation[];
  addReservation: (r: Reservation) => void;
  cancelReservation: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

async function fetchSpaces(): Promise<ParkingSpace[]> {
  const res = await fetch(`${BACKEND_URL}/api/spaces`);
  if (!res.ok) throw new Error(`Backend respondió ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any[] = await res.json();
  return data.map((s) => ({
    id:                   s.id,
    name:                 s.name,
    address:              s.address,
    lat:                  Number(s.lat),
    lng:                  Number(s.lng),
    status:               s.status,
    pricePerHour:         Number(s.price_per_hour),
    imageUrl:             `https://placehold.co/600x300/1e293b/94a3b8?text=${encodeURIComponent(s.name)}`,
    description:          s.description ?? "",
    currentLicensePlate:  s.current_license_plate ?? undefined,
  }));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [spaces, setSpaces]               = useState<ParkingSpace[]>(PARKING_SPACES);
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [spacesError, setSpacesError]     = useState<string | null>(null);
  const [reservations, setReservations]   = useState<Reservation[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSpaces = useCallback(async () => {
    try {
      const loaded = await fetchSpaces();
      setSpaces(loaded);
      setSpacesError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar espacios.";
      setSpacesError(msg);
    }
  }, []);

  const refreshSpaces = useCallback(() => { loadSpaces(); }, [loadSpaces]);

  useEffect(() => {
    setSpacesLoading(true);
    loadSpaces().finally(() => setSpacesLoading(false));
    intervalRef.current = setInterval(loadSpaces, POLL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [loadSpaces]);

  const addReservation = useCallback((r: Reservation) => {
    setReservations((prev) => [r, ...prev]);
  }, []);

  const cancelReservation = useCallback((id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "cancelled" as const } : r))
    );
  }, []);

  return (
    <AppContext.Provider value={{
      spaces,
      spacesLoading,
      spacesError,
      refreshSpaces,
      reservations,
      addReservation,
      cancelReservation,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
