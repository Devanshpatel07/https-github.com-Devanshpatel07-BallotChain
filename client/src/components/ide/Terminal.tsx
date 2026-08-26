"use client";

import { useState, useRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  Activity,
  Database,
  ChevronRight,
  Trash2,
  Copy,
  Check,
} from "lucide-react";

export interface TerminalLine {
  type: "info" | "success" | "error" | "dim";
  text: string;
}

type TabId = "terminal" | "rpc" | "deploy" | "storage";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { id: "terminal", label: "Terminal Output", icon: <TerminalIcon className="w-3 h-3" /> },
  { id: "rpc", label: "Soroban RPC Console", icon: <Activity className="w-3 h-3" /> },
  { id: "deploy", label: "Deployment Logs", icon: <ChevronRight className="w-3 h-3" /> },
  { id: "storage", label: "Contract Storage", icon: <Database className="w-3 h-3" /> },
];

const defaultTerminalLines: TerminalLine[] = [
  { type: "info", text: "stellarIDE v1.0.0 — Soroban Development Environment" },
  { type: "info", text: "" },
  { type: "info", text: "Ready. Connect wallet and deploy a contract to get started." },
];

const defaultRpcLines: TerminalLine[] = [
  { type: "info", text: "[RPC] Waiting for contract interaction..." },
];

const defaultDeployLines: TerminalLine[] = [
  { type: "info", text: "━━━ Deployment Log ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
  { type: "info", text: "" },
  { type: "info", text: "[Deploy] No deployments yet." },
  { type: "info", text: "[Deploy] Click 'Deploy' in the editor toolbar to deploy your contract." },
  { type: "info", text: "" },
  { type: "info", text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
];

const lineColors: Record<string, string> = {
  info: "text-text-secondary",
  success: "text-accent-green",
  error: "text-accent-red",
  dim: "text-text-muted",
};

export default function TerminalPanel({
  terminalLines,
  rpcLines,
  deployLines,
  contractId,
}: {
  terminalLines?: TerminalLine[];
  rpcLines?: TerminalLine[];
  deployLines?: TerminalLine[];
  contractId?: string | null;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("terminal");
  const [copiedLine, setCopiedLine] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const tLines = terminalLines && terminalLines.length > 0 ? terminalLines : defaultTerminalLines;
  const rLines = rpcLines && rpcLines.length > 0 ? rpcLines : defaultRpcLines;
  const dLines = deployLines && deployLines.length > 0 ? deployLines : defaultDeployLines;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeTab, tLines, rLines, dLines]);

  const getLines = (): TerminalLine[] => {
    switch (activeTab) {
      case "rpc": return rLines;
      case "deploy": return dLines;
      default: return tLines;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex items-center border-b border-border bg-surface/30 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-r border-border transition-colors ${
              activeTab === tab.id
                ? "bg-background text-foreground border-b-2 border-b-cyan"
                : "text-text-secondary hover:text-foreground hover:bg-surface"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs">
        {activeTab === "storage" ? (
          <div className="space-y-2">
            <div className="text-text-muted mb-3">
              {contractId
                ? `Contract Storage Explorer — ${contractId}`
                : "No contract deployed yet"}
            </div>
            {contractId ? (
              <div className="p-3 rounded-lg border border-border bg-surface/50 text-text-secondary">
                Connect wallet and invoke methods from the Contract Playground to view storage.
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-border bg-surface/50 text-text-muted">
                Deploy a contract first to explore its storage.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {getLines().map((line, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 group ${
                  lineColors[line.type] || "text-text-secondary"
                }`}
              >
                <span className="text-text-muted select-none shrink-0 w-5 text-right">
                  {line.text ? `${i + 1}` : ""}
                </span>
                <span className="flex-1">{line.text || "\u00A0"}</span>
                {line.text && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(line.text);
                      setCopiedLine(i);
                      setTimeout(() => setCopiedLine(null), 1500);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                  >
                    {copiedLine === i ? (
                      <Check className="w-3 h-3 text-accent-green" />
                    ) : (
                      <Copy className="w-3 h-3 text-text-muted" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
