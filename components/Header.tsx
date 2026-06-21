"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-[1002] h-16 glass border-b border-surface-700/50">
      <div className="max-w-screen-2xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transition-transform duration-200 group-hover:scale-105"
            >
              <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="url(#logoGrad)" />
              <text x="18" y="23" textAnchor="middle" fontSize="16" fontWeight="700" fontFamily="Inter, sans-serif" fill="white">P</text>
              <circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.4)" />
              <circle cx="26" cy="10" r="2" fill="rgba(255,255,255,0.4)" />
              <circle cx="10" cy="26" r="2" fill="rgba(255,255,255,0.4)" />
              <circle cx="26" cy="26" r="2" fill="rgba(255,255,255,0.4)" />
              <defs>
                <linearGradient id="logoGrad" x1="4" y1="2" x2="32" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0069c6" />
                  <stop offset="1" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold tracking-tight gradient-text">SmartPark</span>
            <span className="text-[10px] text-surface-500 font-medium tracking-widest uppercase">Estacionamiento Blockchain</span>
          </div>
        </Link>

        {/* Nav */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/reservations"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              pathname === "/reservations"
                ? "text-white bg-surface-700"
                : "text-surface-300 hover:text-white hover:bg-surface-800"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="hidden sm:inline">Mis Reservas</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
