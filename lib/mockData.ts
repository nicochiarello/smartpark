import { ParkingSpace } from "./types";

// Datos estáticos de fallback — la fuente real es el backend (GET /api/spaces).
// Se usan solo si el backend no está disponible.
export const PARKING_SPACES: ParkingSpace[] = [
  {
    id: "P1",
    name: "Lugar P1",
    address: "Maqueta SmartPark – Sector A",
    lat: -32.8895,
    lng: -68.8455,
    status: "available",
    pricePerHour: 1000,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Lugar+P1",
    description: "Lugar de estacionamiento A1 de la maqueta física SmartPark.",
  },
  {
    id: "P2",
    name: "Lugar P2",
    address: "Maqueta SmartPark – Sector A",
    lat: -32.8895,
    lng: -68.8450,
    status: "available",
    pricePerHour: 1000,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Lugar+P2",
    description: "Lugar de estacionamiento A2 de la maqueta física SmartPark.",
  },
  {
    id: "P3",
    name: "Lugar P3",
    address: "Maqueta SmartPark – Sector B",
    lat: -32.8898,
    lng: -68.8455,
    status: "available",
    pricePerHour: 1000,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Lugar+P3",
    description: "Lugar de estacionamiento B1 de la maqueta física SmartPark.",
  },
  {
    id: "P4",
    name: "Lugar P4",
    address: "Maqueta SmartPark – Sector B",
    lat: -32.8898,
    lng: -68.8450,
    status: "available",
    pricePerHour: 1000,
    imageUrl: "https://placehold.co/600x300/1e293b/94a3b8?text=Lugar+P4",
    description: "Lugar de estacionamiento B2 de la maqueta física SmartPark.",
  },
];
