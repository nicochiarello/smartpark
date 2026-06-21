export function formatARS(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-AR")} ARS`;
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function calculateDuration(from: string, to: string): number {
  const [fromH, fromM] = from.split(":").map(Number);
  const [toH, toM] = to.split(":").map(Number);
  return Math.max(0, (toH * 60 + toM - (fromH * 60 + fromM)) / 60);
}

export function calculateTotal(hours: number, pricePerHour: number): number {
  return Math.round(hours * pricePerHour);
}

export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function generateReservationId(): string {
  return `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
