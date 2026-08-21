import React, { useState, useEffect } from 'react';
import { Terminal, ShieldCheck, Play, GitBranch, CheckCircle2, RotateCw, Cpu, Layers, Link2 } from 'lucide-react';
import { sorobanSimulator } from '../lib/sorobanSim';

export default function DevOpsPanel() {
  const [pipelineState, setPipelineState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const [testState, setTestState] = useState<'idle' | 'running' | 'success'>('idle');
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'tests' | 'pipeline' | 'inter_contract'>('tests');
  const [oracleLog, setOracleLog] = useState<Array<{ time: string; action: string; status: string; hash: string }>>([]);

  const runTests = () => {
    setTestState('running');
    setTestLogs([]);
    const logs = [
      "🔄 [Cargo Test] Fetching test dependencies...",
      "⚙️ [Compiler] Compiling voting_contract v0.1.0 (/workspace/contracts/voting)...",
      "🏃‍♂️ [Runner] Running 5 contract integration tests...",
      "🧪 [Test 1/5] test_initialize ... OK (0.012s)",
      "🧪 [Test 2/5] test_register_candidate ... OK (0.009s)",
      "🧪 [Test 3/5] test_cast_single_vote ... OK (0.015s)",
      "🧪 [Test 4/5] test_prevent_double_voting ... OK (0.018s) - Verified storage.persistent() constraints",
      "🧪 [Test 5/5] test_voting_window_timebounds ... OK (0.011s) - Verified Env.ledger().timestamp() clock validation",
      "🎉 [Result] test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out",
    ];

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < logs.length) {
        setTestLogs(prev => [...prev, logs[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setTestState('success');
      }
    }, 400);
  };

  const runPipeline = () => {
    setPipelineState('running');
    setPipelineLogs([]);
    const steps = [
      "🔔 GitHub Actions: Triggered by commit on branch [main]",
      "🔧 Job: setup-rust-toolchain ... Fetching cargo-stable",
      "📥 Checkout repository: git checkout main --depth=1",
      "🛡️ Step: Install Rust target wasm32-unknown-unknown ... Success",
      "📦 Step: Cargo Build compile contract ... compiled in 2.1s",
      "🧪 Step: Cargo Test ... 5 unit tests PASSED",
      "⚡ Step: Soroban CLI optimization ... reduced bytecode from 152KB to 38KB",
      "🌐 Step: Deploy contract to Stellar Testnet (RPC endpoint: https://soroban-testnet.stellar.org:443)...",
      "📝 Created Contract ID: CCVOTINGDAPP2026777777777777777777777777777777777777777777",
      "🚀 Frontend Static Compilation (Next.js/Vite) ... index.html generated",
      "🎉 Pipeline Completed Successfully! Deployment is live."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setPipelineLogs(prev => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setPipelineState('success');
      }
    }, 450);
  };

  // Simulate inter-contract communication (oracle lookup to Stellar Name Service)
  useEffect(() => {
    const handleEvent = () => {
      const wallet = sorobanSimulator.getConnectedWallet();
      if (!wallet) return;

      const randomHash = Math.random().toString(16).slice(2, 10);
      const timestamp = new Date().toLocaleTimeString();
      
      const actions = [
        {
          time: timestamp,
          action: `Invoke SNS Contract: Resolved "${wallet.address.slice(0, 8)}...stellar" domain to active wallet`,
          status: "Inter-Contract OK",
          hash: `0x${randomHash}`
        },
        {
          time: timestamp,
          action: `Invoked Auth Contract: Verified multi-sig weight constraints for signature`,
          status: "Inter-Contract OK",
          hash: `0x${randomHash}`
        }
      ];

      setOracleLog(prev => [actions[0], ...prev].slice(0, 10));
    };

    const unsubscribe = sorobanSimulator.subscribe(handleEvent);
    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden" id="devops-engineering-panel">
      {/* Header */}
      <div className="p-6 bg-zinc-950 border-b border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-800/60 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-1.5">
              Smart DevOps & Test Console
            </h3>
            <p className="text-xs text-zinc-400">Execute on-chain mock contract tests, verify deployment pipelines, and inspect cross-contract calls.</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'tests' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Unit Tests
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'pipeline' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            CI/CD Pipeline
          </button>
          <button
            onClick={() => setActiveTab('inter_contract')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'inter_contract' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Inter-Contract Log
          </button>
        </div>
      </div>

      {/* Content Viewport */}
      <div className="p-5 bg-zinc-950/40">
        
        {/* UNIT TESTS VIEW */}
        {activeTab === 'tests' && (
          <div className="space-y-4" id="devops-tests-content">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-4 border border-zinc-850 rounded-xl">
              <div>
                <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  Soroban Rust Unit Tests
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">Tests storage permanence rules, initialization blocks, and protection against double-ballots.</p>
              </div>
              <button
                onClick={runTests}
                disabled={testState === 'running'}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-zinc-100 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                {testState === 'running' ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    Testing Cargo Target...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-zinc-100" />
                    Run Smart Tests
                  </>
                )}
              </button>
            </div>

            {/* Terminal output */}
            <div className="p-4 bg-black border border-zinc-850 rounded-xl font-mono text-xs text-zinc-300 min-h-[180px] max-h-[220px] overflow-y-auto space-y-1 select-text">
              {testLogs.length === 0 && (
                <p className="text-zinc-500 italic">Click "Run Smart Tests" to trigger cargo-test suite simulation and inspect passing assertions.</p>
              )}
              {testLogs.map((log, index) => {
                const isPass = log.includes('OK') || log.includes('ok') || log.includes('passed');
                return (
                  <p key={index} className={isPass ? 'text-emerald-400' : log.includes('Run') ? 'text-indigo-400' : 'text-zinc-300'}>
                    {log}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {/* CI/CD PIPELINE VIEW */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4" id="devops-pipeline-content">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 p-4 border border-zinc-850 rounded-xl">
              <div>
                <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-indigo-400" />
                  GitHub Actions CD Workflow
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">Orchestrates automated smart contract compilation, WASM optimizations, tests, and web app deployments.</p>
              </div>
              <button
                onClick={runPipeline}
                disabled={pipelineState === 'running'}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-zinc-100 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                {pipelineState === 'running' ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    Deploying Stack...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-zinc-100" />
                    Trigger Deploy Action
                  </>
                )}
              </button>
            </div>

            {/* Pipeline logs console */}
            <div className="p-4 bg-black border border-zinc-850 rounded-xl font-mono text-xs text-zinc-300 min-h-[180px] max-h-[220px] overflow-y-auto space-y-1.5 select-text">
              {pipelineLogs.length === 0 && (
                <p className="text-zinc-500 italic">No runs executed yet. Launch the deployment pipeline process to build the optimized Rust contract and serve the next build.</p>
              )}
              {pipelineLogs.map((log, index) => {
                const isCheck = log.includes('Success') || log.includes('Successfully') || log.includes('PASSED') || log.includes('Complete');
                return (
                  <p key={index} className={isCheck ? 'text-emerald-400 font-bold' : log.startsWith('🔔') ? 'text-indigo-400' : 'text-zinc-300'}>
                    {log}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {/* INTER-CONTRACT COMMUNICATION VIEW */}
        {activeTab === 'inter_contract' && (
          <div className="space-y-4" id="devops-inter-contract-content">
            <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2">
              <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-indigo-400" />
                Inter-Contract Calling & Security Check
              </h4>
              <p className="text-xs text-zinc-400">
                Shows inter-contract invocation logs with the **Stellar Name Service (SNS)** contract. When you interact with this dApp (e.g. casting votes or registering candidates), it sends cross-contract requests to fetch verified user domain names (e.g., `user.stellar`).
              </p>
            </div>

            {/* List of mock oracle interactions */}
            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
              {oracleLog.length === 0 ? (
                <div className="text-center py-10 bg-zinc-950/20 border border-zinc-850 border-dashed rounded-xl">
                  <p className="text-xs text-zinc-500 font-medium">No external contract calls triggered yet.</p>
                  <p className="text-[10px] text-zinc-650 mt-1">Submit a vote or register a candidate above to trigger instant inter-contract identity resolutions.</p>
                </div>
              ) : (
                oracleLog.map((log, index) => (
                  <div key={index} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-start justify-between gap-3 text-xs animate-fade-in">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-900 text-[9px] text-emerald-400 rounded font-bold uppercase">
                          {log.status}
                        </span>
                        <span className="font-mono text-zinc-500 text-[10px]">{log.hash}</span>
                      </div>
                      <p className="text-zinc-300 font-semibold">{log.action}</p>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5 shrink-0">{log.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
