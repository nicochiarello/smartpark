import { ReservationStatus, SpaceStatus } from "@/lib/types";

type BadgeStatus = SpaceStatus | ReservationStatus;

const BADGE_STYLES: Record<BadgeStatus, string> = {
  available:        "bg-success/15 text-success border border-success/25",
  reserved:         "bg-blue-500/15 text-blue-400 border border-blue-500/25",
  occupied_valid:   "bg-violet-500/15 text-violet-400 border border-violet-500/25",
  occupied_illegal: "bg-danger/15 text-danger border border-danger/25",
  active:           "bg-success/15 text-success border border-success/25",
  completed:        "bg-surface-600/50 text-surface-400 border border-surface-600",
  cancelled:        "bg-danger/15 text-danger border border-danger/25",
};

const BADGE_LABELS: Record<BadgeStatus, string> = {
  available:        "Disponible",
  reserved:         "Reservado",
  occupied_valid:   "Ocupado — válido",
  occupied_illegal: "Ocupado — ilegal",
  active:           "Activa",
  completed:        "Completada",
  cancelled:        "Cancelada",
};

const DOT_COLORS: Record<BadgeStatus, string> = {
  available:        "bg-success",
  reserved:         "bg-blue-400",
  occupied_valid:   "bg-violet-400",
  occupied_illegal: "bg-danger",
  active:           "bg-success",
  completed:        "bg-surface-500",
  cancelled:        "bg-danger",
};

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClass} ${BADGE_STYLES[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[status]}`} />
      {BADGE_LABELS[status]}
    </span>
  );
}
