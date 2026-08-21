import React, { useState, useEffect } from 'react';
import { Wallet } from '../types';
import { sorobanSimulator, generateStellarAddress } from '../lib/sorobanSim';
import { Wallet as WalletIcon, Coins, LogOut, ArrowRight, ShieldCheck, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

interface WalletConnectProps {
  onWalletConnected?: (wallet: Wallet | null) => void;
}

export default function WalletConnect({ onWalletConnected }: WalletConnectProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<Wallet | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fundingAddress, setFundingAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [newWalletName, setNewWalletName] = useState('');

  // Update component state from blockchain state
  const syncState = () => {
    setWallets(sorobanSimulator.getWallets());
    const connected = sorobanSimulator.getConnectedWallet();
    setConnectedWallet(connected);
    if (onWalletConnected) {
      onWalletConnected(connected);
    }
  };

  useEffect(() => {
    syncState();
    const unsubscribe = sorobanSimulator.subscribe(syncState);
    return () => unsubscribe();
  }, []);

  const handleConnect = async (type: Wallet['type'], address?: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // For extensions, simulate errors to make it fully educational if extension is missing!
      if (type === 'freighter' && !(window as any).freighterApi && Math.random() < 0.2) {
        throw new Error("Freighter Extension not found. Ensure the Freighter chrome extension is installed and unlocked.");
      }
      if (type === 'albedo' && Math.random() < 0.25) {
        throw new Error("Albedo request rejected: User dismissed the login popup.");
      }

      await sorobanSimulator.connectWallet(type, address);
      setIsModalOpen(false);
      setSuccessMsg(`Successfully connected via ${type.toUpperCase()}!`);
      setTimeout(() => setSuccessMsg(null), 3050);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect wallet.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectClick = async () => {
    if (typeof window !== 'undefined' && (window as any).freighterApi) {
      await handleConnect('freighter');
    } else {
      setIsModalOpen(true);
    }
  };

  const handleDisconnect = () => {
    sorobanSimulator.disconnectWallet();
    setSuccessMsg("Wallet disconnected.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleFriendbot = async (address: string) => {
    setFundingAddress(address);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await sorobanSimulator.fundWallet(address);
      setSuccessMsg("Friendbot successfully deposited 10,000 test XLM into your wallet!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("Friendbot rate limit exceeded or connection failed. Try again shortly.");
    } finally {
      setFundingAddress(null);
    }
  };

  const handleCreateSimWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;
    try {
      const nw = sorobanSimulator.createNewSimulatedWallet(newWalletName);
      setNewWalletName('');
      // Automatically connect this newly created simulated wallet
      sorobanSimulator.connectWallet('simulated', nw.address);
      setSuccessMsg(`Simulated wallet '${newWalletName}' created and connected!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("Failed to create wallet");
    }
  };

  const selectSimulatedIdentity = (index: number) => {
    sorobanSimulator.switchSimulatedWallet(index);
    setSuccessMsg("Switched simulated wallet identity.");
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  const simulatedWalletsList = wallets.filter(w => w.type === 'simulated');

  return (
    <div className="space-y-4">
      {/* Messages */}
      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-800 text-red-200 rounded-xl flex items-start gap-3 text-sm animate-fade-in" id="wallet-error">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Wallet Connection Alert</span>
            <p>{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-100 text-xs font-semibold px-2 py-0.5 bg-red-900/30 rounded">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800 text-emerald-200 rounded-xl flex items-start gap-3 text-sm animate-fade-in" id="wallet-success">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{successMsg}</p>
          </div>
        </div>
      )}

      {/* Primary Wallet Status Card */}
      {!connectedWallet ? (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6" id="wallet-disconnected-banner">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-3 bg-indigo-950/60 border border-indigo-800/50 rounded-xl text-indigo-400">
              <WalletIcon className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-zinc-100">Stellar Wallet Disconnected</h3>
              <p className="text-sm text-zinc-400">Connect your Stellar wallet to interact with the Soroban voting smart contract.</p>
            </div>
          </div>
          <button
            onClick={handleConnectClick}
            className="w-full md:w-auto px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-xl font-medium transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-indigo-500/10"
            id="btn-open-wallet-modal"
          >
            Connect Wallet
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4" id="wallet-connected-panel">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold uppercase tracking-wider text-emerald-400 text-xs px-2 py-0.5 bg-emerald-950 border border-emerald-800 rounded-full">
                    {connectedWallet.type}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono select-all">
                    {truncateAddress(connectedWallet.address)}
                  </span>
                </div>
                <h4 className="font-mono text-zinc-100 font-semibold tracking-tight text-sm sm:text-base mt-0.5 break-all select-all">
                  {connectedWallet.address}
                </h4>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-zinc-700 cursor-pointer"
              id="btn-disconnect-wallet"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Balance Card */}
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-950 text-amber-400 rounded-lg border border-amber-900">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium">Stellar Testnet Balance</p>
                  <p className="text-lg font-mono font-bold text-zinc-100">
                    {connectedWallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} <span className="text-xs font-sans text-zinc-400">XLM</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleFriendbot(connectedWallet.address)}
                disabled={fundingAddress === connectedWallet.address}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-zinc-950 font-semibold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                id="btn-friendbot-fund"
              >
                {fundingAddress === connectedWallet.address ? 'Friendbot is funding...' : 'Get Test XLM'}
              </button>
            </div>

            {/* Wallet Quick Switcher for Simulated Mode */}
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
              <h5 className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Multi-Wallet Simulation Sandbox</h5>
              <div className="flex flex-wrap gap-2">
                {simulatedWalletsList.map((w, index) => {
                  const isMainConnected = connectedWallet.address === w.address;
                  return (
                    <button
                      key={w.address}
                      onClick={() => selectSimulatedIdentity(index)}
                      className={`px-3 py-1 text-xs rounded-md font-mono transition-all border ${
                        isMainConnected
                          ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-bold'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {w.address.includes('ADMIN') ? 'Admin_Key' : w.address.includes('ALICE') ? 'Alice_Key' : w.address.includes('BOBBB') ? 'Bob_Key' : `Wallet_${index + 1}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="wallet-selector-modal">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <WalletIcon className="w-5 h-5 text-indigo-400" />
                  Connect Stellar Wallet
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Select your preferred transaction signer gateway.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 rounded-lg text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Simulated Sandbox Wallet */}
              <button
                onClick={() => handleConnect('simulated')}
                className="w-full p-4 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-indigo-800/80 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-zinc-200 block text-sm flex items-center gap-2">
                    Simulated Sandbox Vault (Recommended)
                    <span className="px-1.5 py-0.5 bg-indigo-950 border border-indigo-800 text-[10px] text-indigo-400 rounded-full uppercase font-mono">
                      local sandbox
                    </span>
                  </span>
                  <p className="text-xs text-zinc-400 mt-0.5">Instant multi-wallet generation & Friendbot faucet testbed.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Freighter */}
              <button
                onClick={() => handleConnect('freighter')}
                className="w-full p-4 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-800/80 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-zinc-200 block text-sm flex items-center gap-2">
                    Freighter Wallet
                    <span className="px-1.5 py-0.5 bg-amber-950/50 border border-amber-900/60 text-[10px] text-amber-500 rounded-full uppercase font-mono">
                      SDF Official
                    </span>
                  </span>
                  <p className="text-xs text-zinc-400 mt-0.5">Sign secure Soroban smart contract transactions on-chain.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Albedo */}
              <button
                onClick={() => handleConnect('albedo')}
                className="w-full p-4 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-sky-800/80 rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-zinc-200 block text-sm flex items-center gap-2">
                    Albedo Link signer
                    <span className="px-1.5 py-0.5 bg-sky-950/50 border border-sky-900/60 text-[10px] text-sky-400 rounded-full uppercase font-mono">
                      web portal
                    </span>
                  </span>
                  <p className="text-xs text-zinc-400 mt-0.5">Web-based secure delegated key signing authorization.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
              </button>

              {/* xBull */}
              <button
                onClick={() => handleConnect('xbull')}
                className="w-full p-4 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-800/80  rounded-xl text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-zinc-200 block text-sm">xBull Credentials Vault</span>
                  <p className="text-xs text-zinc-400 mt-0.5">Advanced developer-friendly wallet and asset controller.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
              </button>
            </div>

            {/* Create custom Simulated Wallet */}
            <div className="mt-6 pt-4 border-t border-zinc-800">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Create New Simulated Keypair</h4>
              <form onSubmit={handleCreateSimWallet} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Charlie"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-zinc-100 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Generate
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
