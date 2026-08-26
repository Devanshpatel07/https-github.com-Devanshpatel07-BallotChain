"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "How does BallotChain prevent double voting?",
    a: "When a vote transaction is submitted, the Soroban smart contract checks the voter's Stellar address against an internal ledger vector (`get_voters`). If the account has already voted, the transaction aborts on-chain.",
  },
  {
    q: "Do I need real XLM to vote on Testnet?",
    a: "No! BallotChain operates on Stellar Testnet. You can fund any Freighter testnet wallet instantly with free testnet XLM using the official Stellar Friendbot.",
  },
  {
    q: "How do I verify my vote on the blockchain explorer?",
    a: "Every cast vote returns a unique 64-character hexadecimal transaction hash. You can paste this hash into Stellar Expert Explorer to inspect ledger number, signatures, and XDR operation details.",
  },
  {
    q: "Where is the smart contract code hosted?",
    a: "The smart contract is written in Rust (`contract/contracts/contract/src/lib.rs`) and compiled to WASM. You can also explore and execute contract functions inside the interactive IDE Playground at `/ide`.",
  },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple/10 border border-purple/20 text-purple text-xs font-semibold uppercase tracking-wider mb-4">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
          Voting & Governance Guide
        </h2>
        <p className="text-text-secondary text-sm sm:text-base">
          Everything you need to know about participating in BallotChain elections on Stellar.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={faq.q}
            className="glass rounded-2xl border border-border overflow-hidden transition-colors"
          >
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-foreground hover:bg-surface/50 transition-colors"
            >
              <span>{faq.q}</span>
              <ChevronDown
                className={`w-4 h-4 text-cyan shrink-0 transition-transform ${
                  openIdx === i ? "rotate-180" : ""
                }`}
              />
            </button>
            {openIdx === i && (
              <div className="px-6 pb-5 pt-1 text-sm text-text-secondary leading-relaxed border-t border-border/40">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
