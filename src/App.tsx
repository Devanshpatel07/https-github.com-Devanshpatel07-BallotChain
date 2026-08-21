import React, { useState, useEffect } from 'react';
import { Candidate, Wallet, VotingConfig } from './types';
import { sorobanSimulator } from './lib/sorobanSim';
import WalletConnect from './components/WalletConnect';
import ResultsChart from './components/ResultsChart';
import DevOpsPanel from './components/DevOpsPanel';
import LedgerExplorer from './components/LedgerExplorer';
import ContractCode from './components/ContractCode';
import TimeController from './components/TimeController';
import { Landmark, Vote as VoteIcon, PlusCircle, AlertCircle, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

export default function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<Wallet | null>(null);
  const [votingConfig, setVotingConfig] = useState<VotingConfig | null>(null);
  const [currentLedgerTime, setCurrentLedgerTime] = useState<number>(Date.now());
  
  // Registration Form State
  const [candidateName, setCandidateName] = useState('');
  const [candidateDesc, setCandidateDesc] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Voting Tx State
  const [votingCandidateId, setVotingCandidateId] = useState<number | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null);

  // Sync state from simulator
  const syncState = () => {
    setCandidates([...sorobanSimulator.getCandidates()]);
    setConnectedWallet(sorobanSimulator.getConnectedWallet());
    setVotingConfig(sorobanSimulator.getConfig());
    setCurrentLedgerTime(sorobanSimulator.getSimulatedTime());
  };

  useEffect(() => {
    syncState();
    const unsubscribe = sorobanSimulator.subscribe(syncState);
    
    // Periodically update current ledger time
    const timer = setInterval(() => {
      setCurrentLedgerTime(sorobanSimulator.getSimulatedTime());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const handleRegisterCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(false);

    if (!connectedWallet) {
      setRegisterError("Please connect your wallet first.");
      return;
    }

    if (!candidateName.trim() || !candidateDesc.trim()) {
      setRegisterError("Please fill out both candidate name and campaign description.");
      return;
    }

    try {
      setIsRegistering(true);
      await sorobanSimulator.registerCandidate(candidateName, candidateDesc);
      setCandidateName('');
      setCandidateDesc('');
      setRegisterSuccess(true);
      setTimeout(() => setRegisterSuccess(false), 4000);
    } catch (err: any) {
      setRegisterError(err.message || "Failed to register candidate.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCastVote = async (candidateId: number) => {
    setVoteError(null);
    setVoteSuccess(null);
    setVotingCandidateId(candidateId);

    try {
      await sorobanSimulator.vote(candidateId);
      const target = candidates.find(c => c.id === candidateId);
      setVoteSuccess(`Vote transaction verified! Successfully cast your ballot for "${target?.name}".`);
      setTimeout(() => setVoteSuccess(null), 5000);
    } catch (err: any) {
      setVoteError(err.message || "Transaction broadcast failed.");
    } finally {
      setVotingCandidateId(null);
    }
  };

  const handleResetSandbox = () => {
    if (confirm("Are you sure you want to clear the ledger state, configurations, and reset the simulated environment?")) {
      sorobanSimulator.resetAll();
      syncState();
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  // Determine window active state
  const isWindowActive = votingConfig 
    ? currentLedgerTime >= votingConfig.startTime && currentLedgerTime <= votingConfig.endTime 
    : false;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans" id="app-root">
      {/* Decorative Top Accent Bar */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 w-full" />

      {/* Header Banner */}
      <header className="border-b border-zinc-900 bg-zinc-900/40 backdrop-blur-md sticky top-0 z-30" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-950/80 border border-indigo-800 rounded-2xl text-indigo-400">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                Stellar Soroban Voting Portal
              </h1>
              <p className="text-xs text-zinc-400 font-medium">Gas-optimized, secure voting platform powered by Soroban persistent state contracts.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Ledger status badge */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-1.5 flex items-center gap-2 font-mono text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>Block #{sorobanSimulator.getLedgers()[0]?.sequence || '45812903'}</span>
            </div>

            <button
              onClick={handleResetSandbox}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-red-950 text-zinc-400 hover:text-red-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reset Simulated Blockchain State"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset State
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="main-content-layout">
        
        {/* TOP ROW: Wallet Connect Panel */}
        <section id="wallet-integration-section">
          <WalletConnect onWalletConnected={setConnectedWallet} />
        </section>

        {/* Dynamic Voting Window Alert Callout */}
        {votingConfig && (
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm ${
            isWindowActive 
              ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-300' 
              : currentLedgerTime < votingConfig.startTime
                ? 'bg-amber-950/20 border-amber-900/60 text-amber-300'
                : 'bg-red-950/20 border-red-900/60 text-red-300'
          }`} id="voting-window-alert">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">
                  {votingConfig.title}
                </span>
                <p className="text-xs text-zinc-350 mt-0.5">
                  {isWindowActive 
                    ? "The election voting window is currently active. Cast your on-chain ballot below! Enforcing one-vote-per-wallet."
                    : currentLedgerTime < votingConfig.startTime
                      ? `This contract's election window is scheduled. Transaction voting commands will panic until start time at ${new Date(votingConfig.startTime).toLocaleString()}.`
                      : "This election has ended. The persistent store has finalized all candidate counts, and any further vote execution is rejected."
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PRIMARY LAYOUT: 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDE: Ballots & Candidate Registration (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* SECTION: On-Chain Candidates */}
            <div className="space-y-4" id="candidates-voting-hub">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <VoteIcon className="w-5 h-5 text-indigo-400" />
                    Election Ballot Box
                  </h2>
                  <p className="text-xs text-zinc-400">Review candidates and cryptographically sign your ballot.</p>
                </div>
                <span className="text-xs font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
                  {candidates.length} candidates
                </span>
              </div>

              {/* Vote Feed Status Alerts */}
              {voteError && (
                <div className="p-4 bg-red-950/30 border border-red-800 text-red-200 rounded-xl flex items-start gap-3 text-xs animate-fade-in" id="tx-error-toast">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block mb-0.5">Soroban Transaction Rejection</span>
                    <p>{voteError}</p>
                  </div>
                </div>
              )}

              {voteSuccess && (
                <div className="p-4 bg-emerald-950/30 border border-emerald-800 text-emerald-200 rounded-xl flex items-start gap-3 text-xs animate-fade-in" id="tx-success-toast">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block mb-0.5">Transaction Sealed Successfully</span>
                    <p>{voteSuccess}</p>
                  </div>
                </div>
              )}

              {/* Candidates Grid */}
              {candidates.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 border-dashed rounded-2xl space-y-3">
                  <p className="text-sm text-zinc-400 font-medium">No candidates are registered in the ledger state</p>
                  <p className="text-xs text-zinc-500 max-w-xs mx-auto">Use the registration form below to append candidates to the smart contract.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {candidates.map((candidate) => {
                    const isTxPending = votingCandidateId === candidate.id;
                    const walletVoted = connectedWallet ? sorobanSimulator.getEvents().some(
                      evt => evt.topics[0] === 'vote_cast' && evt.topics[1] === connectedWallet.address
                    ) : false;

                    return (
                      <div 
                        key={candidate.id} 
                        className={`p-5 bg-zinc-900 border rounded-2xl transition-all flex flex-col justify-between gap-4 relative group ${
                          isWindowActive && !walletVoted
                            ? 'border-zinc-800 hover:border-zinc-700/80' 
                            : 'border-zinc-800/60 opacity-85 hover:opacity-100'
                        }`}
                        id={`candidate-card-${candidate.id}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-zinc-500 font-semibold px-2 py-0.5 bg-zinc-950 rounded border border-zinc-800/80">
                                ID #{candidate.id}
                              </span>
                              <h3 className="font-bold text-zinc-100 text-base group-hover:text-white transition-colors">{candidate.name}</h3>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-mono font-extrabold text-zinc-100">{candidate.votes}</span>
                              <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider block">votes</span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-zinc-300 leading-relaxed">{candidate.description}</p>
                        </div>

                        {/* Metadata block */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-zinc-850/60 pt-4 gap-3 text-[11px] text-zinc-500 font-mono">
                          <span className="truncate max-w-[200px] sm:max-w-xs">
                            Registered by: <span className="text-zinc-400">{truncateAddress(candidate.registeredBy)}</span>
                          </span>
                          <span>
                            Date: {new Date(candidate.registeredAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-2">
                          <button
                            onClick={() => handleCastVote(candidate.id)}
                            disabled={!isWindowActive || isTxPending || walletVoted || !connectedWallet}
                            className={`w-full py-2.5 px-4 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                              walletVoted
                                ? 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                                : !connectedWallet
                                  ? 'bg-zinc-800/50 border border-zinc-800 text-zinc-500'
                                  : isWindowActive
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-zinc-100 font-bold shadow shadow-indigo-600/10'
                                    : 'bg-zinc-800 border border-zinc-800 text-zinc-500'
                            }`}
                            id={`btn-vote-${candidate.id}`}
                          >
                            {isTxPending ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin shrink-0" />
                                Simulating Soroban VM Signature Auth...
                              </>
                            ) : walletVoted ? (
                              'Double Vote Protected (Already Voted)'
                            ) : !connectedWallet ? (
                              'Connect Wallet to Cast Vote'
                            ) : isWindowActive ? (
                              `Submit ballot for candidate #${candidate.id}`
                            ) : (
                              'Voting window is not active'
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION: Candidate Registration Form */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4" id="candidate-registration-panel">
              <div className="flex items-center gap-2.5 border-b border-zinc-850 pb-3">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Register On-Chain Candidate</h3>
                  <p className="text-xs text-zinc-400">Append a candidate. Consumes 0.1 XLM in Soroban storage fees.</p>
                </div>
              </div>

              {/* Status messages */}
              {registerError && (
                <div className="p-3 bg-red-950/30 border border-red-800 text-red-200 rounded-xl text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p>{registerError}</p>
                </div>
              )}

              {registerSuccess && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-800 text-emerald-200 rounded-xl text-xs flex gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p>Success! New candidate has been registered in the contract storage instance.</p>
                </div>
              )}

              <form onSubmit={handleRegisterCandidate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Candidate / Campaign Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Validator Node Incentive Fund"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    disabled={isRegistering}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-400 block mb-1">Proposal Campaign Description</label>
                  <textarea
                    placeholder="e.g. Distribute XLM treasury balances to validators meeting performance guidelines..."
                    rows={3}
                    value={candidateDesc}
                    onChange={(e) => setCandidateDesc(e.target.value)}
                    disabled={isRegistering}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRegistering || !connectedWallet}
                  className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-800/50 disabled:text-zinc-650 text-zinc-950 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  id="btn-register-candidate"
                >
                  {isRegistering ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin shrink-0" />
                      Invoking register_candidate()...
                    </>
                  ) : !connectedWallet ? (
                    'Connect Wallet to Register Candidate'
                  ) : (
                    'Invoke on-chain register_candidate()'
                  )}
                </button>
              </form>
            </div>

          </div>

          {/* RIGHT SIDE: Results, Explorer, Specs (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Live Poll Results Bar/Donut Chart */}
            <ResultsChart candidates={candidates} />

            {/* Smart Contract Unit Tests & CI/CD Pipeline Dashboard */}
            <DevOpsPanel />

            {/* Time unbound controller sandbox */}
            <TimeController connectedWallet={connectedWallet} />

            {/* Simulated Live Block & Tx Explorer */}
            <LedgerExplorer />

            {/* Smart Contract Code Specification & RPC sandbox */}
            <ContractCode />

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-8 mt-12 text-center text-xs text-zinc-500" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-zinc-400">Soroban Voting dApp — Interactive Sandbox & Explorer Client</p>
          <p>Running on Mock Stellar Testnet. In-app RPC updates emulate the Soroban Virtual Machine ledger clock constraints.</p>
          <p className="text-[10px] text-zinc-650 pt-2 border-t border-zinc-900 max-w-md mx-auto">
            This client simulates cryptographic wallet connection signatures, Friendbot faucet injections, and contract gas calculations (RAM/CPU instruction limits).
          </p>
        </div>
      </footer>
    </div>
  );
}
