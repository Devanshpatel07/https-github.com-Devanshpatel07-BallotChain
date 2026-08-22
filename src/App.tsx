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
    <div className="min-h-screen text-zinc-100 flex flex-col select-none" id="app-root">

      {/* Header Banner */}
      <header className="border-b-4 border-black bg-[#2c2c2c] sticky top-0 z-30 shadow-md" id="main-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1a1a1a] border-4 border-black text-[#5c9e31]">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <h1 className="mc-title text-[#ffffff] flex flex-wrap items-center gap-2">
                Stellar Soroban Voting Portal
                <span className="mc-splash-text text-[11px] ml-2 text-yellow-300">SOROBAN!</span>
              </h1>
              <p className="text-sm text-[#aaaaaa] font-medium leading-tight">Gas-optimized, secure voting platform powered by Soroban persistent state contracts.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Ledger status badge */}
            <div className="mc-gui-panel px-3 py-1 flex items-center gap-2 mc-pixel-font text-[#ffaa00]">
              <span className="w-2.5 h-2.5 bg-[#5c9e31] shrink-0 border-2 border-black animate-pulse" />
              <span className="text-[10px]">Block #{sorobanSimulator.getLedgers()[0]?.sequence || '45812903'}</span>
            </div>

            <button
              onClick={handleResetSandbox}
              className="mc-gui-btn mc-gui-btn-red py-2 px-3 flex items-center gap-1.5"
              title="Reset Simulated Blockchain State"
            >
              <RefreshCw className="w-3 h-3" />
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
          <div className={`p-4 border-4 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isWindowActive 
              ? 'bg-[#1b2b16] text-[#8ce25d]' 
              : currentLedgerTime < votingConfig.startTime
                ? 'bg-[#2f2214] text-[#ffd666]'
                : 'bg-[#2c1414] text-[#ff7a7a]'
          }`} id="voting-window-alert">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <span className="mc-title block text-[#ffffff]">
                  {votingConfig.title}
                </span>
                <p className="text-md text-[#dddddd] mt-1 leading-normal">
                  {isWindowActive 
                    ? "The election voting window is currently ACTIVE! Cast your on-chain ballot below. Enforcing one-vote-per-wallet rule."
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
              <div className="flex justify-between items-center bg-[#2c2c2c] border-4 border-black p-3 shadow-md">
                <div>
                  <h2 className="text-xl font-bold mc-title text-[#ffffff] flex items-center gap-2">
                    <VoteIcon className="w-5 h-5 text-[#5c9e31]" />
                    Election Ballot Box
                  </h2>
                  <p className="text-sm text-[#aaaaaa]">Review candidates and cryptographically sign your ballot.</p>
                </div>
                <span className="mc-pixel-font text-[10px] text-[#ffaa00] bg-[#1a1a1a] border-2 border-black px-2 py-0.5">
                  {candidates.length} candidates
                </span>
              </div>

              {/* Vote Feed Status Alerts */}
              {voteError && (
                <div className="p-4 bg-[#2c1414] border-4 border-[#a52a2a] text-[#ff7a7a] flex items-start gap-3 animate-fade-in" id="tx-error-toast">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="mc-title block text-white mb-0.5">Soroban Error</span>
                    <p className="text-sm">{voteError}</p>
                  </div>
                </div>
              )}

              {voteSuccess && (
                <div className="p-4 bg-[#1b2b16] border-4 border-[#5c9e31] text-[#8ce25d] flex items-start gap-3 animate-fade-in" id="tx-success-toast">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="mc-title block text-white mb-0.5">Transaction Sealed</span>
                    <p className="text-sm">{voteSuccess}</p>
                  </div>
                </div>
              )}

              {/* Candidates Grid */}
              {candidates.length === 0 ? (
                <div className="text-center py-16 mc-gui-panel space-y-3">
                  <p className="text-lg text-zinc-400 font-medium font-sans">No candidates are registered in the ledger state</p>
                  <p className="text-sm text-zinc-500 max-w-xs mx-auto">Use the registration form below to append candidates to the smart contract.</p>
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
                        className={`p-5 mc-gui-panel transition-all flex flex-col justify-between gap-4 relative group ${
                          isWindowActive && !walletVoted ? 'hover:border-[#5c9e31]' : 'opacity-85 hover:opacity-100'
                        }`}
                        id={`candidate-card-${candidate.id}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="mc-pixel-font text-[9px] text-[#ffaa00] px-2 py-0.5 bg-[#151515] border-2 border-black">
                                ID #{candidate.id}
                              </span>
                              <h3 className="font-bold text-white text-xl">{candidate.name}</h3>
                            </div>
                            <div className="text-right leading-none">
                              <span className="text-2xl font-bold font-mono text-[#ffd666]">{candidate.votes}</span>
                              <span className="text-[9px] mc-pixel-font text-zinc-500 block uppercase pt-0.5">votes</span>
                            </div>
                          </div>
                          
                          <p className="text-md text-[#dddddd] leading-relaxed">{candidate.description}</p>
                        </div>

                        {/* Metadata block */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-[#1e1e1e] pt-4 gap-3 text-xs text-zinc-400 font-mono">
                          <span className="truncate max-w-[200px] sm:max-w-xs">
                            Registered by: <span className="text-zinc-350">{truncateAddress(candidate.registeredBy)}</span>
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
                            className="w-full mc-gui-btn uppercase border-2 shadow-none font-bold py-3 mt-1"
                            id={`btn-vote-${candidate.id}`}
                          >
                            {isTxPending ? (
                              'Simulating Soroban VM Signature Auth...'
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
            <div className="mc-dirt-panel p-6 space-y-4" id="candidate-registration-panel">
              <div className="flex items-center gap-2.5 border-b border-[#0f0f0f] pb-3.5">
                <PlusCircle className="w-6 h-6 text-[#5c9e31]" />
                <div>
                  <h3 className="mc-title text-[#ffffff]">Register On-Chain Candidate</h3>
                  <p className="text-sm text-[#aaaaaa]">Append a candidate. Consumes 0.1 XLM in Soroban storage fees.</p>
                </div>
              </div>

              {/* Status messages */}
              {registerError && (
                <div className="p-3 bg-[#2d1414] border-4 border-[#a52a2a] text-[#ff7a7a] text-sm flex gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{registerError}</p>
                </div>
              )}

              {registerSuccess && (
                <div className="p-3 bg-[#1b2b16] border-4 border-[#5c9e31] text-[#8ce25d] text-sm flex gap-2">
                  <Sparkles className="w-5 h-5 shrink-0" />
                  <p>Success! New candidate has been registered in the contract storage instance.</p>
                </div>
              )}

              <form onSubmit={handleRegisterCandidate} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-zinc-300 block mb-1">Candidate / Campaign Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Validator Node Incentive Fund"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    disabled={isRegistering}
                    className="w-full mc-gui-input"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-zinc-300 block mb-1">Proposal Campaign Description</label>
                  <textarea
                    placeholder="e.g. Distribute XLM treasury balances to validators meeting performance guidelines..."
                    rows={3}
                    value={candidateDesc}
                    onChange={(e) => setCandidateDesc(e.target.value)}
                    disabled={isRegistering}
                    className="w-full mc-gui-input resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRegistering || !connectedWallet}
                  className="w-full mc-gui-btn uppercase border-2 shadow-none font-bold py-3 mt-1"
                  id="btn-register-candidate"
                >
                  {isRegistering ? (
                    'Invoking register_candidate()...'
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
      <footer className="border-t-4 border-black bg-[#151515] py-8 mt-12 text-center text-sm text-[#888888]" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-zinc-350">Soroban Voting dApp — Interactive Sandbox & Explorer Client</p>
          <p>Running on Mock Stellar Testnet. In-app RPC updates emulate the Soroban Virtual Machine ledger clock constraints.</p>
          <p className="text-xs text-zinc-550 pt-2 border-t border-[#222222] max-w-md mx-auto">
            This client simulates cryptographic wallet connection signatures, Friendbot faucet injections, and contract gas calculations (RAM/CPU instruction limits).
          </p>
        </div>
      </footer>
    </div>
  );
}
