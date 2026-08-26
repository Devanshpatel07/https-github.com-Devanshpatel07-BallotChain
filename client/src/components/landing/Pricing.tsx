"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";

interface Plan {
  name: string;
  monthlyPrice: number | null;
  credits: string;
  speed: string;
  features: string[];
  popular?: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    name: "Standard",
    monthlyPrice: 0,
    credits: "50 AI credits / mo",
    speed: "Standard",
    features: [
      "Soroban contract scaffolding",
      "Basic AI code generation",
      "Testnet deployment",
      "Community support",
      "1 workspace",
    ],
    cta: "Start Free",
  },
  {
    name: "Pro",
    monthlyPrice: 29,
    credits: "500 AI credits / mo",
    speed: "Fast",
    features: [
      "Everything in Standard",
      "Advanced AI copilot",
      "Mainnet deployment",
      "Priority compilation",
      "5 workspaces",
      "GitHub integration",
    ],
    popular: true,
    cta: "Go Pro",
  },
  {
    name: "Plus",
    monthlyPrice: 79,
    credits: "2000 AI credits / mo",
    speed: "Turbo",
    features: [
      "Everything in Pro",
      "Multi-contract orchestration",
      "Custom AI training",
      "Instant compilation",
      "20 workspaces",
      "Team collaboration",
    ],
    cta: "Go Plus",
  },
  {
    name: "Max",
    monthlyPrice: 199,
    credits: "Unlimited AI credits",
    speed: "Instant",
    features: [
      "Everything in Plus",
      "Dedicated VM cluster",
      "Custom model fine-tuning",
      "SLA guarantees",
      "Unlimited workspaces",
      "Priority support",
    ],
    cta: "Go Max",
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    credits: "Custom",
    speed: "Dedicated",
    features: [
      "Everything in Max",
      "On-premise deployment",
      "SSO & RBAC",
      "Audit logs",
      "Dedicated account manager",
      "Custom contracts",
    ],
    cta: "Contact Sales",
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto mb-8">
            Start free, scale as you grow. All plans include Soroban contract
            compilation and testnet deployment.
          </p>

          {/* Annual toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-xl border border-border bg-surface">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                !annual
                  ? "bg-cyan text-background font-medium"
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                annual
                  ? "bg-cyan text-background font-medium"
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs opacity-80">-20%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className={`glass rounded-2xl p-6 border transition-all relative ${
                plan.popular
                  ? "border-cyan/40 glow-cyan"
                  : "border-border hover:border-border-glow"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan text-background text-xs font-medium">
                    <Zap className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <div className="mt-2">
                  {plan.monthlyPrice !== null ? (
                    <span className="text-3xl font-bold">
                      $
                      {annual
                        ? Math.round(plan.monthlyPrice * 0.8)
                        : plan.monthlyPrice}
                    </span>
                  ) : (
                    <span className="text-3xl font-bold">Custom</span>
                  )}
                  {plan.monthlyPrice !== null && (
                    <span className="text-text-muted text-sm ml-1">/mo</span>
                  )}
                </div>
              </div>

              <div className="space-y-1 mb-4 text-sm">
                <div className="text-text-secondary">{plan.credits}</div>
                <div className="text-text-muted">
                  Speed: {plan.speed}
                </div>
              </div>

              <div className="space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-accent-green mt-0.5 shrink-0" />
                    <span className="text-text-secondary">{f}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${
                  plan.popular
                    ? "bg-cyan text-background hover:opacity-90 glow-cyan"
                    : "border border-border text-foreground hover:border-cyan/30 hover:bg-surface"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
