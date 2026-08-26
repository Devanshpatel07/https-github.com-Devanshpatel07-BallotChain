"use client";

import Link from "next/link";
import { Vote, ExternalLink, ShieldCheck } from "lucide-react";
import { DEFAULT_CONTRACT_ID } from "@/lib/sorobanClient";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Description */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-purple flex items-center justify-center">
              <Vote className="w-4 h-4 text-background" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight">
                <span className="text-cyan">Ballot</span>
                <span className="text-foreground">Chain</span>
              </span>
              <p className="text-xs text-text-muted">
                Decentralized Voting dApp on Stellar Soroban
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-text-secondary font-medium">
            <a href="#voting-booth" className="hover:text-foreground transition-colors">
              Voting Booth
            </a>
            <a href="#live-results" className="hover:text-foreground transition-colors">
              Live Results
            </a>
            <a href="#register-candidate" className="hover:text-foreground transition-colors">
              Register Candidate
            </a>
            <a href="#contract-info" className="hover:text-foreground transition-colors">
              Contract Info
            </a>
            <Link href="/ide" className="text-purple hover:underline">
              IDE Playground
            </Link>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${DEFAULT_CONTRACT_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan hover:underline flex items-center gap-1"
            >
              <span>Stellar Expert</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 text-center text-xs text-text-muted flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2026 BallotChain. Built for Stellar Soroban Ecosystem.</span>
          <span className="flex items-center gap-1 text-accent-green font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            Soroban Testnet Contract Verified
          </span>
        </div>
      </div>
    </footer>
  );
}
