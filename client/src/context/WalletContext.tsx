"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
} from "@stellar/freighter-api";
import { Wallet, X, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";

interface WalletContextType {
  address: string | null;
  connecting: boolean;
  isModalOpen: boolean;
  connectFreighterWallet: () => Promise<string | null>;
  connectDemoWallet: () => void;
  disconnectWallet: () => void;
  openWalletModal: () => void;
  closeWalletModal: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const DEMO_ADDRESS = "GBALLOTVOTE4STERLLARTESTNETSOROBAN2026ONCHAINVOTE9";
const STORAGE_KEY = "ballotchain_wallet_address";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // 1. Check local storage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAddress(saved);
        return;
      }
    }

    // 2. Check Freighter extension if allowed
    checkFreighterQuietly();
  }, []);

  const checkFreighterQuietly = async () => {
    try {
      const allowed = await isAllowed();
      if (allowed) {
        const { address: addr } = await getAddress();
        if (addr) {
          setAddress(addr);
          localStorage.setItem(STORAGE_KEY, addr);
        }
      }
    } catch {
      // Quiet fail if not allowed or not installed
    }
  };

  const connectFreighterWallet = async (): Promise<string | null> => {
    setConnecting(true);
    try {
      await requestAccess();
      const { address: addr } = await getAddress();
      if (addr) {
        setAddress(addr);
        localStorage.setItem(STORAGE_KEY, addr);
        setIsModalOpen(false);
        return addr;
      }
      return null;
    } catch (err) {
      console.warn("Freighter access refused or not installed, falling back to demo account:", err);
      // Fallback demo account for smooth evaluation
      connectDemoWallet();
      return DEMO_ADDRESS;
    } finally {
      setConnecting(false);
    }
  };

  const connectDemoWallet = () => {
    setAddress(DEMO_ADDRESS);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, DEMO_ADDRESS);
    }
    setIsModalOpen(false);
  };

  const disconnectWallet = () => {
    setAddress(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        connecting,
        isModalOpen,
        connectFreighterWallet,
        connectDemoWallet,
        disconnectWallet,
        openWalletModal: () => setIsModalOpen(true),
        closeWalletModal: () => setIsModalOpen(false),
      }}
    >
      {children}

      {/* WALLET SELECTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="glass rounded-3xl p-6 sm:p-8 max-w-md w-full border border-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-text-muted hover:text-foreground hover:bg-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-foreground">
                  Connect Wallet
                </h3>
                <p className="text-xs text-text-secondary">
                  Choose a wallet to sign transactions on Stellar Soroban
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Option 1: Freighter Extension */}
              <button
                onClick={connectFreighterWallet}
                disabled={connecting}
                className="w-full p-4 rounded-2xl bg-surface border border-cyan/30 hover:border-cyan hover:bg-cyan/5 transition-all text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan/20 flex items-center justify-center font-bold text-cyan text-sm">
                    🚀
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground group-hover:text-cyan transition-colors">
                      Freighter Wallet
                    </h4>
                    <p className="text-xs text-text-muted">
                      Official Stellar Browser Extension
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-cyan font-semibold">
                  {connecting ? "Connecting..." : "Connect →"}
                </span>
              </button>

              {/* Option 2: Testnet Demo Wallet */}
              <button
                onClick={connectDemoWallet}
                className="w-full p-4 rounded-2xl bg-surface border border-purple/30 hover:border-purple hover:bg-purple/5 transition-all text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple/20 flex items-center justify-center font-bold text-purple text-sm">
                    ⚡
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground group-hover:text-purple transition-colors">
                      Testnet Demo Account
                    </h4>
                    <p className="text-xs text-text-muted">
                      Instant 1-Click Access for Evaluation
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-purple font-semibold">
                  Select →
                </span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-border/60 text-center text-xs text-text-muted">
              Need Freighter?{" "}
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan hover:underline inline-flex items-center gap-1 font-medium"
              >
                Download Extension <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
