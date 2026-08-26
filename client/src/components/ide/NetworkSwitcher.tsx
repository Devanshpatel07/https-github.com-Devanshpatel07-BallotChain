"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  ChevronDown,
  Wallet,
  Wifi,
  Loader2,
} from "lucide-react";
import { connectWallet, getWalletAddress, type Network } from "@/hooks/contract";

const networks: { id: Network; label: string; color: string }[] = [
  { id: "testnet", label: "Stellar Testnet", color: "text-accent-green" },
  { id: "mainnet", label: "Stellar Mainnet", color: "text-accent-amber" },
];

export default function NetworkSwitcher({
  connected,
  address,
  network,
  onConnect,
  onDisconnect,
  onNetworkChange,
}: {
  connected: boolean;
  address: string | null;
  network: Network;
  onConnect: () => void;
  onDisconnect: () => void;
  onNetworkChange: (n: Network) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const current = networks.find((n) => n.id === network)!;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await onConnect();
    } finally {
      setConnecting(false);
    }
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
      {/* Network selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg border border-border hover:border-cyan/20 hover:bg-surface transition-all"
        >
          <Globe className={`w-3 h-3 ${current.color}`} />
          <span className="text-text-secondary">{current.label}</span>
          <ChevronDown className="w-3 h-3 text-text-muted" />
        </button>
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 rounded-xl border border-border bg-surface shadow-xl z-50 overflow-hidden">
            {networks.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  onNetworkChange(n.id);
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-alt transition-colors ${
                  network === n.id ? "text-foreground" : "text-text-secondary"
                }`}
              >
                <Globe className={`w-3 h-3 ${n.color}`} />
                <span>{n.label}</span>
                {network === n.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Wallet status */}
      <div className="ml-auto">
        {connected && address ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-accent-green/30 bg-accent-green/5 text-accent-green">
              <Wifi className="w-3 h-3" />
              <span className="max-w-[120px] truncate">{truncateAddress(address)}</span>
            </div>
            <button
              onClick={onDisconnect}
              className="px-2 py-1 text-[10px] text-text-muted hover:text-accent-red rounded border border-border hover:border-accent-red/30 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-border text-text-secondary hover:border-cyan/20 hover:bg-surface transition-all disabled:opacity-50"
          >
            {connecting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Wallet className="w-3 h-3" />
            )}
            <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
