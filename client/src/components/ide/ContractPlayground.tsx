"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getVotes,
  getCandidates,
  vote,
  addCandidate,
  registerCandidate,
  getOwner,
  type Network,
} from "@/hooks/contract";

interface ContractMethod {
  name: string;
  type: "view" | "mutation";
  params: { name: string; type: string; value: string }[];
  result?: string;
}

export default function ContractPlayground({
  contractId,
  walletAddress,
  network,
}: {
  contractId: string | null;
  walletAddress: string | null;
  network: Network;
}) {
  const [methods, setMethods] = useState<ContractMethod[]>([
    {
      name: "get_candidates",
      type: "view",
      params: [],
      result: "",
    },
    {
      name: "get_owner",
      type: "view",
      params: [],
      result: "",
    },
    {
      name: "register_candidate",
      type: "mutation",
      params: [
        { name: "caller", type: "Address", value: walletAddress || "" },
        { name: "candidate", type: "String", value: "" },
      ],
    },
    {
      name: "add_candidate",
      type: "mutation",
      params: [
        { name: "caller", type: "Address", value: walletAddress || "" },
        { name: "candidate", type: "String", value: "" },
      ],
    },
    {
      name: "vote",
      type: "mutation",
      params: [
        { name: "voter", type: "Address", value: walletAddress || "" },
        { name: "candidate", type: "String", value: "" },
      ],
    },
    {
      name: "get_votes",
      type: "view",
      params: [{ name: "candidate", type: "String", value: "" }],
      result: "",
    },
  ]);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [executing, setExecuting] = useState<string | null>(null);
  const [results, setResults] = useState<
    Record<string, { success: boolean; data: string }>
  >({});
  const [paramValues, setParamValues] = useState<
    Record<string, Record<string, string>>
  >({});

  const setParam = (method: string, param: string, value: string) => {
    setParamValues((prev) => ({
      ...prev,
      [method]: { ...(prev[method] || {}), [param]: value },
    }));
  };

  const getParam = (methodName: string, paramName: string): string => {
    if (paramValues[methodName]?.[paramName] !== undefined) {
      return paramValues[methodName][paramName];
    }
    const method = methods.find((m) => m.name === methodName);
    const param = method?.params.find((p) => p.name === paramName);
    if (
      methodName === "add_candidate" ||
      methodName === "register_candidate" ||
      methodName === "vote"
    ) {
      if (paramName === "caller" || paramName === "voter") {
        return walletAddress || "";
      }
    }
    return param?.value || "";
  };

  const executeMethod = async (method: ContractMethod) => {
    if (!contractId) {
      setResults((prev) => ({
        ...prev,
        [method.name]: { success: false, data: "No contract deployed" },
      }));
      return;
    }

    setExecuting(method.name);

    try {
      let data = "";

      switch (method.name) {
        case "get_candidates": {
          const candidates = await getCandidates(contractId, network);
          data = JSON.stringify(candidates);
          break;
        }
        case "get_owner": {
          const owner = await getOwner(contractId, network);
          data = owner;
          break;
        }
        case "get_votes": {
          const candidate = getParam("get_votes", "candidate");
          if (!candidate) throw new Error("Candidate name required");
          const votes = await getVotes(contractId, candidate, network);
          data = String(votes);
          break;
        }
        case "vote": {
          const voter = getParam("vote", "voter");
          const voteCandidate = getParam("vote", "candidate");
          if (!voter || !voteCandidate)
            throw new Error("Voter and candidate required");
          if (!walletAddress) throw new Error("Wallet not connected");
          const result = await vote(
            contractId,
            walletAddress,
            voteCandidate,
            network
          );
          data = `Tx Hash: ${result.txHash}`;
          break;
        }
        case "register_candidate":
        case "add_candidate": {
          const caller = getParam(method.name, "caller");
          const newCandidate = getParam(method.name, "candidate");
          if (!caller || !newCandidate)
            throw new Error("Caller and candidate required");
          if (!walletAddress) throw new Error("Wallet not connected");
          const result = await registerCandidate(
            contractId,
            walletAddress,
            newCandidate,
            network
          );
          data = `Tx Hash: ${result.txHash}`;
          break;
        }
        default:
          data = "Unknown method";
      }

      setResults((prev) => ({
        ...prev,
        [method.name]: { success: true, data },
      }));
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [method.name]: {
          success: false,
          data: err?.message || "Execution failed",
        },
      }));
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
            Contract Playground
          </span>
          {contractId ? (
            <div className="text-[10px] text-text-muted mt-1 font-mono break-all">
              {contractId}
            </div>
          ) : (
            <div className="text-[10px] text-accent-amber mt-1">
              No contract deployed yet
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {!contractId ? (
          <div className="flex flex-col items-center justify-center h-full text-text-muted text-sm gap-3">
            <AlertCircle className="w-8 h-8 opacity-30" />
            <p className="text-center px-4">
              Deploy a contract first, then you can interact with it here.
            </p>
          </div>
        ) : (
          methods.map((method) => (
            <div
              key={method.name}
              className="rounded-xl border border-border overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpanded(expanded === method.name ? null : method.name)
                }
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                      method.type === "view"
                        ? "bg-cyan/10 text-cyan"
                        : "bg-accent-amber/10 text-accent-amber"
                    }`}
                  >
                    {method.type}
                  </span>
                  <span className="text-sm font-mono font-medium">
                    {method.name}
                  </span>
                </div>
                {expanded === method.name ? (
                  <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
                )}
              </button>

              <AnimatePresence>
                {expanded === method.name && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                      {method.params.map((param) => (
                        <div key={param.name} className="flex items-center gap-2">
                          <label className="text-[10px] text-text-muted font-mono w-20 shrink-0">
                            {param.name}
                          </label>
                          <span className="text-[10px] text-text-muted shrink-0">
                            {param.type}
                          </span>
                          <input
                            type="text"
                            value={getParam(method.name, param.name)}
                            onChange={(e) =>
                              setParam(method.name, param.name, e.target.value)
                            }
                            placeholder={
                              param.type === "Address"
                                ? "G..."
                                : `Enter ${param.type}`
                            }
                            className="flex-1 px-2 py-1.5 bg-surface border border-border rounded-lg text-xs font-mono text-foreground outline-none focus:border-cyan/30 transition-colors placeholder:text-text-muted"
                          />
                        </div>
                      ))}

                      <button
                        onClick={() => executeMethod(method)}
                        disabled={executing === method.name || !contractId}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          method.type === "view"
                            ? "bg-cyan/10 text-cyan hover:bg-cyan/20 border border-cyan/20"
                            : "bg-accent-amber/10 text-accent-amber hover:bg-accent-amber/20 border border-accent-amber/20"
                        } disabled:opacity-50`}
                      >
                        {executing === method.name ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        {executing === method.name
                          ? "Executing..."
                          : "Execute"}
                      </button>

                      {results[method.name] && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-2.5 rounded-lg border text-xs font-mono ${
                            results[method.name].success
                              ? "border-accent-green/20 bg-accent-green/5 text-accent-green"
                              : "border-accent-red/20 bg-accent-red/5 text-accent-red"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            {results[method.name].success ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            <span className="font-medium">Result</span>
                          </div>
                          <div className="break-all text-text-secondary">
                            {results[method.name].data}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
