export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEth(amount: number): string {
  return `${amount.toFixed(4).replace(/\.?0+$/, "")} ETH`;
}

export function generateTxHash(): string {
  const hex = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += hex[Math.floor(Math.random() * 16)];
  }
  return hash;
}

export function calculateDuration(from: string, to: string): number {
  const [fromH, fromM] = from.split(":").map(Number);
  const [toH, toM] = to.split(":").map(Number);
  const fromMinutes = fromH * 60 + fromM;
  const toMinutes = toH * 60 + toM;
  return Math.max(0, (toMinutes - fromMinutes) / 60);
}

export function calculateTotal(hours: number, pricePerHour: number): number {
  return parseFloat((hours * pricePerHour).toFixed(6));
}

export function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

export function generateReservationId(): string {
  return `res_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
