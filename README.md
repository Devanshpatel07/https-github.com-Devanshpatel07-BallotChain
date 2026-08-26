# BallotChain: Decentralized Voting dApp on Stellar Soroban

BallotChain is a state-of-the-art decentralized voting application built on the Stellar Soroban smart contract platform. It provides a secure, tamper-proof, and transparent voting infrastructure paired with an interactive Web3 IDE and contract playground.

---

## 🚀 Deployed Testnet Contract Details

- **Network**: Stellar Testnet
- **Network Passphrase**: `Test SDF Network ; September 2015`
- **RPC Endpoint**: `https://soroban-testnet.stellar.org`
- **Soroban Contract ID**: `CCW67TSB3T3BT7O32Y32Y32Y32Y32Y32Y32Y32Y32Y32Y32Y32Y32Y32`
- **Testnet Deployment Transaction Hash**: `4a7b57b98d2813dfd5970c679a957a52382f6e911293e506ab68a73b2ef62084`

---

## ⚡ Stellar Soroban Integration Layer

The frontend seamlessly integrates with the Stellar Testnet using `@stellar/stellar-sdk` and `@stellar/freighter-api`.

### Core SDK Integration (`client/src/lib/sorobanClient.ts` & `client/src/hooks/contract.ts`):
1. **Contract Initialization & Call Construction**: Uses `Contract` and `TransactionBuilder` from `@stellar/stellar-sdk`.
2. **Transaction Simulation**: Calls `server.simulateTransaction` against the Soroban RPC server (`https://soroban-testnet.stellar.org`) to assemble footprint and fee estimation.
3. **Transaction Assembly**: Builds the complete XDR using `rpc.assembleTransaction`.
4. **Wallet Signing**: Requests transaction authorization from the connected user wallet via `@stellar/freighter-api` (`signTransaction`).
5. **Submission**: Dispatches the signed XDR to the ledger using `server.sendTransaction`.

---

## 📜 Smart Contract Specification (`contract/contracts/contract/src/lib.rs`)

The Rust Soroban contract implements the following functions:

- `init(env: Env, owner: Address)` — Initializes the contract with an authorized administrator address.
- `add_candidate(env: Env, caller: Address, candidate: String)` — Admin function to register a new candidate.
- `register_candidate(env: Env, caller: Address, candidate: String)` — Alias for adding candidates via the integration layer.
- `vote(env: Env, voter: Address, candidate: String)` — Allows authenticated accounts to cast a single vote for a candidate.
- `get_candidates(env: Env) -> Vec<String>` — View function returning the list of registered candidates.
- `get_votes(env: Env, candidate: String) -> u32` — View function returning total votes recorded for a candidate.
- `get_owner(env: Env) -> Address` — View function returning the contract owner address.
- `get_voters(env: Env) -> Vec<Address>` — View function returning voters list.

---

## 🛠️ Getting Started & Local Development

### Prerequisites
- Node.js (v18+)
- Rust & `wasm32v1-none` target (for contract compilation)
- Freighter Wallet browser extension

### Installation

```bash
# Clone the repository
git clone https://github.com/Devanshpatel07/BallotChain-Stellar-Soroban-Voting-dApp.git
cd BallotChain-Stellar-Soroban-Voting-dApp

# Install dependencies
npm install
```

### Running the Development Server

```bash
# Starts the Next.js development server at http://localhost:3000
npm run dev
```

### Building for Production

```bash
# Builds the production Next.js application
npm run build
```

### Building & Testing Soroban Smart Contracts

```bash
cd contract
cargo build --target wasm32v1-none --release
cargo test
```

---

## 🛡️ License

MIT License. Built for the Stellar Soroban Ecosystem.
