"use client";

import { useState, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import {
  X,
  Play,
  TestTube,
  Rocket,
  Save,
  Settings2,
  Circle,
  Loader2,
} from "lucide-react";

interface EditorTab {
  id: string;
  name: string;
  language: string;
  content: string;
}

const defaultFileContents: Record<string, { language: string; content: string }> = {
  "lib.rs": {
    language: "rust",
    content: `#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Vec};

#[contracttype]
pub enum DataKey {
    Owner,
    Votes,
    Voters,
    Candidates,
}

#[contract]
pub struct VotingContract;

#[contractimpl]
impl VotingContract {
    pub fn init(env: Env, owner: Address) {
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Votes, &Map::<String, u32>::new(&env));
        env.storage().instance().set(&DataKey::Voters, &Map::<Address, bool>::new(&env));
        env.storage().instance().set(&DataKey::Candidates, &Vec::<String>::new(&env));
    }

    pub fn add_candidate(env: Env, caller: Address, candidate: String) {
        caller.require_auth();
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        assert!(caller == owner, "only owner can add candidates");
        let mut candidates: Vec<String> = env.storage().instance().get(&DataKey::Candidates).unwrap();
        assert!(!candidates.contains(&candidate), "candidate already exists");
        candidates.push_back(candidate);
        env.storage().instance().set(&DataKey::Candidates, &candidates);
    }

    pub fn vote(env: Env, voter: Address, candidate: String) {
        voter.require_auth();
        let mut voters: Map<Address, bool> = env.storage().instance().get(&DataKey::Voters).unwrap();
        assert!(!voters.get(voter.clone()).unwrap_or(false), "already voted");
        let candidates: Vec<String> = env.storage().instance().get(&DataKey::Candidates).unwrap();
        assert!(candidates.contains(&candidate), "unknown candidate");
        let mut votes: Map<String, u32> = env.storage().instance().get(&DataKey::Votes).unwrap();
        let count = votes.get(candidate.clone()).unwrap_or(0);
        votes.set(candidate, count + 1);
        voters.set(voter, true);
        env.storage().instance().set(&DataKey::Votes, &votes);
        env.storage().instance().set(&DataKey::Voters, &voters);
    }

    pub fn get_votes(env: Env, candidate: String) -> u32 {
        let votes: Map<String, u32> = env.storage().instance().get(&DataKey::Votes).unwrap();
        votes.get(candidate).unwrap_or(0)
    }

    pub fn get_candidates(env: Env) -> Vec<String> {
        env.storage().instance().get(&DataKey::Candidates).unwrap()
    }

    pub fn get_voters(env: Env) -> Vec<Address> {
        let voters: Map<Address, bool> = env.storage().instance().get(&DataKey::Voters).unwrap();
        voters.keys()
    }

    pub fn get_owner(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Owner).unwrap()
    }
}

mod test;`,
  },
  "test.rs": {
    language: "rust",
    content: `#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Env, String};

#[test]
fn test_init() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    client.init(&owner);
    assert_eq!(client.get_owner(), owner);
    assert_eq!(client.get_candidates().len(), 0);
}

#[test]
fn test_vote() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    client.init(&owner);
    client.add_candidate(&owner, &String::from_str(&env, "Alice"));

    let voter = Address::generate(&env);
    client.vote(&voter, &String::from_str(&env, "Alice"));
    assert_eq!(client.get_votes(&String::from_str(&env, "Alice")), 1);
}

#[test]
#[should_panic(expected = "already voted")]
fn test_double_vote() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    client.init(&owner);
    client.add_candidate(&owner, &String::from_str(&env, "Alice"));

    let voter = Address::generate(&env);
    client.vote(&voter, &String::from_str(&env, "Alice"));
    client.vote(&voter, &String::from_str(&env, "Alice"));
}`,
  },
  "registry.rs": {
    language: "rust",
    content: `use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone, Debug)]
pub struct Proposal {
    pub id: u32,
    pub title: String,
    pub creator: Address,
    pub votes_for: u32,
    pub votes_against: u32,
    pub active: bool,
}

impl Proposal {
    pub fn new(id: u32, title: String, creator: Address) -> Self {
        Self {
            id,
            title,
            creator,
            votes_for: 0,
            votes_against: 0,
            active: true,
        }
    }
}`,
  },
  "App.tsx": {
    language: "typescript",
    content: `import { useState } from "react";
import { connectWallet } from "./stellar";

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [candidate, setCandidate] = useState("");

  const handleConnect = async () => {
    const addr = await connectWallet();
    setAccount(addr);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Voting dApp</h1>
      {!account ? (
        <button onClick={handleConnect} className="px-4 py-2 bg-cyan-500 rounded">
          Connect Freighter
        </button>
      ) : (
        <div>
          <p className="mb-4 text-sm text-gray-400">
            Connected: {account.slice(0, 8)}...{account.slice(-4)}
          </p>
          <input
            value={candidate}
            onChange={(e) => setCandidate(e.target.value)}
            placeholder="Candidate name"
            className="block mb-4 px-3 py-2 bg-gray-800 rounded"
          />
          <button className="px-4 py-2 bg-purple-600 rounded">
            Cast Vote
          </button>
        </div>
      )}
    </div>
  );
}`,
  },
  "Cargo.toml": {
    language: "toml",
    content: `[package]
name = "voting-contract"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
soroban-sdk = "25.0.0"

[dev-dependencies]
soroban-sdk = { version = "25.0.0", features = ["testutils"] }`,
  },
  ".env": {
    language: "plaintext",
    content: `STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_PASSPHRASE=Test SDF Network ; September 2015
CONTRACT_ID=`,
  },
};

export default function CodeEditor({
  activeFile,
  onCloseFile,
  onCompile,
  onTest,
  onDeploy,
  compiling,
  testing,
  deploying,
  contractId,
}: {
  activeFile: string;
  onCloseFile: (id: string) => void;
  onCompile?: () => void;
  onTest?: () => void;
  onDeploy?: () => void;
  compiling?: boolean;
  testing?: boolean;
  deploying?: boolean;
  contractId?: string | null;
}) {
  // Content state: tracks edited content per file
  const [fileContents, setFileContents] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const [key, val] of Object.entries(defaultFileContents)) {
      initial[key] = val.content;
    }
    return initial;
  });

  const [openTabs, setOpenTabs] = useState<string[]>(["lib.rs"]);
  const [currentTab, setCurrentTab] = useState("lib.rs");
  const [modified, setModified] = useState<Set<string>>(new Set());

  // Sync activeFile from parent (FileExplorer clicks)
  useEffect(() => {
    if (activeFile && activeFile !== currentTab) {
      setCurrentTab(activeFile);
      if (!openTabs.includes(activeFile)) {
        setOpenTabs((prev) => [...prev, activeFile]);
      }
    }
  }, [activeFile]);

  // Auto-sync contract ID into .env tab
  useEffect(() => {
    if (contractId) {
      setFileContents((prev) => ({
        ...prev,
        ".env": `STELLAR_NETWORK=testnet\nSTELLAR_RPC_URL=https://soroban-testnet.stellar.org\nSTELLAR_PASSPHRASE=Test SDF Network ; September 2015\nCONTRACT_ID=${contractId}`,
      }));
    }
  }, [contractId]);

  const getLanguage = (filename: string): string => {
    if (filename.endsWith(".rs")) return "rust";
    if (filename.endsWith(".tsx") || filename.endsWith(".ts")) return "typescript";
    if (filename.endsWith(".toml")) return "toml";
    if (filename.endsWith(".json")) return "json";
    return "plaintext";
  };

  const handleCodeChange = useCallback((value: string | undefined) => {
    if (!value) return;
    setFileContents((prev) => ({ ...prev, [currentTab]: value }));
    setModified((prev) => new Set(prev).add(currentTab));
  }, [currentTab]);

  const handleCloseTab = (tabId: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== tabId);
      if (currentTab === tabId && next.length > 0) {
        setCurrentTab(next[next.length - 1]);
      }
      return next;
    });
    onCloseFile(tabId);
  };

  const content = fileContents[currentTab] || "";
  const lang = getLanguage(currentTab);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-surface/50">
        <div className="flex items-center gap-1">
          <button
            onClick={onCompile}
            disabled={compiling}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-accent-green/10 text-accent-green hover:bg-accent-green/20 transition-colors disabled:opacity-50"
          >
            {compiling ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {compiling ? "Compiling..." : "Compile WASM"}
          </button>
          <button
            onClick={onTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-cyan/10 text-cyan hover:bg-cyan/20 transition-colors disabled:opacity-50"
          >
            {testing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <TestTube className="w-3 h-3" />
            )}
            {testing ? "Testing..." : "Run Tests"}
          </button>
          <button
            onClick={onDeploy}
            disabled={deploying}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-purple/10 text-purple hover:bg-purple/20 transition-colors disabled:opacity-50"
          >
            {deploying ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Rocket className="w-3 h-3" />
            )}
            {deploying ? "Deploying..." : "Deploy"}
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-text-muted hover:text-foreground hover:bg-surface rounded transition-colors">
            <Save className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 text-text-muted hover:text-foreground hover:bg-surface rounded transition-colors">
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border bg-surface/30 overflow-x-auto">
        {openTabs.map((tabId) => (
          <button
            key={tabId}
            onClick={() => setCurrentTab(tabId)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs border-r border-border whitespace-nowrap transition-colors ${
              currentTab === tabId
                ? "bg-background text-foreground border-b-2 border-b-cyan"
                : "text-text-secondary hover:text-foreground hover:bg-surface"
            }`}
          >
            {modified.has(tabId) && (
              <Circle className="w-2 h-2 fill-accent-amber text-accent-amber" />
            )}
            <span>{tabId}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleCloseTab(tabId);
              }}
              className="ml-1 p-0.5 rounded hover:bg-surface-alt text-text-muted hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </span>
          </button>
        ))}
      </div>

      {/* Editor — controlled value for persistence */}
      <div className="flex-1 min-h-0">
        <Editor
          key={currentTab}
          language={lang}
          value={content}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12 },
            lineNumbers: "on",
            renderLineHighlight: "all",
            bracketPairColorization: { enabled: true },
            tabSize: 4,
            wordWrap: "on",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            readOnly: currentTab === ".env" && !contractId,
          }}
          loading={
            <div className="h-full flex items-center justify-center text-text-muted text-sm">
              Loading editor...
            </div>
          }
        />
      </div>
    </div>
  );
}
