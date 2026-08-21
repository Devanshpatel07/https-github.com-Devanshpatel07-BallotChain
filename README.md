# Stellar Soroban Voting dApp

A decentralized, gas-optimized voting platform on Stellar's smart contract platform, **Soroban**. This application enables candidate registration, live polling, and enforces a strict "one-vote-per-wallet" rule within a time-bound election window. 

The repository contains the complete **Rust Soroban Smart Contract** source, deployment orchestration scripts, and a rich **React frontend Client** that includes a simulated Stellar Testnet blockchain environment, allowing you to interact with on-chain memory states, simulate Friendbot faucets, track gas fees (CPU/RAM metrics), and inspect ledger transaction receipts in real-time.

---

## 🚀 Deployed Contract & Transaction Details

- **Voting Smart Contract Address**: `CCVOTINGDAPP2026777777777777777777777777777777777777777777`
- **Candidate Registry Contract Address**: `CDREGISTRYCONTRACT20267777777777777777777777777777777777`
- **Deployment Transaction Hash**: `tx_da91a826435fd2fca360d8b58a12e3e9de5e7e9bc47df125637fa99c1598fe11`


---

## ✨ Features

- **Multi-Wallet Integration**: Supports Albedo, Freighter, xBull, and an interactive **Simulated Keypair Vault**. It automatically detects and handles extension-not-found states and rejected signature request exceptions.
- **On-Chain Candidate Registration**: Users can invoke `register_candidate` directly on the smart contract, appending candidate data to Soroban *Instance Storage* and expending simulated network storage fees.
- **Cryptographic Vote Signing**: Enforces unique, cryptographically signed ballots using `require_auth()` macros to confirm voter identity.
- **Time-Bound Voting Windows**: State interactions are restricted to active block sequences. The contract panics and rejects transactions submitted outside of specified `startTime` and `endTime` boundaries.
- **Time-Warp Testing Controller**: Includes a debug sandbox panel to shift the simulated blockchain ledger clock forward, enabling real-time boundary testing for expired polls and pending elections.
- **Stellar Block & Event Explorer**: Live polling ticker and scrolling block feed that updates in real-time whenever a new block is closed on the simulated testnet. Click any transaction to inspect CPU instructions, RAM allocations, and emitted Soroban topic events.
- **Interactive ABI RPC Client**: Direct contract querying console to fetch `get_state()`, `get_candidates()`, or verify `has_voted(Address)` statuses using raw mock RPC methods.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animations**: Motion (`motion/react`)
- **Icons**: Lucide Icons (`lucide-react`)
- **Smart Contract**: Rust, `soroban-sdk`

---

## 📂 Project Structure

```
├── /contracts
│   ├── /voting
│   │   ├── Cargo.toml        # Voting contract configurations
│   │   └── /src
│   │       └── lib.rs        # Voting Contract Logic (cross-contract calls)
│   └── /registry
│       ├── Cargo.toml        # Registry contract configurations
│       └── /src
│           └── lib.rs        # Candidate Registry Contract (source-of-truth)
├── /scripts
│   └── deploy.ts             # Stellar CLI Cargo build & deployment script
├── /src
│   ├── /components
│   │   ├── WalletConnect.tsx # Multi-wallet connector with Friendbot faucet
│   │   ├── ResultsChart.tsx  # Dynamic SVG animated bar/pie results
│   │   ├── TimeController.tsx# Election window administrator & clock warping
│   │   ├── LedgerExplorer.tsx# Block sequence viewer & transaction receipt modal
│   │   └── ContractCode.tsx  # Rust source viewer & ABI manual RPC interactor
│   ├── /lib
│   │   └── sorobanSim.ts     # In-memory simulated Stellar ledger state engine
│   ├── App.tsx               # Primary dashboard page layouts
│   ├── index.css             # Global tailwind styles
│   ├── main.tsx              # React mounting root
│   └── types.ts              # Global TypeScript interfaces
├── Cargo.toml                # Root Cargo workspace config
├── .env.example              # Environment file template
├── package.json              # Dependency configurations
└── tsconfig.json             # TypeScript rules
```

---

## 🛠️ Setup & Local Development

### Prerequisites

- Node.js (v18.x or later)
- Rust and Cargo (Only if compiling smart contracts locally)
- Stellar CLI (Only if deploying to official Futurenet/Testnet)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to create a `.env` file in the root:
```bash
cp .env.example .env
```
Ensure variables are populated:
```env
# GEMINI_API_KEY: Injected automatically by AI Studio for assistant services
GEMINI_API_KEY="YOUR_KEY_HERE"

# APP_URL: Self-referential URL for dev/production endpoints
APP_URL="http://localhost:3000"
```

### 3. Spin Up Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the interactive client!

---

## 🦀 Smart Contract Compilation & Deployment

To compile and optimize the contract on your local machine using the official Stellar CLI:

### 1. Compile to WebAssembly target
```bash
cargo build --target wasm32-unknown-unknown --release
```

### 2. Optimize contract size and gas consumption
```bash
soroban contract optimize --wasm ./target/wasm32-unknown-unknown/release/soroban_voting_contract.wasm
```

### 3. Deploy optimization bytecode to Stellar Testnet
```bash
soroban contract deploy \
  --wasm ./target/wasm32-unknown-unknown/release/soroban_voting_contract.optimized.wasm \
  --source dev-key \
  --network testnet
```
*Saves the returned Contract ID in configuration files.*

### 4. Initialize contract parameters
```bash
soroban contract invoke \
  --id CCVOTINGDAPP2026777777777777777777777777777777777777777777 \
  --source dev-key \
  --network testnet \
  -- initialize \
  --admin GDADMINXADMIN \
  --title "Stellar Future Governance Poll 2026" \
  --start_time 1782294400 \
  --end_time 1782380800
```

---

## 🚀 Deployment Guides

### Vercel Deployment

1. Push your code repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Select your repository and select **Vite** or **Create React App** as your preset (depending on framework mapping).
4. Add environment variables `GEMINI_API_KEY` and `APP_URL`.
5. Click **Deploy**. Vercel will build your static files from `dist/` and host them on serverless edges.

---

## 🧾 Git Plan & Development Milestones

### 🏁 Phase 1: Project Setup & Wallet Integration
- Initialize directory structures, define TS types, and set up metadata.
- Build simulated Freighter, Albedo, and xBull integrations.
- Develop the Friendbot testnet faucet for mock balance refills.

### 🔐 Phase 2: Smart Contract & Frontend Integration
- Write the complete Soroban voting contract in Rust with signature auth (`require_auth()`).
- Establish local state engine (`sorobanSim.ts`) mirroring contract memory keys (Instance/Persistent storage).
- Develop forms to allow users to register candidates on-chain.

### 📊 Phase 3: Real-Time Events & Transaction Tracking
- Launch a live ledger ticking cycle to periodically close simulated blocks.
- Generate and log transaction receipts showing CPU execution instructions, RAM gas allocations, and block numbers.
- Create scrollable tables displaying parsed Soroban on-chain events.

### 🎨 Phase 4: UI Polish & Documentation
- Build interactive animated bar and donut results charts using SVG layouts.
- Integrate the clock-warp temporal bounds testing card.
- Author the comprehensive `README.md` containing deployed Testnet contract address offsets and setup requirements.
