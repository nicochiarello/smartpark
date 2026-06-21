export type SpaceStatus = "available" | "reserved" | "occupied_valid" | "occupied_illegal";
export type ReservationStatus = "active" | "completed" | "cancelled";

export interface ParkingSpace {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  status: SpaceStatus;
  pricePerHour: number;   // en ARS
  imageUrl: string;
  description: string;
  currentLicensePlate?: string;
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
  amountPesos: number;
  userName: string;
  licensePlate: string;
}
