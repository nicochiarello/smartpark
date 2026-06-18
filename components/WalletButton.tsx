"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { formatAddress } from "@/lib/utils";

export default function WalletButton() {
  const { walletAddress, isConnecting, connectWallet, disconnectWallet } = useApp();
  const [showDisconnect, setShowDisconnect] = useState(false);

  if (walletAddress) {
    return (
      <div className="relative">
        <button
          onMouseEnter={() => setShowDisconnect(true)}
          onMouseLeave={() => setShowDisconnect(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-800 border border-surface-700 hover:border-brand-500 transition-all duration-200 text-sm font-medium text-surface-200 hover:text-white"
        >
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="font-mono text-xs tracking-wide">{formatAddress(walletAddress)}</span>
          <svg
            className="w-3 h-3 text-surface-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDisconnect && (
          <div
            onMouseEnter={() => setShowDisconnect(true)}
            onMouseLeave={() => setShowDisconnect(false)}
            className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-surface-800 border border-surface-700 shadow-panel overflow-hidden z-50 animate-fade-in"
          >
            <button
              onClick={disconnectWallet}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-danger hover:bg-surface-700 transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="flex items-center gap-2 px-5 py-2.5 rounded-full gradient-brand text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-glow-brand"
    >
      {isConnecting ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          Connect Wallet
        </>
      )}
    </button>
  );
}
