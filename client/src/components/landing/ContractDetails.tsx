"use client";

import { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
} from "lucide-react";
import { DEFAULT_CONTRACT_ID } from "@/lib/sorobanClient";

const contractFunctions = [
  { name: "init(owner)", type: "Admin Init", desc: "Initializes election state with administrator address" },
  { name: "add_candidate(caller, candidate)", type: "Mutation", desc: "Adds new candidate to on-chain vector" },
  { name: "register_candidate(caller, candidate)", type: "Mutation", desc: "Alias wrapper for adding candidates" },
  { name: "vote(voter, candidate)", type: "Mutation", desc: "Enforces 1 vote per account and increments tallies" },
  { name: "get_candidates()", type: "Read View", desc: "Returns registered candidates list" },
  { name: "get_votes(candidate)", type: "Read View", desc: "Returns current vote count for a candidate" },
  { name: "get_owner()", type: "Read View", desc: "Queries contract administrator address" },
  { name: "get_voters()", type: "Read View", desc: "Returns accounts that cast votes" },
];

export default function ContractDetails() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(DEFAULT_CONTRACT_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="contract-info" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="glass rounded-3xl p-8 sm:p-12 border border-border relative overflow-hidden shadow-2xl">
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-xs font-semibold uppercase tracking-wider mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Soroban Smart Contract Specification</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Deployed Contract Architecture
          </h2>
          <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
            BallotChain runs on a compiled WebAssembly (`wasm32v1-none`) Soroban smart contract written in Rust. All state mappings and vector collections are stored directly on the Stellar ledger.
          </p>
        </div>

        {/* Contract Address Box */}
        <div className="p-6 rounded-2xl bg-surface/80 border border-border mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-text-muted font-mono mb-1">
              Testnet Contract ID (56-character Soroban Address)
            </div>
            <div className="text-sm sm:text-base font-mono font-bold text-foreground break-all">
              {DEFAULT_CONTRACT_ID}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-surface border border-border text-xs font-mono font-medium hover:bg-cyan/10 hover:text-cyan hover:border-cyan/30 transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-accent-green" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Contract ID"}</span>
            </button>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${DEFAULT_CONTRACT_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-cyan text-background text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              <span>Stellar Expert</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Functions Grid */}
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple" />
          <span>Smart Contract Methods (`lib.rs`)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contractFunctions.map((fn) => (
            <div
              key={fn.name}
              className="p-4 rounded-xl bg-surface/40 border border-border/80 hover:border-cyan/30 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan/10 text-cyan">
                  {fn.type}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-foreground mb-1 break-all">
                {fn.name}
              </div>
              <div className="text-[11px] text-text-secondary leading-snug">
                {fn.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
