import { useState, useEffect } from 'react';
import { Transaction, SorobanEvent, Ledger } from '../types';
import { sorobanSimulator } from '../lib/sorobanSim';
import { Database, Search, ArrowUpRight, Activity, Terminal, Clock, ShieldCheck, ChevronRight, Layers } from 'lucide-react';

export default function LedgerExplorer() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'events' | 'ledgers'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [events, setEvents] = useState<SorobanEvent[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const syncState = () => {
    setTransactions(sorobanSimulator.getTransactions());
    setEvents(sorobanSimulator.getEvents());
    setLedgers(sorobanSimulator.getLedgers());
  };

  useEffect(() => {
    syncState();
    const unsubscribe = sorobanSimulator.subscribe(syncState);
    return () => unsubscribe();
  }, []);

  const formatTime = (timestamp: number) => {
    const elapsed = Date.now() - timestamp;
    if (elapsed < 5000) return "Just now";
    if (elapsed < 60000) return `${Math.floor(elapsed / 1000)}s ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  const truncate = (str: string, len: number = 8) => {
    if (!str) return '';
    return `${str.slice(0, len)}...${str.slice(-len)}`;
  };

  const getEventDescription = (evt: SorobanEvent) => {
    try {
      const topicType = evt.topics[0];
      const caller = truncate(evt.topics[1] || '', 6);
      
      if (topicType === 'vote_cast') {
        const candidateId = evt.topics[2];
        return `Wallet ${caller} cast vote for candidate #${candidateId}`;
      }
      if (topicType === 'register_candidate') {
        const cId = evt.topics[2];
        const details = JSON.parse(evt.data);
        return `New Candidate registered (ID: #${cId}): "${details.name}" by admin`;
      }
      if (topicType === 'init') {
        return `Contract initialized with Admin keys by ${caller}`;
      }
      if (topicType === 'config_updated') {
        return `Voting window parameters updated by admin ${caller}`;
      }
      return `${topicType} event emitted`;
    } catch {
      return "Contract event emitted";
    }
  };

  return (
    <div className="mc-gui-panel overflow-hidden" id="stellar-ledger-explorer">
      {/* Header */}
      <div className="p-6 bg-[#252525] border-b-4 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black border-2 border-black text-[#5c9e31]">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="mc-title text-[#ffffff] flex items-center gap-2 mb-1">
              Stellar Testnet Explorer
              <span className="mc-pixel-font text-[8px] bg-black border-2 border-[#5c9e31] text-[#8ce25d] px-2 py-0.5 uppercase ml-1">
                live
              </span>
            </h3>
            <p className="text-sm text-[#aaaaaa]">Inspect real-time blocks, transactions, gas fees, and contract events.</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-black border-2 border-black p-1 self-start sm:self-auto gap-0.5">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`mc-pixel-font text-[8px] px-2.5 py-1.5 transition-all cursor-pointer ${
              activeTab === 'transactions' ? 'bg-[#5c9e31] text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`mc-pixel-font text-[8px] px-2.5 py-1.5 transition-all cursor-pointer ${
              activeTab === 'events' ? 'bg-[#5c9e31] text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveTab('ledgers')}
            className={`mc-pixel-font text-[8px] px-2.5 py-1.5 transition-all cursor-pointer ${
              activeTab === 'ledgers' ? 'bg-[#5c9e31] text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ledgers
          </button>
        </div>
      </div>

      {/* Explorer Content Window */}
      <div className="p-4 bg-black/35">
        
        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div className="space-y-3" id="explorer-transactions-tab">
            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-black border-4 border-black text-zinc-500">
                <Terminal className="w-8 h-8 mx-auto text-zinc-700 mb-3" />
                <p className="text-sm font-medium">No transactions on ledger yet</p>
                <p className="text-xs text-zinc-600 max-w-xs mx-auto mt-1">Cast a vote or register a candidate to trigger a Soroban contract transaction.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead>
                    <tr className="border-b-4 border-black text-[#ffaa00] uppercase tracking-wider mc-pixel-font text-[8px]">
                      <th className="pb-3 pl-2">Hash</th>
                      <th className="pb-3">Source</th>
                      <th className="pb-3">Invocations</th>
                      <th className="pb-3 text-right">Fee (XLM)</th>
                      <th className="pb-3 text-right">Age</th>
                      <th className="pb-3 text-center">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/45">
                    {transactions.map((tx) => (
                      <tr key={tx.hash} className="hover:bg-[#1a1a1a]/40 group transition-colors">
                        <td className="py-3 pl-2 font-mono text-zinc-400">
                          <span className="text-[#2bf3ff] font-semibold">{tx.hash.slice(0, 8)}</span>
                          {tx.hash.slice(8, 14)}
                        </td>
                        <td className="py-3 font-mono text-zinc-500 text-[11px]">
                          {truncate(tx.source)}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] mc-pixel-font uppercase border ${
                            tx.operation === 'vote' ? 'bg-black border-[#2bf3ff] text-[#2bf3ff]' :
                            tx.operation === 'register_candidate' ? 'bg-black border-[#5c9e31] text-[#8ce25d]' :
                            tx.operation === 'friendbot_fund' ? 'bg-black border-[#ffaa00] text-[#ffd666]' :
                            'bg-black border-zinc-700 text-zinc-405'
                          }`}>
                            {tx.operation}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-zinc-400">
                          {tx.feePaid > 0 ? `${tx.feePaid} XLM` : '0.00 (Mock)'}
                        </td>
                        <td className="py-3 text-right font-mono text-zinc-500">
                          {formatTime(tx.timestamp)}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="mc-gui-btn border-2 py-1 px-2.5 text-[9px] uppercase font-bold"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div className="space-y-3" id="explorer-events-tab">
            {events.length === 0 ? (
              <div className="text-center py-12 bg-black border-4 border-black text-zinc-500">
                <Terminal className="w-8 h-8 mx-auto text-zinc-750 mb-3 animate-pulse" />
                <p className="text-sm font-medium">No smart contract events logged</p>
                <p className="text-xs text-zinc-600 mt-1">Soroban events appear in real-time when the contract state transitions.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {events.map((evt) => (
                  <div key={evt.id} className="p-3 bg-[#121212] border-2 border-black flex items-start justify-between gap-4 hover:border-zinc-800 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[8px] mc-pixel-font uppercase bg-black border border-[#2bf3ff] text-[#2bf3ff] px-1.5 py-0.5 rounded font-bold">
                          {evt.topics[0]}
                        </span>
                        <span className="text-xs font-mono text-[#aaaaaa]">
                          topics: [{evt.topics.map(t => `"${truncate(t, 4)}"`).join(', ')}]
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 font-semibold">{getEventDescription(evt)}</p>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 shrink-0 mt-0.5">
                      <Clock className="w-3 h-3 text-[#ffaa00]" />
                      {formatTime(evt.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEDGERS TAB */}
        {activeTab === 'ledgers' && (
          <div className="space-y-2.5 font-mono" id="explorer-ledgers-tab">
            {ledgers.map((ledger) => (
              <div key={ledger.sequence} className="p-3.5 bg-[#121212] border-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:border-zinc-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-black text-[#5c9e31] border border-black">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200">Ledger Block #{ledger.sequence}</span>
                    <p className="text-[10px] text-zinc-500 truncate max-w-[200px] sm:max-w-xs mt-0.5 font-mono">Hash: {ledger.hash}</p>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto text-zinc-500 gap-1 border-t sm:border-t-0 border-[#1a1a1a] pt-2 sm:pt-0">
                  <span className="text-[8px] mc-pixel-font text-[#2bf3ff] bg-black border border-[#2bf3ff] px-2 py-0.5 shrink-0 uppercase">
                    {ledger.transactionsCount} txs Sealed
                  </span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">{new Date(ledger.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="tx-details-modal">
          <div className="mc-gui-panel w-full max-w-2xl p-6 relative shadow-2xl animate-scale-up font-mono text-xs text-[#e0e0e0]">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b-4 border-black pb-4 mb-5">
              <div>
                <span className="mc-pixel-font text-[8px] bg-black border-2 border-[#5c9e31] text-[#8ce25d] px-2 py-0.5 uppercase">
                  Tx Receipt
                </span>
                <h3 className="mc-title text-[#ffffff] mt-2.5 truncate max-w-sm sm:max-w-md">
                  {selectedTx.hash}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="mc-gui-btn mc-gui-btn-red border-2 px-2.5 py-1 text-xs"
              >
                ✕
              </button>
            </div>

            {/* Details Grid */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b-4 border-black pb-4">
                <div>
                  <span className="text-zinc-550 block mb-1">Ledger Sequence</span>
                  <span className="text-zinc-200 font-semibold">{selectedTx.ledger}</span>
                </div>
                <div>
                  <span className="text-zinc-550 block mb-1">Sealed Timestamp</span>
                  <span className="text-zinc-200">{new Date(selectedTx.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-zinc-550 block mb-1">Status</span>
                  <span className="text-[8px] mc-pixel-font bg-black border border-[#5c9e31] text-[#8ce25d] px-1.5 py-0.5 uppercase">
                    {selectedTx.status}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-550 block mb-1">Gas / Soroban CPU Fee</span>
                  <span className="text-zinc-200">{selectedTx.feePaid > 0 ? `${selectedTx.feePaid} XLM` : '0.00 XLM'}</span>
                </div>
              </div>

              {/* Soroban VM Details */}
              <div className="p-3.5 bg-black border-4 border-black space-y-2">
                <h4 className="text-[9px] mc-pixel-font text-[#ffaa00] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-[#ffaa00]" />
                  Soroban VM Resource Cost
                </h4>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-zinc-500 block">CPU Instructions</span>
                    <span className="text-zinc-300 font-semibold font-mono">{(selectedTx.cpuInstructions).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-550 block">RAM Allocations</span>
                    <span className="text-zinc-300 font-semibold font-mono">{(selectedTx.ramBytes).toLocaleString()} bytes</span>
                  </div>
                </div>
              </div>

              {/* Invocation Parameters */}
              <div className="space-y-1">
                <span className="text-zinc-500 block">Function Invoked</span>
                <span className="font-semibold text-[#2bf3ff]">{selectedTx.operation}()</span>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-505 block">Arguments (Map Keys)</span>
                <pre className="p-3 bg-black border-4 border-black overflow-x-auto text-zinc-300 text-[11px]">
                  {JSON.stringify(selectedTx.parameters, null, 2)}
                </pre>
              </div>

              {/* Emitted Events */}
              {selectedTx.events.length > 0 && (
                <div className="space-y-2">
                  <span className="text-zinc-505 block">Emitted Soroban Events ({selectedTx.events.length})</span>
                  {selectedTx.events.map((evt, idx) => (
                    <div key={idx} className="p-3 bg-black border-4 border-black text-[11px] space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#2bf3ff] font-bold uppercase">Topic: {evt.topics[0]}</span>
                        <span className="text-zinc-555">Contract Event #{idx + 1}</span>
                      </div>
                      <p className="text-[#8ce25d] font-bold">{getEventDescription(evt)}</p>
                      <pre className="text-[10px] text-zinc-500 pt-1 border-t border-[#1a1a1a] mt-1">
                        Topics: {JSON.stringify(evt.topics)}
                        {"\n"}Data payload: {evt.data}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t-4 border-black flex justify-between items-center">
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${selectedTx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#2bf3ff] hover:text-[#ffd666] font-bold flex items-center gap-1 transition-colors"
              >
                View on StellarExpert Mock
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setSelectedTx(null)}
                className="mc-gui-btn border-2 px-3 py-1.5 text-xs font-semibold cursor-pointer"
              >
                Close Receipt
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
