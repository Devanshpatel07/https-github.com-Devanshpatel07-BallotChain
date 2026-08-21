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
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden" id="stellar-ledger-explorer">
      {/* Header */}
      <div className="p-6 bg-zinc-950 border-b border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-800/60 rounded-xl">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              Stellar Testnet Explorer
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-[9px] text-emerald-400 font-bold rounded uppercase tracking-wider">
                live network
              </span>
            </h3>
            <p className="text-xs text-zinc-400">Inspect real-time blocks, transactions, gas fees, and contract events.</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'transactions' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'events' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Contract Events
          </button>
          <button
            onClick={() => setActiveTab('ledgers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'ledgers' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ledgers
          </button>
        </div>
      </div>

      {/* Explorer Content Window */}
      <div className="p-4 bg-zinc-950/40">
        
        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div className="space-y-3" id="explorer-transactions-tab">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Terminal className="w-8 h-8 mx-auto text-zinc-700 mb-3" />
                <p className="text-sm font-medium">No transactions on ledger yet</p>
                <p className="text-xs text-zinc-650 max-w-xs mx-auto mt-1">Cast a vote or register a candidate to trigger a Soroban contract transaction.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead>
                    <tr className="border-b border-zinc-850 text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">
                      <th className="pb-3 pl-2">Hash</th>
                      <th className="pb-3">Source</th>
                      <th className="pb-3">Invocations / Op</th>
                      <th className="pb-3 text-right">Fee (XLM)</th>
                      <th className="pb-3 text-right">Age</th>
                      <th className="pb-3 text-center">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {transactions.map((tx) => (
                      <tr key={tx.hash} className="hover:bg-zinc-900/50 group transition-colors">
                        <td className="py-3 pl-2 font-mono text-zinc-400">
                          <span className="text-indigo-400 font-semibold">{tx.hash.slice(0, 8)}</span>
                          {tx.hash.slice(8, 14)}
                        </td>
                        <td className="py-3 font-mono text-zinc-500 text-[11px]">
                          {truncate(tx.source)}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide font-mono ${
                            tx.operation === 'vote' ? 'bg-indigo-950 border border-indigo-900 text-indigo-400' :
                            tx.operation === 'register_candidate' ? 'bg-emerald-950 border border-emerald-900/80 text-emerald-400' :
                            tx.operation === 'friendbot_fund' ? 'bg-amber-950/50 border border-amber-900/50 text-amber-400' :
                            'bg-zinc-800 text-zinc-300'
                          }`}>
                            {tx.operation}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-zinc-400">
                          {tx.feePaid > 0 ? `${tx.feePaid} XLM` : '0.00 (Friendbot)'}
                        </td>
                        <td className="py-3 text-right font-mono text-zinc-500">
                          {formatTime(tx.timestamp)}
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[10px] font-semibold text-zinc-300 hover:text-zinc-100 rounded-md transition-all cursor-pointer"
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
              <div className="text-center py-12 text-zinc-500">
                <Terminal className="w-8 h-8 mx-auto text-zinc-700 mb-3 animate-pulse" />
                <p className="text-sm font-medium">No smart contract events logged</p>
                <p className="text-xs text-zinc-600 mt-1">Soroban events appear in real-time when the contract state transitions.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {events.map((evt) => (
                  <div key={evt.id} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-start justify-between gap-4 hover:border-zinc-800 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase bg-indigo-950 border border-indigo-900/80 text-indigo-400 px-1.5 py-0.5 rounded font-bold">
                          {evt.topics[0]}
                        </span>
                        <span className="text-xs font-mono text-zinc-650">
                          topics: [{evt.topics.map(t => `"${truncate(t, 4)}"`).join(', ')}]
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 font-semibold">{getEventDescription(evt)}</p>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 shrink-0 mt-0.5">
                      <Clock className="w-3 h-3" />
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
              <div key={ledger.sequence} className="p-3.5 bg-zinc-950/60 border border-zinc-850 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs hover:border-zinc-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-lg">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200">Ledger #{ledger.sequence}</span>
                    <p className="text-[10px] text-zinc-500 truncate max-w-[200px] sm:max-w-xs mt-0.5">Hash: {ledger.hash}</p>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto text-zinc-500 gap-1 border-t sm:border-t-0 border-zinc-900 pt-2 sm:pt-0">
                  <span className="text-[10px] text-indigo-400 bg-indigo-950/50 border border-indigo-900 px-2 py-0.5 rounded shrink-0">
                    {ledger.transactionsCount} txs sealed
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
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl animate-scale-up font-mono text-xs">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-zinc-800 pb-4 mb-5">
              <div>
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-[10px] text-emerald-400 font-bold rounded uppercase tracking-wider">
                  Tx Receipt
                </span>
                <h3 className="text-base font-bold text-zinc-100 mt-2 truncate max-w-sm sm:max-w-md">
                  {selectedTx.hash}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 rounded-lg text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Details Grid */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-zinc-850 pb-4">
                <div>
                  <span className="text-zinc-500 block mb-1">Ledger Sequence</span>
                  <span className="text-zinc-200 font-semibold">{selectedTx.ledger}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">Sealed Timestamp</span>
                  <span className="text-zinc-200">{new Date(selectedTx.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">Status</span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-900/80 rounded font-bold text-[10px] uppercase">
                    {selectedTx.status}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block mb-1">Gas / Soroban CPU Fee</span>
                  <span className="text-zinc-200">{selectedTx.feePaid > 0 ? `${selectedTx.feePaid} XLM` : '0.00 XLM'}</span>
                </div>
              </div>

              {/* Soroban VM Details */}
              <div className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  Soroban Execution Footprint
                </h4>
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-zinc-500 block">CPU Instructions</span>
                    <span className="text-zinc-300 font-semibold font-mono">{(selectedTx.cpuInstructions).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">RAM Allocations</span>
                    <span className="text-zinc-300 font-semibold font-mono">{(selectedTx.ramBytes).toLocaleString()} bytes</span>
                  </div>
                </div>
              </div>

              {/* Invocation Parameters */}
              <div className="space-y-1">
                <span className="text-zinc-500 block">Function Invoked</span>
                <span className="font-semibold text-indigo-400">{selectedTx.operation}()</span>
              </div>

              <div className="space-y-1">
                <span className="text-zinc-500 block">Arguments (Map Keys)</span>
                <pre className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl overflow-x-auto text-zinc-300 text-[11px]">
                  {JSON.stringify(selectedTx.parameters, null, 2)}
                </pre>
              </div>

              {/* Emitted Events */}
              {selectedTx.events.length > 0 && (
                <div className="space-y-2">
                  <span className="text-zinc-500 block">Emitted Soroban Events ({selectedTx.events.length})</span>
                  {selectedTx.events.map((evt, idx) => (
                    <div key={idx} className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl text-[11px] space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-indigo-400 font-bold uppercase">Topic: {evt.topics[0]}</span>
                        <span className="text-zinc-500">Contract Event #{idx + 1}</span>
                      </div>
                      <p className="text-zinc-300 font-bold">{getEventDescription(evt)}</p>
                      <pre className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-900 mt-1">
                        Topics: {JSON.stringify(evt.topics)}
                        {"\n"}Data payload: {evt.data}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-zinc-850 flex justify-between items-center">
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${selectedTx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
              >
                View on StellarExpert Mock
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
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
