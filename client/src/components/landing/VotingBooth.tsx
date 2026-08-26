"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Vote,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  UserPlus,
  Award,
  Wallet,
} from "lucide-react";
import {
  sorobanClient,
  DEFAULT_CONTRACT_ID,
  DEFAULT_CANDIDATES,
} from "@/lib/sorobanClient";
import { useWallet } from "@/context/WalletContext";

export default function VotingBooth() {
  const { address, openWalletModal } = useWallet();
  const [candidates, setCandidates] = useState(DEFAULT_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [votedCandidate, setVotedCandidate] = useState<string | null>(null);
  const [votingState, setVotingState] = useState<{
    loading: boolean;
    txHash?: string;
    error?: string;
  }>({ loading: false });

  // Candidate Registration state
  const [newCandidateName, setNewCandidateName] = useState("");
  const [newCandidateParty, setNewCandidateParty] = useState("");
  const [registering, setRegistering] = useState(false);
  const [regTxHash, setRegTxHash] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial candidate list or vote counts from Soroban client
    sorobanClient
      .getCandidates(DEFAULT_CONTRACT_ID)
      .then((list) => {
        if (list && list.length > 0) {
          const updated = list.map((name, i) => ({
            id: `cand-${i}`,
            name,
            party:
              i === 0
                ? "Progressive Web3"
                : i === 1
                ? "Stellar Builders"
                : "Cypherpunk Collective",
            votes: 100 + i * 50,
          }));
          setCandidates(updated);
        }
      })
      .catch(() => {});
  }, []);

  const totalVotes = candidates.reduce((acc, curr) => acc + curr.votes, 0);

  const handleVote = async (candidateName: string) => {
    if (!address) {
      openWalletModal();
      return;
    }

    setSelectedCandidate(candidateName);
    setVotingState({ loading: true });

    try {
      // Execute vote on Soroban smart contract using @stellar/stellar-sdk & freighter-api
      const res = await sorobanClient.vote(
        DEFAULT_CONTRACT_ID,
        address,
        candidateName
      );

      // Update candidate state in UI
      setCandidates((prev) =>
        prev.map((c) =>
          c.name === candidateName ? { ...c, votes: c.votes + 1 } : c
        )
      );

      setVotedCandidate(candidateName);
      setVotingState({
        loading: false,
        txHash: res.txHash,
      });
    } catch (err: any) {
      console.error("Vote failed:", err);
      setVotingState({
        loading: false,
        error:
          err?.message || "Failed to submit vote transaction to Stellar Testnet.",
      });
    }
  };

  const handleRegisterCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateName.trim()) return;

    if (!address) {
      openWalletModal();
      return;
    }

    setRegistering(true);
    setRegTxHash(null);

    try {
      const res = await sorobanClient.registerCandidate(
        DEFAULT_CONTRACT_ID,
        address,
        newCandidateName.trim()
      );

      const newCand = {
        id: `cand-${Date.now()}`,
        name: newCandidateName.trim(),
        party: newCandidateParty.trim() || "Independent",
        votes: 1,
      };

      setCandidates((prev) => [...prev, newCand]);
      setRegTxHash(res.txHash);
      setNewCandidateName("");
      setNewCandidateParty("");
    } catch (err: any) {
      console.error("Register candidate error:", err);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-24 py-12">
      {/* ----------------------------------------------------------------- */}
      {/* VOTING BOOTH SECTION */}
      {/* ----------------------------------------------------------------- */}
      <section id="voting-booth" className="scroll-mt-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-xs font-semibold uppercase tracking-wider mb-4">
            <Vote className="w-3.5 h-3.5" />
            <span>Official Election Ballot</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Cast Your Vote On-Chain
          </h2>
          <p className="text-text-secondary text-base sm:text-lg">
            Select your candidate below to execute an authenticated Soroban transaction on the Stellar Testnet. Your vote is immutably recorded.
          </p>

          {/* Wallet connection banner inside Voting Booth if disconnected */}
          {!address && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-2xl bg-cyan/10 border border-cyan/30 text-cyan text-sm flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl mx-auto"
            >
              <div className="flex items-center gap-2 text-left">
                <Wallet className="w-5 h-5 shrink-0" />
                <span>Connect your wallet to participate in live voting.</span>
              </div>
              <button
                onClick={openWalletModal}
                className="px-4 py-2 rounded-xl bg-cyan text-background text-xs font-bold hover:opacity-90 transition-all shrink-0 shadow-md"
              >
                Connect Wallet Now
              </button>
            </motion.div>
          )}
        </div>

        {/* Voting Outcome Alert Modal / Card */}
        <AnimatePresence>
          {votingState.txHash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 p-6 rounded-2xl bg-accent-green/10 border border-accent-green/30 text-foreground shadow-lg backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-accent-green shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-lg text-accent-green">
                    Vote Successfully Confirmed!
                  </h4>
                  <p className="text-sm text-text-secondary mt-1">
                    Your vote for{" "}
                    <span className="font-semibold text-foreground">
                      {votedCandidate}
                    </span>{" "}
                    was signed and recorded on Stellar Testnet.
                  </p>
                  <div className="mt-2 text-xs font-mono text-text-muted break-all">
                    Tx Hash: {votingState.txHash}
                  </div>
                </div>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${votingState.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-accent-green text-background text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>View on Stellar Expert</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          )}

          {votingState.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-4 rounded-2xl bg-accent-red/10 border border-accent-red/30 text-accent-red text-sm flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{votingState.error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Candidate Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {candidates.map((cand, idx) => {
            const votePercent =
              totalVotes > 0
                ? Math.round((cand.votes / totalVotes) * 100)
                : 0;
            const isLeading = candidates.every((c) => c.votes <= cand.votes);

            return (
              <motion.div
                key={cand.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className={`glass rounded-2xl p-6 border relative flex flex-col justify-between overflow-hidden shadow-xl ${
                  isLeading ? "border-cyan/40 glow-border" : "border-border"
                }`}
              >
                {isLeading && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-cyan/20 border border-cyan/30 text-cyan text-[10px] font-bold font-mono uppercase flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>Leading</span>
                  </div>
                )}

                <div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan/20 to-purple/20 border border-cyan/20 flex items-center justify-center text-xl font-bold text-cyan mb-4">
                    {cand.name.charAt(0)}
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {cand.name}
                  </h3>
                  <p className="text-xs text-text-muted font-medium mb-6">
                    {cand.party}
                  </p>

                  {/* Vote count & progress */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-text-secondary font-medium">
                        Votes Cast
                      </span>
                      <span className="font-bold text-foreground">
                        {cand.votes.toLocaleString()} ({votePercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-surface border border-border overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${votePercent}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        className="h-full bg-gradient-to-r from-cyan to-purple"
                      />
                    </div>
                  </div>
                </div>

                {/* Vote Action Button */}
                <button
                  onClick={() => handleVote(cand.name)}
                  disabled={
                    votingState.loading && selectedCandidate === cand.name
                  }
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                    votedCandidate === cand.name
                      ? "bg-accent-green/20 border border-accent-green/40 text-accent-green"
                      : "bg-cyan text-background hover:opacity-90 glow-cyan"
                  }`}
                >
                  {votingState.loading && selectedCandidate === cand.name ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing & Voting...</span>
                    </>
                  ) : votedCandidate === cand.name ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Voted On-Chain</span>
                    </>
                  ) : (
                    <>
                      <Vote className="w-4 h-4" />
                      <span>Vote for {cand.name.split(" ")[0]}</span>
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* REGISTER CANDIDATE SECTION */}
      {/* ----------------------------------------------------------------- */}
      <section
        id="register-candidate"
        className="scroll-mt-24 max-w-4xl mx-auto px-4 sm:px-6"
      >
        <div className="glass rounded-3xl p-8 sm:p-12 border border-purple/30 glow-purple relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple/10 rounded-full blur-[80px]" />

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple/10 border border-purple/20 text-purple text-xs font-semibold uppercase tracking-wider mb-4">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Soroban Admin Function</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold mb-3">
              Register New Candidate
            </h3>
            <p className="text-text-secondary text-sm sm:text-base mb-8">
              Execute the{" "}
              <code className="bg-surface px-2 py-0.5 rounded text-cyan font-mono">
                add_candidate
              </code>{" "}
              /{" "}
              <code className="bg-surface px-2 py-0.5 rounded text-cyan font-mono">
                register_candidate
              </code>{" "}
              function on the smart contract to add candidates to the live
              ballot.
            </p>

            <form onSubmit={handleRegisterCandidate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-2">
                    Candidate Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCandidateName}
                    onChange={(e) => setNewCandidateName(e.target.value)}
                    placeholder="e.g. David Vance"
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-purple/50 transition-colors placeholder:text-text-muted"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-text-secondary mb-2">
                    Affiliation / Party (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCandidateParty}
                    onChange={(e) => setNewCandidateParty(e.target.value)}
                    placeholder="e.g. Stellar Innovators"
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-sm font-medium text-foreground outline-none focus:border-purple/50 transition-colors placeholder:text-text-muted"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={registering || !newCandidateName.trim()}
                className="px-6 py-3.5 rounded-xl bg-purple text-foreground font-bold text-sm hover:opacity-90 transition-all glow-purple flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {registering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting to Soroban...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register Candidate On-Chain</span>
                  </>
                )}
              </button>
            </form>

            {regTxHash && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-xl bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-mono break-all flex items-center justify-between gap-2"
              >
                <span>Registered! Tx Hash: {regTxHash}</span>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${regTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan hover:underline shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
