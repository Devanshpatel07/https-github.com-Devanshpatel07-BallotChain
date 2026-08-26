"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  ExternalLink,
  ShieldCheck,
  Clock,
  Key,
  Hash,
  Database,
} from "lucide-react";
import { DEFAULT_CONTRACT_ID } from "@/lib/sorobanClient";

const mockAuditLogs = [
  {
    voter: "GDX7...4K9L",
    candidate: "Alice Vance",
    txHash: "4a7b57b98d2813dfd5970c679a957a52382f6e911293e506ab68a73b2ef62084",
    ledger: "482914",
    time: "2 mins ago",
    status: "VERIFIED",
  },
  {
    voter: "GBV8...9M2P",
    candidate: "Bob Sterling",
    txHash: "1e8c92a4f6d7809123456789abcdef0123456789abcdef0123456789abcdef02",
    ledger: "482910",
    time: "8 mins ago",
    status: "VERIFIED",
  },
  {
    voter: "GCT3...1P7Q",
    candidate: "Carol Nakamoto",
    txHash: "9b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c",
    ledger: "482902",
    time: "15 mins ago",
    status: "VERIFIED",
  },
];

export default function ResultsAudit() {
  return (
    <section id="live-results" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-semibold uppercase tracking-wider mb-3">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Real-Time Audit Ledger</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Live On-Chain Results & Audit Log
          </h2>
        </div>
        <div className="text-xs text-text-muted font-mono bg-surface px-4 py-2 rounded-xl border border-border shrink-0">
          Syncing with Soroban RPC • Sub-second updates
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass rounded-3xl border border-border overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-border bg-surface/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono font-medium text-text-secondary">
            <Database className="w-4 h-4 text-cyan" />
            <span>Testnet Soroban Transaction Ledger</span>
          </div>
          <span className="text-[11px] text-accent-green font-mono font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent-green animate-ping" />
            Live Monitoring
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[11px] font-mono text-text-muted uppercase tracking-wider bg-surface/30">
                <th className="py-3 px-6">Voter Account</th>
                <th className="py-3 px-6">Candidate Selected</th>
                <th className="py-3 px-6">Soroban Tx Hash</th>
                <th className="py-3 px-6">Ledger</th>
                <th className="py-3 px-6">Time</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs font-mono">
              {mockAuditLogs.map((log) => (
                <tr key={log.txHash} className="hover:bg-surface/50 transition-colors">
                  <td className="py-4 px-6 text-foreground font-semibold">
                    {log.voter}
                  </td>
                  <td className="py-4 px-6 text-cyan font-medium">
                    {log.candidate}
                  </td>
                  <td className="py-4 px-6 text-text-secondary">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${log.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-cyan hover:underline flex items-center gap-1 transition-colors"
                    >
                      <span>{log.txHash.slice(0, 10)}...{log.txHash.slice(-8)}</span>
                      <ExternalLink className="w-3 h-3 text-text-muted" />
                    </a>
                  </td>
                  <td className="py-4 px-6 text-text-muted">{log.ledger}</td>
                  <td className="py-4 px-6 text-text-muted">{log.time}</td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent-green/10 border border-accent-green/20 text-accent-green text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
