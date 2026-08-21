import React, { useState, useEffect } from 'react';
import { VotingConfig, Wallet } from '../types';
import { sorobanSimulator } from '../lib/sorobanSim';
import { Clock, Hourglass, Settings, AlertTriangle, ArrowRight, Play, RefreshCw } from 'lucide-react';

interface TimeControllerProps {
  connectedWallet: Wallet | null;
}

export default function TimeController({ connectedWallet }: TimeControllerProps) {
  const [config, setConfig] = useState<VotingConfig | null>(null);
  const [simulatedTime, setSimulatedTime] = useState<number>(Date.now());
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form values
  const [title, setTitle] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const syncState = () => {
    const cfg = sorobanSimulator.getConfig();
    setConfig(cfg);
    setTitle(cfg.title);
    
    // Format timestamp to local datetime-local string
    const formatToInputDate = (ms: number) => {
      const d = new Date(ms);
      // offset for timezone to match format expected by datetime-local input
      const tzOffset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setStartTimeStr(formatToInputDate(cfg.startTime));
    setEndTimeStr(formatToInputDate(cfg.endTime));
    setSimulatedTime(sorobanSimulator.getSimulatedTime());
    setTimeOffset(sorobanSimulator.getTimeWarpOffset());
  };

  useEffect(() => {
    syncState();
    const unsubscribe = sorobanSimulator.subscribe(syncState);
    
    // Keep internal simulated clock ticking second-by-second in local UI
    const timer = setInterval(() => {
      setSimulatedTime(sorobanSimulator.getSimulatedTime());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const handleWarp = (hours: number) => {
    const msOffset = hours * 60 * 60 * 1000;
    const nextOffset = timeOffset + msOffset;
    sorobanSimulator.setTimeWarpOffset(nextOffset);
    setTimeOffset(nextOffset);
    setSuccessMsg(`Simulated ledger time advanced by ${hours} ${hours === 1 ? 'hour' : 'hours'}.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleResetWarp = () => {
    sorobanSimulator.setTimeWarpOffset(0);
    setTimeOffset(0);
    setSuccessMsg("Simulated ledger time synchronized back to real-world UTC time.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!connectedWallet) {
      setErrorMsg("Please connect your wallet first.");
      return;
    }

    if (connectedWallet.address !== config?.admin) {
      setErrorMsg("Unauthorized: Only the contract administrator can adjust voting windows.");
      return;
    }

    try {
      setIsUpdating(true);
      const startMs = new Date(startTimeStr).getTime();
      const endMs = new Date(endTimeStr).getTime();

      if (startMs >= endMs) {
        throw new Error("Voting window start timestamp must precede the end timestamp.");
      }

      await sorobanSimulator.updateVotingConfig(title, startMs, endMs);
      setSuccessMsg("On-chain config transaction accepted! Soroban state updated.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update config");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!config) return null;

  const isActive = simulatedTime >= config.startTime && simulatedTime <= config.endTime;
  const isPending = simulatedTime < config.startTime;
  const isEnded = simulatedTime > config.endTime;

  const formatDelta = (ms: number) => {
    const secs = Math.floor(Math.abs(ms) / 1000);
    const mins = Math.floor(secs / 60);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (days > 0) return `${days}d ${hrs % 24}h`;
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${secs % 60}s`;
    return `${secs}s`;
  };

  const timeRemainingLabel = isPending 
    ? `Opens in ${formatDelta(config.startTime - simulatedTime)}` 
    : isActive 
      ? `Closes in ${formatDelta(config.endTime - simulatedTime)}` 
      : "Voting Window Closed";

  const isAdmin = connectedWallet?.address === config.admin;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6" id="time-window-controller">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-800/60 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 tracking-tight">On-Chain Time bounds</h3>
            <p className="text-xs text-zinc-400">Temporal smart-contract boundaries governing valid ledger ballots.</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-xs font-semibold tracking-wide ${
            isActive 
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400' 
              : isPending 
                ? 'bg-amber-950/60 border-amber-900 text-amber-400' 
                : 'bg-red-950/60 border-red-900 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isActive ? 'bg-emerald-400 animate-pulse' : isPending ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
            }`} />
            {isActive ? 'Voting Active' : isPending ? 'Upcoming' : 'Ended'}
          </span>
        </div>
      </div>

      {/* Clock Readout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-1 relative overflow-hidden">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Simulated Ledger Clock (UTC)</span>
          <p className="text-lg font-mono font-bold text-zinc-200">
            {new Date(simulatedTime).toLocaleTimeString()}
          </p>
          <span className="text-xs text-zinc-400 block font-mono">
            {new Date(simulatedTime).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
          {timeOffset !== 0 && (
            <span className="absolute bottom-2 right-3 text-[9px] font-mono font-bold bg-amber-950 border border-amber-900 text-amber-500 px-1.5 py-0.5 rounded">
              Warp: {timeOffset > 0 ? '+' : ''}{Math.round(timeOffset / 1000 / 60)}m
            </span>
          )}
        </div>

        <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-1 flex flex-col justify-center">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <Hourglass className="w-3.5 h-3.5 text-indigo-400" />
            Temporal Window status
          </span>
          <p className="text-sm font-bold text-zinc-200 mt-1">{timeRemainingLabel}</p>
          <div className="text-[10px] text-zinc-500 flex gap-2 font-mono">
            <span>Starts: {new Date(config.startTime).toLocaleTimeString()}</span>
            <span>Ends: {new Date(config.endTime).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Time Warp Controller Buttons */}
      <div className="p-4 bg-zinc-950/50 border border-zinc-850 rounded-xl space-y-3">
        <div>
          <h4 className="text-xs font-bold text-zinc-300">Fast-Forward Simulated Ledger Time</h4>
          <p className="text-[11px] text-zinc-400">Simulate validator clocks shifting forward to test boundaries and trigger state panics.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleWarp(0.25)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            +15 Mins
          </button>
          <button
            onClick={() => handleWarp(1)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            +1 Hour
          </button>
          <button
            onClick={() => handleWarp(3)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            +3 Hours
          </button>
          <button
            onClick={() => handleWarp(24)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            +24 Hours
          </button>
          {timeOffset !== 0 && (
            <button
              onClick={handleResetWarp}
              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-500/30 border border-amber-900/60 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Sync
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 bg-red-950/30 border border-red-800 text-red-200 rounded-xl text-xs flex gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800 text-emerald-200 rounded-xl text-xs">
          <p>{successMsg}</p>
        </div>
      )}

      {/* Admin settings form */}
      <div className="p-4 bg-zinc-950/20 border border-zinc-850 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-indigo-400" />
            Contract Parameter Adjustment (Admin Only)
          </h4>
          {!isAdmin && (
            <span className="text-[9px] text-zinc-500 font-mono italic">
              View Only
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-zinc-500 block mb-1">On-Chain Voting Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isAdmin}
              placeholder="E.g. SDF Election"
              className="w-full p-2 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-zinc-100 font-semibold focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-500 block mb-1">Opens (StartTime)</label>
              <input
                type="datetime-local"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                disabled={!isAdmin}
                className="w-full p-2 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-zinc-100 font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 block mb-1">Closes (EndTime)</label>
              <input
                type="datetime-local"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                disabled={!isAdmin}
                className="w-full p-2 bg-zinc-950 border border-zinc-850 rounded-lg text-xs text-zinc-100 font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

          {isAdmin && (
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-zinc-100 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              id="btn-update-config"
            >
              {isUpdating ? 'Broadcasting...' : 'Update Config on-chain'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>

    </div>
  );
}
