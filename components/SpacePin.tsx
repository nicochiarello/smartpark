"use client";

import { ParkingSpace, SpaceStatus } from "@/lib/types";

interface SpacePinProps {
  space: ParkingSpace;
  isSelected: boolean;
  onClick: () => void;
}

const STATUS_COLORS: Record<SpaceStatus, { bg: string; border: string; text: string; shadow: string }> = {
  available: {
    bg: "#10b981",
    border: "#059669",
    text: "#ffffff",
    shadow: "rgba(16, 185, 129, 0.5)",
  },
  occupied: {
    bg: "#ef4444",
    border: "#dc2626",
    text: "#ffffff",
    shadow: "rgba(239, 68, 68, 0.5)",
  },
  reserved: {
    bg: "#f59e0b",
    border: "#d97706",
    text: "#ffffff",
    shadow: "rgba(245, 158, 11, 0.5)",
  },
};

export function SpacePinSVG({
  status,
  availableSlots,
  isSelected,
}: {
  status: SpaceStatus;
  availableSlots: number;
  isSelected: boolean;
}) {
  const colors = STATUS_COLORS[status];
  const scale = isSelected ? 1.2 : 1;

  return (
    <svg
      width={44 * scale}
      height={52 * scale}
      viewBox="0 0 44 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shadow */}
      <ellipse cx="22" cy="50" rx="10" ry="3" fill="rgba(0,0,0,0.3)" />
      {/* Pin body */}
      <path
        d="M22 1C12.059 1 4 9.059 4 19C4 31.5 22 49 22 49C22 49 40 31.5 40 19C40 9.059 31.941 1 22 1Z"
        fill={colors.bg}
        stroke={isSelected ? "#ffffff" : colors.border}
        strokeWidth={isSelected ? "2.5" : "1.5"}
        style={{ filter: isSelected ? `drop-shadow(0 0 8px ${colors.shadow})` : "none" }}
      />
      {/* Inner circle */}
      <circle cx="22" cy="19" r="13" fill={colors.border} fillOpacity="0.3" />
      {/* P letter */}
      <text
        x="18"
        y="22"
        fontSize="12"
        fontWeight="700"
        fontFamily="Inter, sans-serif"
        fill={colors.text}
      >
        P
      </text>
      {/* Slot badge */}
      {availableSlots > 0 && (
        <>
          <circle cx="34" cy="8" r="8" fill="#0f172a" stroke={colors.border} strokeWidth="1.5" />
          <text
            x="34"
            y="12"
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fontFamily="Inter, sans-serif"
            fill={colors.text}
          >
            {availableSlots}
          </text>
        </>
      )}
    </svg>
  );
}

export default SpacePin;

function SpacePin({ space, isSelected, onClick }: SpacePinProps) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer transition-transform duration-200 hover:scale-110 focus:outline-none"
      style={{ background: "none", border: "none", padding: 0 }}
      aria-label={`${space.name} - ${space.status}`}
    >
      <SpacePinSVG
        status={space.status}
        availableSlots={space.availableSlots}
        isSelected={isSelected}
      />
    </button>
  );
}
