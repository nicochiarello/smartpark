"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import type { Signer } from "ethers";
import { ParkingSpace, Reservation, ReservationStatus } from "@/lib/types";
import { CONTRACT_ADDRESS, CONTRACT_ABI, getReadOnlyContract } from "@/lib/contract";
import { SPACE_METADATA, DEFAULT_SPACE_META } from "@/lib/spaceMetadata";

interface AppContextType {
  walletAddress: string | null;
  signer: Signer | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  spaces: ParkingSpace[];
  spacesLoading: boolean;
  spacesError: string | null;
  reservations: Reservation[];
  reservationsLoading: boolean;
  addReservation: (r: Reservation) => void;
  cancelReservation: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

async function fetchSpacesFromChain(): Promise<ParkingSpace[]> {
  const { ethers } = await import("ethers");
  // Prefer window.ethereum as a passive provider (no account request) so reads
  // use MetaMask's configured RPC — the public Amoy RPC doesn't have this contract.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eth = typeof window !== "undefined" ? (window as any).ethereum : null;
  const contract = eth
    ? new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, new ethers.BrowserProvider(eth))
    : getReadOnlyContract();
  const ids: string[] = await contract.getSpaceIds();
  const results = await Promise.allSettled(
    ids.map(async (id) => {
      const s = await contract.spaces(id);
      const meta = SPACE_METADATA[id] ?? DEFAULT_SPACE_META;
      return {
        id: s.id as string,
        name: s.name as string,
        address: s.location as string,
        lat: meta.lat,
        lng: meta.lng,
        totalSlots: meta.totalSlots,
        availableSlots: meta.availableSlots,
        status: (s.isOccupied ? "occupied" : "available") as ParkingSpace["status"],
        pricePerHour: Number(ethers.formatEther(s.pricePerHour as bigint)),
        imageUrl: meta.imageUrl,
        description: meta.description,
      };
    })
  );
  return results
    .filter((r): r is PromiseFulfilledResult<ParkingSpace> => r.status === "fulfilled")
    .map((r) => r.value);
}

async function fetchReservationsFromChain(
  signer: Signer,
  spaceList: ParkingSpace[]
): Promise<Reservation[]> {
  const { ethers } = await import("ethers");
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  const ids: bigint[] = await contract.getMyReservationIds();
  if (ids.length === 0) return [];
  return Promise.all(
    ids.map(async (id) => {
      const r = await contract.getReservation(id);
      const space = spaceList.find((s) => s.id === r.spaceId);
      let status: ReservationStatus;
      if (r.active) {
        status = "active";
      } else {
        const [year, month, day] = (r.date as string).split("-").map(Number);
        const [hour, minute] = (r.timeTo as string).split(":").map(Number);
        const endTime = new Date(year, month - 1, day, hour, minute);
        status = endTime < new Date() ? "expired" : "cancelled";
      }
      return {
        id: `res_${r.id.toString()}`,
        spaceId: r.spaceId as string,
        spaceName: space?.name ?? (r.spaceId as string),
        address: space?.address ?? "",
        date: r.date as string,
        timeFrom: r.timeFrom as string,
        timeTo: r.timeTo as string,
        status,
        txHash: "",
        totalEth: Number(ethers.formatEther(r.totalPaid)),
        onChainId: Number(r.id),
      } as Reservation;
    })
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [spacesLoading, setSpacesLoading] = useState(false);
  const [spacesError, setSpacesError] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);

  const spacesRef = useRef<ParkingSpace[]>([]);
  useEffect(() => { spacesRef.current = spaces; }, [spaces]);

  // Load spaces on mount — public data, no wallet needed
  useEffect(() => {
    setSpacesLoading(true);
    setSpacesError(null);
    fetchSpacesFromChain()
      .then((loaded) => {
        setSpaces(loaded);
        if (loaded.length === 0) setSpacesError("El contrato no devolvió espacios.");
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Error al cargar espacios.";
        setSpacesError(msg);
        console.error("fetchSpacesFromChain:", err);
      })
      .finally(() => setSpacesLoading(false));
  }, []);

  const connectWallet = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eth = typeof window !== "undefined" ? (window as any).ethereum : undefined;
    if (!eth) {
      alert("MetaMask no detectado. Por favor instalá MetaMask para conectar tu billetera.");
      return;
    }
    try {
      setIsConnecting(true);
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(eth);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length === 0) return;

      setWalletAddress(accounts[0]);
      const s = await provider.getSigner();
      setSigner(s);

      // Load this user's reservations
      setReservationsLoading(true);
      fetchReservationsFromChain(s, spacesRef.current)
        .then(setReservations)
        .catch((err) => console.error("Failed to load reservations:", err))
        .finally(() => setReservationsLoading(false));
    } catch (err) {
      console.error("Wallet connection failed:", err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setSigner(null);
    setReservations([]);
  }, []);

  const addReservation = useCallback((r: Reservation) => {
    setReservations((prev) => [r, ...prev]);
  }, []);

  const cancelReservation = useCallback((id: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "cancelled" as const } : r))
    );
  }, []);

  return (
    <AppContext.Provider
      value={{
        walletAddress,
        signer,
        isConnecting,
        connectWallet,
        disconnectWallet,
        spaces,
        spacesLoading,
        spacesError,
        reservations,
        reservationsLoading,
        addReservation,
        cancelReservation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
