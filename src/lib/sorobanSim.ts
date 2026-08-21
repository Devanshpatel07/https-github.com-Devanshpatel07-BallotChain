import { Candidate, Vote, VotingConfig, Wallet, Transaction, SorobanEvent, Ledger } from '../types';

// Helper to generate a mock Stellar public key
export function generateStellarAddress(prefix: string = 'GD'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = prefix;
  for (let i = 0; i < 54; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper to generate a random hash
export function generateHash(length: number = 64): string {
  const chars = 'abcdef0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const STORAGE_KEY = 'soroban_voting_sim_state';

interface SimulatorState {
  config: VotingConfig;
  candidates: Candidate[];
  votes: Vote[];
  wallets: Wallet[];
  transactions: Transaction[];
  events: SorobanEvent[];
  ledgers: Ledger[];
  currentLedger: number;
  timeWarpOffset: number; // in milliseconds
  activeWalletIndex: number;
}

const DEFAULT_CONFIG = (adminAddress: string): VotingConfig => ({
  title: "Stellar Future Governance Poll 2026",
  startTime: Date.now() - 3600000, // Starts 1 hour ago
  endTime: Date.now() + 7200000,   // Ends in 2 hours
  admin: adminAddress,
  paused: false,
});

export class SorobanSimulator {
  private state: SimulatorState;
  private listeners: Set<() => void> = new Set();
  private tickerInterval: any = null;

  constructor() {
    this.state = this.loadState();
    this.startTicker();
  }

  private loadState(): SimulatorState {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Ensure times are numbers
        parsed.config.startTime = Number(parsed.config.startTime);
        parsed.config.endTime = Number(parsed.config.endTime);
        return parsed;
      } catch (e) {
        console.error("Failed to parse cached simulator state, resetting", e);
      }
    }

    // Default initialization
    const adminAddress = "GDADMIN" + "X".repeat(49) + "ADMIN";
    const initialWallets: Wallet[] = [
      {
        address: adminAddress,
        publicKey: adminAddress,
        privateKey: "SADMIN" + "X".repeat(49) + "ADMIN",
        balance: 15000,
        type: 'simulated',
        connected: false
      },
      {
        address: "GDALICE" + "A".repeat(49) + "ALICE",
        publicKey: "GDALICE" + "A".repeat(49) + "ALICE",
        privateKey: "SALICE" + "A".repeat(49) + "ALICE",
        balance: 120,
        type: 'simulated',
        connected: false
      },
      {
        address: "GDBOBBB" + "B".repeat(49) + "BOBBB",
        publicKey: "GDBOBBB" + "B".repeat(49) + "BOBBB",
        privateKey: "SBOBBB" + "B".repeat(49) + "BOBBB",
        balance: 350,
        type: 'simulated',
        connected: false
      }
    ];

    const initialCandidates: Candidate[] = [
      {
        id: 1,
        name: "EcoStellar Carbon Offset Oracle",
        description: "A smart-contract driven carbon accounting and offset oracle linking green initiatives directly to Lumens liquidity pools.",
        votes: 8,
        registeredBy: adminAddress,
        registeredAt: Date.now() - 7200000
      },
      {
        id: 2,
        name: "Soroban Name Service (SNS)",
        description: "A decentralized, gas-optimized registrar on Soroban for mapping human-friendly .stellar addresses to public keys.",
        votes: 12,
        registeredBy: adminAddress,
        registeredAt: Date.now() - 7200000
      },
      {
        id: 3,
        name: "SDF Validator Node Stimulus",
        description: "A community treasury payout mechanism rewards independent validator nodes maintaining exceptional tier-1 consensus uptime.",
        votes: 5,
        registeredBy: adminAddress,
        registeredAt: Date.now() - 7200000
      }
    ];

    const initialLedgerSeq = 45812903;
    const initialLedgers: Ledger[] = [
      {
        sequence: initialLedgerSeq,
        timestamp: Date.now() - 5000,
        hash: "f" + generateHash(63),
        transactionsCount: 3
      }
    ];

    const initialEvents: SorobanEvent[] = [
      {
        id: "evt_" + generateHash(16),
        contractId: "CCVOTINGDAPP2026777777777777777777777777777777777777777777",
        topics: ["init", adminAddress],
        data: JSON.stringify({ title: "Stellar Future Governance Poll 2026", startTime: Date.now() - 3600000, endTime: Date.now() + 7200000 }),
        timestamp: Date.now() - 7200000
      }
    ];

    return {
      config: DEFAULT_CONFIG(adminAddress),
      candidates: initialCandidates,
      votes: [],
      wallets: initialWallets,
      transactions: [],
      events: initialEvents,
      ledgers: initialLedgers,
      currentLedger: initialLedgerSeq,
      timeWarpOffset: 0,
      activeWalletIndex: 1 // Default to Alice's wallet
    };
  }

  private saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  private pollInterval: any = null;

  private startTicker() {
    if (this.tickerInterval) return;
    // Run once immediately
    this.pollTestnetData();
    
    this.tickerInterval = setInterval(() => {
      this.tickLedger();
    }, 8000); // Create a new block every 8 seconds

    this.pollInterval = setInterval(() => {
      this.pollTestnetData();
    }, 5500); // Poll real Stellar Testnet status every 5.5 seconds
  }

  public stopTicker() {
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // Closes a ledger and occasionally simulates a vote from random nodes to keep feed alive
  private tickLedger() {
    const nextLedger = this.state.currentLedger + 1;
    const timestamp = this.getSimulatedTime();
    const hash = "e" + generateHash(63);

    let simulatedTxCount = 0;
    
    // 15% chance to simulate a random background community vote
    const isVotingActive = timestamp >= this.state.config.startTime && timestamp <= this.state.config.endTime;
    if (isVotingActive && Math.random() < 0.2 && this.state.candidates.length > 0) {
      const randCandidate = this.state.candidates[Math.floor(Math.random() * this.state.candidates.length)];
      const randVoter = generateStellarAddress('GDVOTER');
      
      // Check if candidate exists and add votes
      this.state.candidates = this.state.candidates.map(c => {
        if (c.id === randCandidate.id) {
          return { ...c, votes: c.votes + 1 };
        }
        return c;
      });

      // Emitted Soroban event
      const eventId = "evt_" + generateHash(16);
      const contractEvent: SorobanEvent = {
        id: eventId,
        contractId: "CCVOTINGDAPP2026777777777777777777777777777777777777777777",
        topics: ["vote_cast", randVoter, randCandidate.id.toString()],
        data: JSON.stringify({ timestamp }),
        timestamp
      };

      // Create simulated transaction
      const tx: Transaction = {
        hash: "tx_" + generateHash(60),
        ledger: nextLedger,
        timestamp,
        status: 'success',
        source: randVoter,
        operation: 'vote',
        parameters: { voter: randVoter, candidate_id: randCandidate.id },
        events: [contractEvent],
        feePaid: 0.1,
        cpuInstructions: 120540,
        ramBytes: 4210
      };

      this.state.transactions.unshift(tx);
      this.state.events.unshift(contractEvent);
      simulatedTxCount = 1;
    }

    const ledger: Ledger = {
      sequence: nextLedger,
      timestamp,
      hash,
      transactionsCount: simulatedTxCount
    };

    this.state.ledgers.unshift(ledger);
    this.state.currentLedger = nextLedger;

    // Keep history sized reasonably
    if (this.state.ledgers.length > 30) this.state.ledgers.pop();
    if (this.state.transactions.length > 50) this.state.transactions.pop();
    if (this.state.events.length > 50) this.state.events.pop();

    this.saveState();
  }

  private async pollTestnetData() {
    if (typeof fetch === 'undefined') return;
    try {
      // 1. Fetch latest ledgers
      const ledgersRes = await fetch('https://horizon-testnet.stellar.org/ledgers?limit=15&order=desc');
      if (ledgersRes.ok) {
        const ledgersData = await ledgersRes.json();
        const records = ledgersData._embedded.records;
        if (records && records.length > 0) {
          this.state.currentLedger = records[0].sequence;
          this.state.ledgers = records.map((r: any) => ({
            sequence: r.sequence,
            hash: r.hash,
            transactionsCount: r.transaction_count,
            timestamp: new Date(r.closed_at).getTime()
          }));
        }
      }

      // 2. Fetch latest transactions
      const txRes = await fetch('https://horizon-testnet.stellar.org/transactions?limit=15&order=desc');
      if (txRes.ok) {
        const txData = await txRes.json();
        const records = txData._embedded.records;
        if (records && records.length > 0) {
          const realTxs = records.map((r: any) => ({
            hash: r.hash,
            ledger: r.ledger,
            timestamp: new Date(r.created_at).getTime(),
            status: r.successful ? 'success' as const : 'failed' as const,
            source: r.source_account,
            operation: 'stellar_transaction',
            parameters: { memo: r.memo || 'None', fee_charged: r.fee_charged },
            events: [],
            feePaid: parseFloat((r.fee_charged / 10000000).toFixed(6)), // convert stroops to XLM
            cpuInstructions: 0,
            ramBytes: 0
          }));

          const localTxs = this.state.transactions.filter(tx => tx.operation === 'vote' || tx.operation === 'register_candidate');
          const mergedTxs = [...localTxs, ...realTxs];
          this.state.transactions = mergedTxs.slice(0, 20);
        }
      }

      // 3. Poll connected Freighter wallet balance
      const connectedWallet = this.getConnectedWallet();
      if (connectedWallet && connectedWallet.type === 'freighter') {
        const accountRes = await fetch(`https://horizon-testnet.stellar.org/accounts/${connectedWallet.address}`);
        if (accountRes.ok) {
          const accountData = await accountRes.json();
          const balanceObj = accountData.balances.find((b: any) => b.asset_type === 'native');
          if (balanceObj) {
            const realBalance = parseFloat(balanceObj.balance);
            const targetWallet = this.state.wallets.find(w => w.address === connectedWallet.address);
            if (targetWallet) {
              targetWallet.balance = realBalance;
            }
          }
        }
      }

      this.notify();
    } catch (e) {
      console.warn("Stellar Testnet offline or polling failed, using offline simulation cache:", e);
    }
  }

  // Get current simulated clock time
  public getSimulatedTime(): number {
    return Date.now() + this.state.timeWarpOffset;
  }

  // Shift Simulated Ledger Time
  public setTimeWarpOffset(offsetMs: number) {
    this.state.timeWarpOffset = offsetMs;
    this.saveState();
  }

  public getTimeWarpOffset(): number {
    return this.state.timeWarpOffset;
  }

  // Get current state
  public getConfig(): VotingConfig {
    return this.state.config;
  }

  public getCandidates(): Candidate[] {
    return this.state.candidates;
  }

  public getTransactions(): Transaction[] {
    return this.state.transactions;
  }

  public getEvents(): SorobanEvent[] {
    return this.state.events;
  }

  public getLedgers(): Ledger[] {
    return this.state.ledgers;
  }

  public getWallets(): Wallet[] {
    return this.state.wallets;
  }

  public getConnectedWallet(): Wallet | null {
    return this.state.wallets.find(w => w.connected) || null;
  }

  // Simulate connecting wallet
  public connectWallet(type: Wallet['type'], specifiedAddress?: string): Promise<Wallet> {
    return new Promise((resolve, reject) => {
      // Simulate slow handshake (500ms)
      setTimeout(() => {
        // Disconnect all first
        this.state.wallets.forEach(w => w.connected = false);

        if (type === 'simulated') {
          // Select or create a simulated wallet
          const wallet = this.state.wallets[this.state.activeWalletIndex];
          wallet.connected = true;
          this.saveState();
          resolve(wallet);
        } else if (type === 'freighter') {
          if (typeof window !== 'undefined' && (window as any).freighterApi) {
            const api = (window as any).freighterApi;
            api.requestAccess()
              .then((accessObj: any) => {
                const pubKey = (accessObj && accessObj.address)
                  ? accessObj.address
                  : (typeof accessObj === 'string' ? accessObj : null);

                if (accessObj && accessObj.error) {
                  throw new Error(accessObj.error);
                }

                if (!pubKey) {
                  throw new Error("No public key returned from Freighter wallet. Please unlock your Freighter wallet and authorize the site.");
                }

                // Query their real balance from Stellar Testnet Horizon API
                const balanceFetch = (typeof fetch !== 'undefined')
                  ? fetch(`https://horizon-testnet.stellar.org/accounts/${pubKey}`)
                      .then(res => res.ok ? res.json() : null)
                  : Promise.resolve(null);

                balanceFetch
                  .then((accountData: any) => {
                    let realBalance = 100.0;
                    if (accountData) {
                      const balanceObj = accountData.balances.find((b: any) => b.asset_type === 'native');
                      if (balanceObj) realBalance = parseFloat(balanceObj.balance);
                    }
                    
                    let wallet = this.state.wallets.find(w => w.address === pubKey);
                    if (!wallet) {
                      wallet = {
                        address: pubKey,
                        publicKey: pubKey,
                        balance: realBalance,
                        type: 'freighter',
                        connected: true
                      };
                      this.state.wallets.push(wallet);
                    } else {
                      wallet.balance = realBalance;
                      wallet.connected = true;
                    }
                    this.saveState();
                    resolve(wallet);
                  })
                  .catch(() => {
                    let wallet = this.state.wallets.find(w => w.address === pubKey);
                    if (!wallet) {
                      wallet = {
                        address: pubKey,
                        publicKey: pubKey,
                        balance: 100.00,
                        type: 'freighter',
                        connected: true
                      };
                      this.state.wallets.push(wallet);
                    } else {
                      wallet.connected = true;
                    }
                    this.saveState();
                    resolve(wallet);
                  });
              })
              .catch((err: any) => {
                reject(new Error(err.message || "Failed to retrieve public key from Freighter. Check if it is unlocked."));
              });
          } else {
            reject(new Error("Freighter wallet extension was not found. Please install the extension from https://www.freighter.app/ and verify it is enabled in your browser."));
          }
        } else {
          // Handle standard extensions (Albedo, xBull) fallback
          // If specifiedAddress, we connect it, otherwise generate a realistic one
          const addr = specifiedAddress || generateStellarAddress(
            type === 'albedo' ? 'GDALB' : 'GDBUL'
          );

          let wallet = this.state.wallets.find(w => w.address === addr);
          if (!wallet) {
            wallet = {
              address: addr,
              publicKey: addr,
              balance: 100, // starting testnet balance
              type,
              connected: true
            };
            this.state.wallets.push(wallet);
          } else {
            wallet.connected = true;
          }
          this.saveState();
          resolve(wallet);
        }
      }, 400);
    });
  }

  public disconnectWallet() {
    this.state.wallets.forEach(w => w.connected = false);
    this.saveState();
  }

  public switchSimulatedWallet(index: number) {
    if (index >= 0 && index < this.state.wallets.filter(w => w.type === 'simulated').length) {
      this.state.activeWalletIndex = index;
      const isCurrentlySimulatedConnected = this.getConnectedWallet()?.type === 'simulated';
      if (isCurrentlySimulatedConnected) {
        // Disconnect existing and connect new simulated
        this.state.wallets.forEach(w => w.connected = false);
        const simWallets = this.state.wallets.filter(w => w.type === 'simulated');
        const targetWallet = simWallets[index];
        const actualIndexInMainList = this.state.wallets.findIndex(w => w.address === targetWallet.address);
        if (actualIndexInMainList !== -1) {
          this.state.wallets[actualIndexInMainList].connected = true;
        }
      }
      this.saveState();
    }
  }

  public createNewSimulatedWallet(name: string): Wallet {
    const address = generateStellarAddress('GD' + name.slice(0, 3).toUpperCase());
    const newWallet: Wallet = {
      address,
      publicKey: address,
      privateKey: "S" + address.slice(1),
      balance: 100, // starting balance
      type: 'simulated',
      connected: false
    };
    this.state.wallets.push(newWallet);
    this.state.activeWalletIndex = this.state.wallets.filter(w => w.type === 'simulated').length - 1;
    this.saveState();
    return newWallet;
  }

  // Friendbot faucet tool
  public async fundWallet(address: string): Promise<boolean> {
    try {
      // Call actual Friendbot
      const res = (typeof fetch !== 'undefined')
        ? await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`)
        : { ok: false };
      
      const wallet = this.state.wallets.find(w => w.address === address);
      if (wallet) {
        if (res.ok) {
          // Fetch updated balance from Horizon
          const accountRes = (typeof fetch !== 'undefined')
            ? await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`)
            : null;
          if (accountRes && accountRes.ok) {
            const accountData = await accountRes.json();
            const balanceObj = accountData.balances.find((b: any) => b.asset_type === 'native');
            if (balanceObj) {
              wallet.balance = parseFloat(balanceObj.balance);
            }
          } else {
            wallet.balance += 10000;
          }
        } else {
          wallet.balance += 10000;
        }

        const timestamp = this.getSimulatedTime();
        const tx: Transaction = {
          hash: "tx_fund_" + generateHash(55),
          ledger: this.state.currentLedger,
          timestamp,
          status: 'success',
          source: 'Friendbot_Faucet',
          operation: 'friendbot_fund',
          parameters: { destination: address, amount: 10000 },
          events: [],
          feePaid: 0,
          cpuInstructions: 0,
          ramBytes: 0
        };
        this.state.transactions.unshift(tx);
        this.saveState();
        return true;
      }
      return false;
    } catch (e) {
      // Offline fallback
      const wallet = this.state.wallets.find(w => w.address === address);
      if (wallet) {
        wallet.balance += 10000;
        this.saveState();
        return true;
      }
      return false;
    }
  }

  // Invoke Soroban: register_candidate
  public registerCandidate(name: string, description: string): Promise<Candidate> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const wallet = this.getConnectedWallet();
        if (!wallet) {
          return reject(new Error("Wallet is not connected"));
        }

        const fee = 0.1;
        if (wallet.balance < fee) {
          return reject(new Error("Insufficient balance to pay for Soroban Gas (CPU/RAM) fees"));
        }

        // Validate voting window end time
        const currentSimTime = this.getSimulatedTime();
        if (currentSimTime >= this.state.config.endTime) {
          return reject(new Error("Candidate registration failed: The voting window has ended"));
        }

        // Deduct fee
        wallet.balance = parseFloat((wallet.balance - fee).toFixed(4));

        const newId = this.state.candidates.length + 1;
        const candidate: Candidate = {
          id: newId,
          name,
          description,
          votes: 0,
          registeredBy: wallet.address,
          registeredAt: currentSimTime
        };

        this.state.candidates.push(candidate);

        // Soroban event
        const eventId = "evt_" + generateHash(16);
        const contractEvent: SorobanEvent = {
          id: eventId,
          contractId: "CCVOTINGDAPP2026777777777777777777777777777777777777777777",
          topics: ["register_candidate", wallet.address, newId.toString()],
          data: JSON.stringify({ name }),
          timestamp: currentSimTime
        };

        // Tx history record
        const tx: Transaction = {
          hash: "tx_" + generateHash(60),
          ledger: this.state.currentLedger,
          timestamp: currentSimTime,
          status: 'success',
          source: wallet.address,
          operation: 'register_candidate',
          parameters: { name, description, candidate_id: newId },
          events: [contractEvent],
          feePaid: fee,
          cpuInstructions: 185204,
          ramBytes: 6842
        };

        this.state.transactions.unshift(tx);
        this.state.events.unshift(contractEvent);
        this.saveState();
        resolve(candidate);
      }, 1000); // 1s simulation lag to show loader and pending status
    });
  }

  // Invoke Soroban: vote
  public vote(candidateId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const wallet = this.getConnectedWallet();
        if (!wallet) {
          return reject(new Error("Wallet is not connected. Please connect a Stellar wallet first."));
        }

        const fee = 0.1;
        if (wallet.balance < fee) {
          return reject(new Error("Insufficient balance to cover Soroban transaction fee of 0.1 XLM. Please fund via Friendbot first!"));
        }

        const currentSimTime = this.getSimulatedTime();

        // 1. Double vote check (One vote per wallet)
        const alreadyVoted = this.state.votes.some(v => v.voter === wallet.address);
        if (alreadyVoted) {
          return reject(new Error("Soroban VM Execution Error: Contract Panic! Wallet has already cast a vote. Soroban state storage enforces one-vote-per-wallet."));
        }

        // 2. Validate voting window (Start/End checks)
        if (currentSimTime < this.state.config.startTime) {
          return reject(new Error(`Soroban VM Execution Error: Voting window has not started yet. Elective window starts at ${new Date(this.state.config.startTime).toLocaleString()}.`));
        }
        if (currentSimTime > this.state.config.endTime) {
          return reject(new Error("Soroban VM Execution Error: Voting window is closed. Contract transaction rejected because current ledger time exceeds endTime."));
        }

        // 3. Candidate check
        const candidateIndex = this.state.candidates.findIndex(c => c.id === candidateId);
        if (candidateIndex === -1) {
          return reject(new Error("Soroban VM Execution Error: Candidate ID does not exist in the ledger state."));
        }

        // Execute changes
        wallet.balance = parseFloat((wallet.balance - fee).toFixed(4));
        
        // Add vote
        const vote: Vote = {
          voter: wallet.address,
          candidateId,
          timestamp: currentSimTime
        };
        this.state.votes.push(vote);

        // Update candidate votes count
        this.state.candidates[candidateIndex].votes += 1;

        // Soroban event
        const eventId = "evt_" + generateHash(16);
        const contractEvent: SorobanEvent = {
          id: eventId,
          contractId: "CCVOTINGDAPP2026777777777777777777777777777777777777777777",
          topics: ["vote_cast", wallet.address, candidateId.toString()],
          data: JSON.stringify({ timestamp: currentSimTime }),
          timestamp: currentSimTime
        };

        // Tx record
        const tx: Transaction = {
          hash: "tx_" + generateHash(60),
          ledger: this.state.currentLedger,
          timestamp: currentSimTime,
          status: 'success',
          source: wallet.address,
          operation: 'vote',
          parameters: { candidate_id: candidateId, voter: wallet.address },
          events: [contractEvent],
          feePaid: fee,
          cpuInstructions: 135402,
          ramBytes: 4320
        };

        this.state.transactions.unshift(tx);
        this.state.events.unshift(contractEvent);
        this.saveState();
        resolve(true);
      }, 1200); // realistic Soroban ledger lag
    });
  }

  // Update Voting Window Config
  public updateVotingConfig(title: string, startTime: number, endTime: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const wallet = this.getConnectedWallet();
      if (!wallet) return reject(new Error("Wallet must be connected"));
      if (wallet.address !== this.state.config.admin) {
        return reject(new Error("Unauthorized: Only the contract Admin can update configuration settings."));
      }

      this.state.config.title = title;
      this.state.config.startTime = startTime;
      this.state.config.endTime = endTime;

      const currentSimTime = this.getSimulatedTime();
      // Emit config changed event
      const eventId = "evt_" + generateHash(16);
      const contractEvent: SorobanEvent = {
        id: eventId,
        contractId: "CCVOTINGDAPP2026777777777777777777777777777777777777777777",
        topics: ["config_updated", wallet.address],
        data: JSON.stringify({ title, startTime, endTime }),
        timestamp: currentSimTime
      };

      const tx: Transaction = {
        hash: "tx_" + generateHash(60),
        ledger: this.state.currentLedger,
        timestamp: currentSimTime,
        status: 'success',
        source: wallet.address,
        operation: 'update_config',
        parameters: { title, startTime, endTime },
        events: [contractEvent],
        feePaid: 0.1,
        cpuInstructions: 95400,
        ramBytes: 3100
      };

      this.state.transactions.unshift(tx);
      this.state.events.unshift(contractEvent);
      this.saveState();
      resolve(true);
    });
  }

  public resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadState();
    this.saveState();
  }
}

export const sorobanSimulator = new SorobanSimulator();
export default sorobanSimulator;
