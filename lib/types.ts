export type SpaceStatus = "available" | "occupied" | "reserved";
export type ReservationStatus = "active" | "expired" | "cancelled";

export interface ParkingSpace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  totalSlots: number;
  availableSlots: number;
  status: SpaceStatus;
  pricePerHour: number;
  imageUrl: string;
  description: string;
}

export interface Reservation {
  id: string;
  spaceId: string;
  spaceName: string;
  address: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  status: ReservationStatus;
  txHash: string;
  totalEth: number;
}
