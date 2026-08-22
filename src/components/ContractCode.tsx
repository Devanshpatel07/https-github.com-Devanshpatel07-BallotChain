import { useState, useEffect } from 'react';
import { sorobanSimulator } from '../lib/sorobanSim';
import { Code2, BookOpen, Play, Check, ChevronDown, HelpCircle, Terminal } from 'lucide-react';

export default function ContractCode() {
  const [activeTab, setActiveTab] = useState<'rust' | 'abi'>('rust');
  const [contractId] = useState('CCVOTINGDAPP2026777777777777777777777777777777777777777777');
  const [manualFunc, setManualFunc] = useState<'get_state' | 'get_candidates' | 'has_voted'>('get_candidates');
  const [voterCheckAddress, setVoterCheckAddress] = useState('');
  const [queryResult, setQueryResult] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    // Populate default wallet for checking
    const wallet = sorobanSimulator.getConnectedWallet();
    if (wallet) {
      setVoterCheckAddress(wallet.address);
    }
  }, []);

  const handleManualInvoke = () => {
    setIsQuerying(true);
    setQueryResult('');
    setTimeout(() => {
      try {
        if (manualFunc === 'get_state') {
          const cfg = sorobanSimulator.getConfig();
          const candidates = sorobanSimulator.getCandidates();
          const res = {
            title: cfg.title,
            start_time: cfg.startTime,
            end_time: cfg.endTime,
            admin: cfg.admin,
            total_candidates: candidates.length,
            current_ledger_time: sorobanSimulator.getSimulatedTime()
          };
          setQueryResult(JSON.stringify(res, null, 2));
        } else if (manualFunc === 'get_candidates') {
          const candidates = sorobanSimulator.getCandidates();
          setQueryResult(JSON.stringify(candidates, null, 2));
        } else if (manualFunc === 'has_voted') {
          if (!voterCheckAddress.trim()) {
            throw new Error("voter address is required as arguments to has_voted()");
          }
          const hasVoted = sorobanSimulator.getEvents().some(evt => 
            evt.topics[0] === 'vote_cast' && evt.topics[1] === voterCheckAddress
          );
          setQueryResult(JSON.stringify({ address: voterCheckAddress, has_voted: hasVoted }, null, 2));
        }
      } catch (err: any) {
        setQueryResult(`Error: ${err.message}`);
      } finally {
        setIsQuerying(false);
      }
    }, 600);
  };

  const rustCode = `// #![no_std]
// Upgraded Stellar Soroban Smart Contract - Voting with Candidate Registry
// Invokes Candidate Registry contract via Env::invoke_contract

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec, IntoVal,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Title,
    StartTime,
    EndTime,
    Registry,
    Voted(Address),   // bool
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Candidate {
    pub id: u32,
    pub name: String,
    pub description: String,
    pub votes: u32,
    pub registered_by: Address,
    pub registered_at: u64,
}

#[contract]
pub struct VotingContract;

#[contractimpl]
impl VotingContract {
    pub fn initialize(env: Env, admin: Address, registry: Address, title: String, start_time: u64, end_time: u64) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract is already initialized");
        }
        if start_time >= end_time {
            panic!("Start time must be before end time");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Registry, &registry);
        env.storage().instance().set(&DataKey::Title, &title);
        env.storage().instance().set(&DataKey::StartTime, &start_time);
        env.storage().instance().set(&DataKey::EndTime, &end_time);
    }

    pub fn register_candidate(env: Env, caller: Address, name: String, description: String) -> u32 {
        caller.require_auth();
        let end_time: u64 = env.storage().instance().get(&DataKey::EndTime).unwrap();
        if env.ledger().timestamp() >= end_time {
            panic!("Voting window has ended");
        }
        let registry: Address = env.storage().instance().get(&DataKey::Registry).unwrap();
        env.invoke_contract(&registry, &Symbol::new(&env, "register"),
            soroban_sdk::vec![&env, name.into_val(&env), description.into_val(&env), caller.into_val(&env), env.ledger().timestamp().into_val(&env)]
        )
    }

    pub fn vote(env: Env, voter: Address, candidate_id: u32) {
        voter.require_auth();
        let voted_key = DataKey::Voted(voter.clone());
        if env.storage().persistent().has(&voted_key) {
            panic!("Wallet has already cast a vote");
        }

        let current_time = env.ledger().timestamp();
        let start_time: u64 = env.storage().instance().get(&DataKey::StartTime).unwrap();
        let end_time: u64 = env.storage().instance().get(&DataKey::EndTime).unwrap();
        if current_time < start_time || current_time > end_time {
            panic!("Voting has ended or not started yet");
        }

        let registry: Address = env.storage().instance().get(&DataKey::Registry).unwrap();
        env.invoke_contract::<()>(&registry, &Symbol::new(&env, "increment_votes"), soroban_sdk::vec![&env, candidate_id.into_val(&env)]);
        env.storage().persistent().set(&voted_key, &true);
    }
}`;

  return (
    <div className="mc-gui-panel overflow-hidden" id="contract-exploratory-panel">
      <div className="p-6 bg-[#252525] border-b-4 border-black flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black border-2 border-black text-[#2bf3ff]">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="mc-title text-[#ffffff] flex items-center gap-2 mb-1">
              Soroban Smart Contract Specs
            </h3>
            <p className="text-sm text-[#aaaaaa]">Examine the underlying Rust smart contract code and interact with the ABI.</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-black border-2 border-black p-1 gap-0.5">
          <button
            onClick={() => setActiveTab('rust')}
            className={`mc-pixel-font text-[8px] px-2.5 py-1.5 transition-all cursor-pointer ${
              activeTab === 'rust' ? 'bg-[#5c9e31] text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Rust Source
          </button>
          <button
            onClick={() => setActiveTab('abi')}
            className={`mc-pixel-font text-[8px] px-2.5 py-1.5 transition-all cursor-pointer ${
              activeTab === 'abi' ? 'bg-[#5c9e31] text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ABI Client Query
          </button>
        </div>
      </div>

      {activeTab === 'rust' ? (
        <div className="p-4 bg-black/30" id="contract-rust-tab">
          {/* Storage Explanation Callout */}
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#2d2105] border-4 border-[#ffaa00] space-y-1">
              <span className="text-[8px] mc-pixel-font text-[#ffaa00]">STORAGE: INSTANCE</span>
              <p className="text-xs text-zinc-350">Stores candidate maps, active durations, and admin key tokens. Shared state scoped to the contract.</p>
            </div>
            <div className="p-3 bg-black border-4 border-black space-y-1">
              <span className="text-[8px] mc-pixel-font text-[#2bf3ff]">STORAGE: PERSISTENT</span>
              <p className="text-xs text-zinc-350">Stores voter ballot hashes (`Voted(Address)`). Prevents double voting even across subsequent upgrades.</p>
            </div>
            <div className="p-3 bg-[#1a1a1a] border-2 border-black space-y-1">
              <span className="text-[8px] mc-pixel-font text-[#8ce25d]">AUTH: REQUIRE_AUTH()</span>
              <p className="text-xs text-zinc-350">Secures transaction broadcasting. Enforces that the transaction is cryptographically signed by the voter.</p>
            </div>
          </div>

          {/* Source Code Container */}
          <div className="relative border-4 border-black bg-black max-h-[380px] overflow-y-auto">
            <pre className="p-4 text-zinc-300 font-mono text-xs overflow-x-auto leading-relaxed select-text">
              <code>{rustCode}</code>
            </pre>
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-5" id="contract-abi-tab">
          <div className="p-4 bg-[#1a1a1a] border-4 border-black space-y-4">
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
              <div className="w-full sm:w-1/3">
                <label className="text-xs text-zinc-400 block mb-1.5">Callable Function</label>
                <div className="relative">
                  <select
                    value={manualFunc}
                    onChange={(e: any) => setManualFunc(e.target.value)}
                    className="w-full mc-gui-input py-2 px-3 text-xs font-mono appearance-none"
                  >
                    <option value="get_candidates">get_candidates()</option>
                    <option value="get_state">get_state()</option>
                    <option value="has_voted">has_voted(voter: Address)</option>
                  </select>
                </div>
              </div>

              {manualFunc === 'has_voted' && (
                <div className="flex-1 w-full">
                  <label className="text-xs text-zinc-400 block mb-1.5">Voter Address (Gd Address argument)</label>
                  <input
                    type="text"
                    value={voterCheckAddress}
                    onChange={(e) => setVoterCheckAddress(e.target.value)}
                    placeholder="e.g. GD..."
                    className="w-full mc-gui-input py-2 px-3 text-xs font-mono"
                  />
                </div>
              )}

              <div className="shrink-0 self-end w-full sm:w-auto">
                <button
                  onClick={handleManualInvoke}
                  disabled={isQuerying}
                  className="mc-gui-btn border-2 py-2 px-4 uppercase font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {isQuerying ? 'Querying...' : 'Query Contract'}
                </button>
              </div>
            </div>

            {/* Simulated Soroban RPC Response console */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-405 uppercase tracking-wider text-[9px] mc-pixel-font flex items-center gap-1">
                  <Terminal className="w-4 h-4 text-[#ffd666]" />
                  Soroban RPC Response Console
                </span>
                {queryResult && (
                  <span className="text-[#8ce25d] font-bold text-[8px] mc-pixel-font flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    200 OK SUCCESS
                  </span>
                )}
              </div>
              <pre className="p-4 bg-black border-4 border-[#222] min-h-[160px] max-h-[220px] overflow-y-auto text-zinc-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                {queryResult || 'Waiting to query contract data... Call get_state() or get_candidates() to read live Soroban ledger state.'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
