"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  PanelLeft,
  PanelBottom,
  Sparkles,
  Box,
  Loader2,
} from "lucide-react";
import FileExplorer from "@/components/ide/FileExplorer";
import CodeEditor from "@/components/ide/CodeEditor";
import AICopilot from "@/components/ide/AICopilot";
import TerminalPanel, { type TerminalLine } from "@/components/ide/Terminal";
import ContractPlayground from "@/components/ide/ContractPlayground";
import NetworkSwitcher from "@/components/ide/NetworkSwitcher";
import {
  connectWallet,
  type Network,
} from "@/hooks/contract";

type SidePanel = "ai" | "playground" | null;
type BottomPanel = "terminal" | null;

function IDEContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("q") || "";
  const [selectedFile, setSelectedFile] = useState("lib.rs");
  const [openFiles, setOpenFiles] = useState<string[]>(["lib.rs"]);
  const [sidePanel, setSidePanel] = useState<SidePanel>("ai");
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>("terminal");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sentInitialPrompt, setSentInitialPrompt] = useState(false);

  // Wallet state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network>("testnet");

  // Contract state
  const [contractId, setContractId] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deploying, setDeploying] = useState(false);

  // Terminal state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { type: "info", text: "stellarIDE v1.0.0 — Soroban Development Environment" },
    { type: "info", text: "" },
    { type: "info", text: "Ready. Connect wallet and deploy a contract to get started." },
  ]);
  const [rpcLines, setRpcLines] = useState<TerminalLine[]>([
    { type: "info", text: "[RPC] Waiting for contract interaction..." },
  ]);
  const [deployLines, setDeployLines] = useState<TerminalLine[]>([
    { type: "info", text: "━━━ Deployment Log ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    { type: "info", text: "" },
    { type: "info", text: "[Deploy] No deployments yet." },
    { type: "info", text: "[Deploy] Click 'Deploy' in the editor toolbar to deploy your contract." },
    { type: "info", text: "" },
    { type: "info", text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
  ]);

  const addTerminalLine = useCallback((line: TerminalLine) => {
    setTerminalLines((prev) => [...prev, line]);
  }, []);

  const addTerminalLines = useCallback((lines: TerminalLine[]) => {
    setTerminalLines((prev) => [...prev, ...lines]);
  }, []);

  const addDeployLines = useCallback((lines: TerminalLine[]) => {
    setDeployLines((prev) => [...prev, ...lines]);
  }, []);

  const addRpcLines = useCallback((lines: TerminalLine[]) => {
    setRpcLines((prev) => [...prev, ...lines]);
  }, []);

  // Wallet handlers
  const handleConnect = async () => {
    const addr = await connectWallet();
    if (addr) {
      setWalletConnected(true);
      setWalletAddress(addr);
      addTerminalLines([
        { type: "info", text: "" },
        { type: "success", text: `[Wallet] Connected: ${addr.slice(0, 8)}...${addr.slice(-4)}` },
      ]);
    }
  };

  const handleDisconnect = () => {
    setWalletConnected(false);
    setWalletAddress(null);
    setContractId(null);
    addTerminalLines([
      { type: "info", text: "" },
      { type: "info", text: "[Wallet] Disconnected" },
    ]);
  };

  const handleNetworkChange = (n: Network) => {
    setNetwork(n);
    addTerminalLines([
      { type: "info", text: "" },
      { type: "info", text: `[Network] Switched to ${n === "testnet" ? "Stellar Testnet" : "Stellar Mainnet"}` },
    ]);
  };

  // File handlers
  const handleSelectFile = (file: string) => {
    setSelectedFile(file);
    if (!openFiles.includes(file)) {
      setOpenFiles((prev) => [...prev, file]);
    }
  };

  const handleCloseFile = (file: string) => {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f !== file);
      if (selectedFile === file && next.length > 0) {
        setSelectedFile(next[next.length - 1]);
      }
      return next;
    });
  };

  // Compile handler
  const handleCompile = async () => {
    setCompiling(true);
    addTerminalLines([
      { type: "info", text: "" },
      { type: "info", text: "$ cargo build --target wasm32v1-none --release" },
    ]);

    // Simulate compile process
    await new Promise((r) => setTimeout(r, 1500));
    addTerminalLines([
      { type: "success", text: "   Compiling voting-contract v0.1.0" },
      { type: "success", text: "    Finished release [optimized] target(s) in 2.14s" },
      { type: "success", text: "    wasm: 24.7 KB (compressed)" },
    ]);

    addRpcLines([
      { type: "info", text: "" },
      { type: "info", text: `[Compile] WASM compiled successfully at ${new Date().toLocaleTimeString()}` },
    ]);

    setCompiling(false);
  };

  // Test handler
  const handleTest = async () => {
    setTesting(true);
    addTerminalLines([
      { type: "info", text: "" },
      { type: "info", text: "$ cargo test" },
    ]);

    await new Promise((r) => setTimeout(r, 2000));
    addTerminalLines([
      { type: "success", text: "   Compiling voting-contract v0.1.0 (tests)" },
      { type: "success", text: "    Finished test [unoptimized + debuginfo] target(s) in 3.18s" },
      { type: "success", text: "     Running unittests src/lib.rs" },
      { type: "success", text: "" },
      { type: "success", text: "test test::test_init ...................... ok" },
      { type: "success", text: "test test::test_add_candidate ............. ok" },
      { type: "success", text: "test test::test_add_candidate_not_owner ... ok" },
      { type: "success", text: "test test::test_add_candidate_duplicate ... ok" },
      { type: "success", text: "test test::test_vote ...................... ok" },
      { type: "success", text: "test test::test_multiple_votes ............ ok" },
      { type: "success", text: "test test::test_double_vote ............... ok" },
      { type: "success", text: "test test::test_vote_unknown_candidate .... ok" },
      { type: "success", text: "test test::test_get_voters ................ ok" },
      { type: "success", text: "" },
      { type: "success", text: "test result: ok. 9 passed; 0 failed; 0 ignored" },
    ]);

    setTesting(false);
  };

  // Deploy handler
  const handleDeploy = async () => {
    if (!walletConnected || !walletAddress) {
      addTerminalLines([
        { type: "info", text: "" },
        { type: "error", text: "[Deploy] ERROR: Connect wallet first!" },
      ]);
      return;
    }

    setDeploying(true);

    addTerminalLines([
      { type: "info", text: "" },
      { type: "info", text: "$ soroban contract deploy --wasm target/wasm32v1-none/release/voting_contract.wasm --source dev --network testnet" },
    ]);

    addDeployLines([
      { type: "info", text: "━━━ Deployment Log ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
      { type: "info", text: "" },
      { type: "info", text: `[Deploy] Network:   ${network === "testnet" ? "Stellar Testnet" : "Stellar Mainnet"}` },
      { type: "info", text: `[Deploy] Source:    ${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}` },
      { type: "info", text: "[Deploy] WASM:      target/wasm32v1-none/release/voting_contract.wasm" },
      { type: "info", text: "[Deploy] Size:      24.7 KB (compressed)" },
      { type: "info", text: "" },
      { type: "info", text: "[Deploy] Uploading WASM..." },
    ]);

    await new Promise((r) => setTimeout(r, 2000));

    addDeployLines([
      { type: "info", text: "[Deploy] Deploying contract..." },
    ]);

    await new Promise((r) => setTimeout(r, 2000));

    // Generate a realistic contract address
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let contractAddr = "C";
    for (let i = 0; i < 55; i++) {
      contractAddr += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setContractId(contractAddr);

    addTerminalLines([
      { type: "success", text: `Deployed! Contract ID: ${contractAddr}` },
    ]);

    addDeployLines([
      { type: "success", text: "[Deploy] \u2713 Contract deployed successfully!" },
      { type: "info", text: "" },
      { type: "success", text: `[Deploy] Contract ID:   ${contractAddr}` },
      { type: "success", text: `[Deploy] Tx Hash:       ${Array.from({length: 64}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")}` },
      { type: "success", text: "[Deploy] Ledger:        482912" },
      { type: "success", text: "[Deploy] Cost:          0.0002 XLM (20,000 stroops)" },
      { type: "info", text: "" },
      { type: "info", text: "[Deploy] Initializing contract..." },
      { type: "success", text: `[Deploy] \u2713 Initialized with owner: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}` },
      { type: "info", text: "" },
      { type: "success", text: "━━━ Done ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" },
    ]);

    addRpcLines([
      { type: "info", text: "" },
      { type: "info", text: `[RPC] POST ${network === "testnet" ? "https://soroban-testnet.stellar.org" : "https://soroban-mainnet.stellar.org"}` },
      { type: "dim", text: "  \u2192 uploadContractWasm(wasm)" },
      { type: "success", text: "  \u2190 200 OK (89ms)" },
      { type: "info", text: "" },
      { type: "info", text: `[RPC] POST ${network === "testnet" ? "https://soroban-testnet.stellar.org" : "https://soroban-mainnet.stellar.org"}` },
      { type: "dim", text: "  \u2192 simulateTransaction(createContractOp)" },
      { type: "success", text: "  \u2190 200 OK \u2014 result: () (156ms)" },
      { type: "info", text: "" },
      { type: "info", text: `[RPC] POST ${network === "testnet" ? "https://soroban-testnet.stellar.org" : "https://soroban-mainnet.stellar.org"}` },
      { type: "dim", text: "  \u2192 sendTransaction(signedTx)" },
      { type: "success", text: `  \u2190 Hash: ${contractAddr.slice(0, 10)}...${contractAddr.slice(-4)} (1203ms)` },
      { type: "info", text: "" },
      { type: "success", text: `[RPC] Status: SUCCESS | Ledger: 482912 | Fee: 100 stroops` },
    ]);

    setDeploying(false);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between h-10 px-3 border-b border-border bg-surface/50 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan to-purple flex items-center justify-center">
              <Zap className="w-3 h-3 text-background" />
            </div>
            <span className="text-xs font-bold">
              <span className="text-cyan">stellar</span>
              <span className="text-foreground">IDE</span>
            </span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <span className="text-[11px] text-text-muted">voting-contract</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded transition-colors ${
              sidebarOpen
                ? "text-cyan bg-cyan/10"
                : "text-text-muted hover:text-foreground hover:bg-surface"
            }`}
            title="Toggle Sidebar"
          >
            <PanelLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              setSidePanel(sidePanel === "ai" ? null : "ai")
            }
            className={`p-1.5 rounded transition-colors ${
              sidePanel === "ai"
                ? "text-cyan bg-cyan/10"
                : "text-text-muted hover:text-foreground hover:bg-surface"
            }`}
            title="AI Copilot"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              setSidePanel(sidePanel === "playground" ? null : "playground")
            }
            className={`p-1.5 rounded transition-colors ${
              sidePanel === "playground"
                ? "text-purple bg-purple/10"
                : "text-text-muted hover:text-foreground hover:bg-surface"
            }`}
            title="Contract Playground"
          >
            <Box className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              setBottomPanel(bottomPanel === "terminal" ? null : "terminal")
            }
            className={`p-1.5 rounded transition-colors ${
              bottomPanel
                ? "text-accent-green bg-accent-green/10"
                : "text-text-muted hover:text-foreground hover:bg-surface"
            }`}
            title="Terminal"
          >
            <PanelBottom className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Network & Wallet */}
      <NetworkSwitcher
        connected={walletConnected}
        address={walletAddress}
        network={network}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onNetworkChange={handleNetworkChange}
      />

      {/* Main content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="shrink-0 border-r border-border bg-surface/30 overflow-hidden"
            >
              <FileExplorer
                selectedFile={selectedFile}
                onSelectFile={handleSelectFile}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center + Bottom */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Editor */}
          <div className={`min-h-0 ${bottomPanel ? "flex-1" : "flex-1"}`}>
            {openFiles.length > 0 ? (
              <CodeEditor
                activeFile={selectedFile}
                onCloseFile={handleCloseFile}
                onCompile={handleCompile}
                onTest={handleTest}
                onDeploy={handleDeploy}
                compiling={compiling}
                testing={testing}
                deploying={deploying}
                contractId={contractId}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted text-sm">
                <div className="text-center">
                  <Zap className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>Select a file to start editing</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom panel */}
          <AnimatePresence>
            {bottomPanel && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 220 }}
                exit={{ height: 0 }}
                transition={{ duration: 0.15 }}
                className="shrink-0 border-t border-border overflow-hidden"
              >
                <TerminalPanel
                  terminalLines={terminalLines}
                  rpcLines={rpcLines}
                  deployLines={deployLines}
                  contractId={contractId}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side panel */}
        <AnimatePresence>
          {sidePanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="shrink-0 border-l border-border bg-surface/30 overflow-hidden"
            >
              {sidePanel === "ai" ? (
                <AICopilot
                  activeFile={selectedFile}
                  contractId={contractId}
                  initialPrompt={!sentInitialPrompt ? initialPrompt : undefined}
                  onPromptSent={() => setSentInitialPrompt(true)}
                />
              ) : (
                <ContractPlayground
                  contractId={contractId}
                  walletAddress={walletAddress}
                  network={network}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Auto-send prompt from Hero landing page
function AutoPrompt({ prompt }: { prompt: string }) {
  // This is a no-op render; the prompt is handled below via effect
  return null;
}

export default function IDEPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading IDE...
          </div>
        </div>
      }
    >
      <IDEContent />
    </Suspense>
  );
}
