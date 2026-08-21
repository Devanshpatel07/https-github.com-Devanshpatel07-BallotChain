export interface Candidate {
  id: number;
  name: string;
  description: string;
  votes: number;
  registeredBy: string;
  registeredAt: number;
}

export interface Vote {
  voter: string;
  candidateId: number;
  timestamp: number;
}

export interface VotingConfig {
  title: string;
  startTime: number; // UTC timestamp in ms
  endTime: number;   // UTC timestamp in ms
  admin: string;
  paused: boolean;
}

export interface Wallet {
  address: string;
  publicKey: string;
  privateKey?: string;
  balance: number; // XLM Balance
  type: 'freighter' | 'albedo' | 'xbull' | 'simulated';
  connected: boolean;
}

export interface SorobanEvent {
  id: string;
  contractId: string;
  topics: string[]; // e.g., ["vote", "voter_address", "candidate_id"]
  data: string;     // JSON or serialized data
  timestamp: number;
}

export interface Transaction {
  hash: string;
  ledger: number;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  source: string;
  operation: string; // e.g., "vote", "register_candidate"
  parameters: Record<string, any>;
  events: SorobanEvent[];
  feePaid: number;       // XLM fee
  cpuInstructions: number;
  ramBytes: number;
}

export interface Ledger {
  sequence: number;
  timestamp: number;
  hash: string;
  transactionsCount: number;
}
