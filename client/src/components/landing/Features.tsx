"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Zap,
  Lock,
  Eye,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "1 Vote Per Account",
    description:
      "Strict account-level voter tracking enforced directly inside the Soroban contract state map.",
    color: "text-cyan",
    bg: "bg-cyan/10",
    border: "border-cyan/20",
  },
  {
    icon: Zap,
    title: "Sub-Second Finality",
    description:
      "Built on Stellar Testnet for lightning-fast vote confirmation and minimal fee overhead.",
    color: "text-purple",
    bg: "bg-purple/10",
    border: "border-purple/20",
  },
  {
    icon: Lock,
    title: "Immutable Storage",
    description:
      "Rust smart contract code guarantees that vote tallies cannot be altered or overwritten.",
    color: "text-accent-green",
    bg: "bg-accent-green/10",
    border: "border-accent-green/20",
  },
  {
    icon: Eye,
    title: "Transparent Audit",
    description:
      "Publicly queryable RPC endpoints allow anyone to verify election tallies independently.",
    color: "text-accent-amber",
    bg: "bg-accent-amber/10",
    border: "border-accent-amber/20",
  },
];

export default function Features() {
  return (
    <section id="features" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-xs font-semibold uppercase tracking-wider mb-4">
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Core Voting Guarantees</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Why Choose BallotChain?
        </h2>
        <p className="text-text-secondary text-base sm:text-lg">
          Combining cryptographic security with user-friendly Web3 wallet integration to eliminate election fraud and reporting delays.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`glass rounded-2xl p-6 border ${feature.border} hover:border-opacity-60 transition-all flex flex-col justify-between`}
          >
            <div>
              <div
                className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-5`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-1.5 text-[11px] font-mono text-text-muted">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
              <span>Verified Soroban Spec</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
