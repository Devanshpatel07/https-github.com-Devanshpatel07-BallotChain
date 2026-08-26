"use client";

import { motion } from "framer-motion";
import {
  Vote,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Lock,
  BarChart3,
  UserCheck,
} from "lucide-react";
import { DEFAULT_CONTRACT_ID } from "@/lib/sorobanClient";

const stats = [
  { label: "Decentralized Votes", value: "3,490+", icon: Vote, color: "text-cyan" },
  { label: "Contract Finality", value: "< 1 Sec", icon: Zap, color: "text-purple" },
  { label: "On-Chain Verified", value: "100%", icon: ShieldCheck, color: "text-accent-green" },
  { label: "Network", value: "Stellar Testnet", icon: Lock, color: "text-accent-amber" },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-radial opacity-70" />
      <div className="absolute top-20 left-10 w-80 h-80 bg-cyan/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple/10 rounded-full blur-[120px]" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-cyan/30 bg-cyan/10 text-cyan text-sm font-medium shadow-sm backdrop-blur-md"
        >
          <ShieldCheck className="w-4 h-4 text-cyan" />
          <span>Verifiable Blockchain Elections • Stellar Soroban Smart Contract</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6"
        >
          Decentralized & Tamper-Proof
          <br />
          <span className="text-gradient">Voting on Stellar</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          BallotChain empowers transparent, trustless, and audit-ready elections.
          Cast your vote directly on the Stellar Testnet with Freighter wallet signing and instant Soroban smart contract verification.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <a
            href="#voting-booth"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan text-background font-bold text-base hover:opacity-90 transition-all glow-cyan flex items-center justify-center gap-2.5 shadow-lg shadow-cyan/25"
          >
            <Vote className="w-5 h-5" />
            Cast Your Vote Now
            <ArrowRight className="w-4 h-4 ml-1" />
          </a>

          <a
            href="#register-candidate"
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-border bg-surface/50 text-foreground font-semibold text-base hover:border-purple/40 hover:bg-purple/10 transition-all flex items-center justify-center gap-2"
          >
            <UserCheck className="w-5 h-5 text-purple" />
            Register Candidate
          </a>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl p-5 border border-border hover:border-cyan/30 transition-all text-center flex flex-col items-center"
            >
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-extrabold font-mono text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-text-secondary font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Active Soroban Contract Banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface/60 border border-border text-xs text-text-secondary font-mono"
        >
          <span className="text-cyan font-semibold">Live Soroban Contract:</span>
          <span className="text-foreground break-all">{DEFAULT_CONTRACT_ID}</span>
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${DEFAULT_CONTRACT_ID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan hover:underline flex items-center gap-1 shrink-0 ml-1"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
