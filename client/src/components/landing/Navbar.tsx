"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Vote,
  Wallet,
  CheckCircle2,
  Menu,
  X,
  Code2,
  LogOut,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { address, connecting, openWalletModal, disconnectWallet } = useWallet();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan via-blue-500 to-purple flex items-center justify-center shadow-lg shadow-cyan/20 group-hover:scale-105 transition-transform">
              <Vote className="w-5 h-5 text-background" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight flex items-center gap-1.5">
                <span className="text-cyan">Ballot</span>
                <span className="text-foreground">Chain</span>
              </span>
              <span className="text-[10px] text-text-muted font-mono tracking-wide">
                Stellar Soroban dApp
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            <a
              href="#voting-booth"
              className="px-3.5 py-2 text-sm text-text-secondary hover:text-foreground transition-colors rounded-lg hover:bg-surface/60 font-medium"
            >
              Voting Booth
            </a>
            <a
              href="#live-results"
              className="px-3.5 py-2 text-sm text-text-secondary hover:text-foreground transition-colors rounded-lg hover:bg-surface/60 font-medium"
            >
              Live Results
            </a>
            <a
              href="#register-candidate"
              className="px-3.5 py-2 text-sm text-text-secondary hover:text-foreground transition-colors rounded-lg hover:bg-surface/60 font-medium"
            >
              Register Candidate
            </a>
            <a
              href="#contract-info"
              className="px-3.5 py-2 text-sm text-text-secondary hover:text-foreground transition-colors rounded-lg hover:bg-surface/60 font-medium"
            >
              Contract Info
            </a>
            <Link
              href="/ide"
              className="px-3.5 py-2 text-sm text-purple hover:text-purple-300 transition-colors rounded-lg hover:bg-purple/10 font-medium flex items-center gap-1.5"
            >
              <Code2 className="w-4 h-4" />
              IDE Playground
            </Link>
          </div>

          {/* Right Action: Network & Wallet Button */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              <span>Stellar Testnet</span>
            </div>

            {address ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={openWalletModal}
                  className="px-4 py-2 text-sm font-medium rounded-xl bg-surface border border-cyan/40 text-cyan hover:bg-cyan/10 transition-all flex items-center gap-2 shadow-sm font-mono"
                >
                  <CheckCircle2 className="w-4 h-4 text-cyan" />
                  <span>
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </button>
                <button
                  onClick={disconnectWallet}
                  title="Disconnect Wallet"
                  className="p-2 rounded-xl bg-surface border border-border text-text-muted hover:text-accent-red hover:border-accent-red/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openWalletModal}
                disabled={connecting}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-cyan text-background font-semibold hover:opacity-90 transition-all duration-200 flex items-center gap-2 shadow-sm glow-cyan"
              >
                <Wallet className="w-4 h-4" />
                <span>{connecting ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-foreground"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-2 border-t border-border mt-2">
            <a
              href="#voting-booth"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-text-secondary hover:text-foreground rounded-lg hover:bg-surface"
            >
              Voting Booth
            </a>
            <a
              href="#live-results"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-text-secondary hover:text-foreground rounded-lg hover:bg-surface"
            >
              Live Results
            </a>
            <a
              href="#register-candidate"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-text-secondary hover:text-foreground rounded-lg hover:bg-surface"
            >
              Register Candidate
            </a>
            <a
              href="#contract-info"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-text-secondary hover:text-foreground rounded-lg hover:bg-surface"
            >
              Contract Info
            </a>
            <Link
              href="/ide"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-purple rounded-lg hover:bg-purple/10"
            >
              IDE Playground
            </Link>

            <button
              onClick={() => {
                openWalletModal();
                setMobileOpen(false);
              }}
              className="w-full mt-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-cyan text-background text-center flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              {address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Connect Wallet"}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
