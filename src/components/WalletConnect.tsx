import React, { useState, useEffect } from 'react';
import { Wallet } from '../types';
import { sorobanSimulator } from '../lib/sorobanSim';
import { requestAccess, getPublicKey, getAddress } from '@stellar/freighter-api';
import { Wallet as WalletIcon, Coins, ShieldCheck, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface WalletConnectProps {
  onWalletConnected?: (wallet: Wallet | null) => void;
}

export default function WalletConnect({ onWalletConnected }: WalletConnectProps) {
  const [connectedWallet, setConnectedWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fundingAddress, setFundingAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const syncState = () => {
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

  const handleConnect = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let pubKey: string | null = null;
      let error: string | null = null;

      // 1. Primary Attempt: Official @stellar/freighter-api requestAccess()
      try {
        const access = await requestAccess();
        if (typeof access === 'string') {
          pubKey = access;
        } else if (access && (access as any).address) {
          pubKey = (access as any).address;
        } else if (access && (access as any).publicKey) {
          pubKey = (access as any).publicKey;
        } else if (access && (access as any).error) {
          error = (access as any).error;
        }
      } catch (e: any) {
        // Fallback to getPublicKey / getAddress methods
        try {
          const key = await getPublicKey();
          if (key) pubKey = key;
        } catch (e2: any) {
          try {
            const addrObj = await getAddress();
            if (addrObj && (addrObj as any).address) pubKey = (addrObj as any).address;
          } catch (e3) {}
        }
      }

      // 2. Direct Window Injection Attempt (for raw Chrome content-script injection)
      if (!pubKey && !error && typeof window !== 'undefined') {
        const windowApi = (window as any).freighterApi || (window as any).stellarWebKit || (window as any).freighter;
        if (windowApi) {
          const reqFn = windowApi.requestAccess 
            ? windowApi.requestAccess.bind(windowApi) 
            : (windowApi.getPublicKey ? windowApi.getPublicKey.bind(windowApi) : null);
          if (reqFn) {
            const res = await reqFn();
            if (typeof res === 'string') pubKey = res;
            else if (res && res.address) pubKey = res.address;
            else if (res && res.publicKey) pubKey = res.publicKey;
            else if (res && res.error) error = res.error;
          }
        }
      }

      if (error) {
        setErrorMsg(error);
        return;
      }

      if (!pubKey) {
        setErrorMsg("Freighter extension was detected, but failed to retrieve public key. Please click the purple Freighter key icon in your browser toolbar to unlock your wallet, then click Connect Wallet again!");
        return;
      }

      // Pass public key to soroban simulator state & stellar horizon
      await sorobanSimulator.connectWallet('freighter', pubKey);
      setSuccessMsg('Successfully connected to your real Freighter Wallet!');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect real wallet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    sorobanSimulator.disconnectWallet();
    setSuccessMsg('Wallet disconnected.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleFriendbot = async (address: string) => {
    setFundingAddress(address);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await sorobanSimulator.fundWallet(address);
      setSuccessMsg('Friendbot successfully deposited 10,000 test XLM into your wallet!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg('Friendbot rate limit exceeded or connection failed. Try again shortly.');
    } finally {
      setFundingAddress(null);
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-4 bg-[#2c1414] border-4 border-[#a52a2a] text-[#ff7a7a] flex items-start gap-3 animate-fade-in" id="wallet-error">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="mc-title block text-white mb-0.5">Wallet Connection Alert</span>
            <p className="text-sm">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="mc-gui-btn mc-gui-btn-red py-1 px-2.5 text-xs">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-[#1b2b16] border-4 border-[#5c9e31] text-[#8ce25d] flex items-start gap-3 animate-fade-in" id="wallet-success">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{successMsg}</p>
          </div>
        </div>
      )}

      {!connectedWallet ? (
        <div className="p-6 mc-gui-panel flex flex-col md:flex-row items-center justify-between gap-6" id="wallet-disconnected-banner">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-3 bg-black border-4 border-black text-[#5c9e31]">
              <WalletIcon className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="mc-title text-[#ffffff]">Stellar Freighter Wallet</h3>
              <p className="text-sm text-[#aaaaaa] mt-0.5">Connect your real Stellar wallet to cast votes and sign transactions on Soroban.</p>
              <a
                href="https://www.freighter.app/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#2bf3ff] hover:underline mt-1 font-mono"
              >
                <span>Get Freighter Extension</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full md:w-auto mc-gui-btn uppercase border-2 shadow-none font-bold py-3.5 px-8 text-sm"
            id="btn-open-wallet-modal"
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      ) : (
        <div className="p-6 mc-gui-panel space-y-4" id="wallet-connected-panel">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-black border-2 border-black text-[#5c9e31]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="mc-pixel-font text-[9px] text-[#ffaa00] px-2 py-0.5 bg-[#151515] border-2 border-black uppercase">
                    Freighter Wallet
                  </span>
                  <span className="text-xs text-zinc-400 font-mono select-all">
                    ({truncateAddress(connectedWallet.address)})
                  </span>
                </div>
                <h4 className="font-mono text-zinc-100 font-semibold tracking-tight text-sm sm:text-base mt-1 break-all select-all">
                  {connectedWallet.address}
                </h4>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="mc-gui-btn mc-gui-btn-red py-2 px-4 uppercase text-[#ffffff] font-bold border-2 text-xs"
              id="btn-disconnect-wallet"
            >
              Disconnect
            </button>
          </div>

          <div className="p-4 bg-black border-4 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#2d2105] text-[#ffaa00] border-2 border-black">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Stellar Testnet XLM Balance</p>
                <p className="text-2xl font-mono font-bold text-[#ffd666] leading-none mt-1">
                  {connectedWallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} <span className="text-xs font-sans text-zinc-400">XLM</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => handleFriendbot(connectedWallet.address)}
              disabled={fundingAddress === connectedWallet.address}
              className="w-full sm:w-auto mc-gui-btn py-2 px-4 uppercase border-2 shadow-none font-bold text-xs"
              id="btn-friendbot-fund"
            >
              {fundingAddress === connectedWallet.address ? 'Funding XLM...' : 'Get Test XLM'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}