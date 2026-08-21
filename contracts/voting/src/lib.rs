#![no_std]
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

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VotingState {
    pub title: String,
    pub start_time: u64,
    pub end_time: u64,
    pub admin: Address,
    pub registry: Address,
    pub total_candidates: u32,
}

#[contract]
pub struct VotingContract;

#[contractimpl]
impl VotingContract {
    /// Initialize the voting contract with a title, administrator, registry, and active time-bound window
    pub fn initialize(
        env: Env,
        admin: Address,
        registry: Address,
        title: String,
        start_time: u64,
        end_time: u64,
    ) {
        // Prevent double initialization
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

        // Emit initialization event
        env.events().publish(
            (symbol_short!("init"), admin.clone()),
            (title, registry, start_time, end_time),
        );
    }

    /// Register a new voting candidate. Only active before voting window closes.
    pub fn register_candidate(
        env: Env,
        caller: Address,
        name: String,
        description: String,
    ) -> u32 {
        caller.require_auth();

        // Check if contract is initialized
        if !env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract is not initialized");
        }

        // Validate time window: Candidates can only be registered before voting ends
        let current_time = env.ledger().timestamp();
        let end_time: u64 = env.storage().instance().get(&DataKey::EndTime).unwrap();
        if current_time >= end_time {
            panic!("Candidate registration is closed because the voting window has ended");
        }

        let registry: Address = env.storage().instance().get(&DataKey::Registry).unwrap();

        // Cross-Contract Call: Invoke register method on the Registry Contract
        let count: u32 = env.invoke_contract(
            &registry,
            &Symbol::new(&env, "register"),
            soroban_sdk::vec![
                &env,
                name.clone().into_val(&env),
                description.clone().into_val(&env),
                caller.clone().into_val(&env),
                current_time.into_val(&env),
            ],
        );

        // Emit candidate registration event
        env.events().publish(
            (Symbol::new(&env, "register_candidate"), caller, count),
            name,
        );

        count
    }

    /// Cast a single vote for a specific candidate. Checks wallet vote status and active window.
    pub fn vote(env: Env, voter: Address, candidate_id: u32) {
        voter.require_auth();

        // 1. Verify contract initialization
        if !env.storage().instance().has(&DataKey::Admin) {
            panic!("Contract is not initialized");
        }

        // 2. Check if voter has already voted (One vote per wallet)
        let voted_key = DataKey::Voted(voter.clone());
        if env.storage().persistent().has(&voted_key) {
            panic!("Wallet has already cast a vote");
        }

        // 3. Verify voting window bounds
        let current_time = env.ledger().timestamp();
        let start_time: u64 = env.storage().instance().get(&DataKey::StartTime).unwrap();
        let end_time: u64 = env.storage().instance().get(&DataKey::EndTime).unwrap();

        if current_time < start_time {
            panic!("Voting has not started yet");
        }
        if current_time > end_time {
            panic!("Voting has ended");
        }

        let registry: Address = env.storage().instance().get(&DataKey::Registry).unwrap();

        // Cross-Contract Call: Invoke increment_votes method on the Registry Contract
        env.invoke_contract::<()>(
            &registry,
            &Symbol::new(&env, "increment_votes"),
            soroban_sdk::vec![&env, candidate_id.into_val(&env)],
        );
        
        // Mark voter as voted
        env.storage().persistent().set(&voted_key, &true);

        // Emit vote event
        env.events().publish(
            (Symbol::new(&env, "vote_cast"), voter, candidate_id),
            current_time,
        );
    }

    /// Retrieve the live list of candidates and their vote counts
    pub fn get_candidates(env: Env) -> Vec<Candidate> {
        if !env.storage().instance().has(&DataKey::Registry) {
            return Vec::new(&env);
        }
        
        let registry: Address = env.storage().instance().get(&DataKey::Registry).unwrap();

        // Cross-Contract Call: Invoke get_candidates method on the Registry Contract
        env.invoke_contract::<Vec<Candidate>>(
            &registry,
            &Symbol::new(&env, "get_candidates"),
            soroban_sdk::vec![&env],
        )
    }

    /// Check if a specific address has already voted
    pub fn has_voted(env: Env, voter: Address) -> bool {
        let voted_key = DataKey::Voted(voter);
        env.storage().persistent().has(&voted_key)
    }

    /// Get current state of the contract (Timebounds, Admin, Count)
    pub fn get_state(env: Env) -> VotingState {
        let title: String = env.storage().instance().get(&DataKey::Title).unwrap_or(String::from_str(&env, ""));
        let start_time: u64 = env.storage().instance().get(&DataKey::StartTime).unwrap_or(0);
        let end_time: u64 = env.storage().instance().get(&DataKey::EndTime).unwrap_or(0);
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        let registry: Address = env.storage().instance().get(&DataKey::Registry).unwrap();

        let candidates = Self::get_candidates(env.clone());
        let total_candidates = candidates.len();

        VotingState {
            title,
            start_time,
            end_time,
            admin,
            registry,
            total_candidates,
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{
        Env, Address, testutils::{Address as _, Ledger}, vec,
    };
    use registry_contract::{RegistryContract, RegistryContractClient};

    fn setup_test(env: &Env) -> (Address, Address, VotingContractClient<'static>, RegistryContractClient<'static>) {
        env.mock_all_auths();
        
        let admin = Address::generate(env);
        let registry_id = env.register_contract(None, RegistryContract);
        let voting_id = env.register_contract(None, VotingContract);

        let registry_client = RegistryContractClient::new(env, &registry_id);
        let voting_client = VotingContractClient::new(env, &voting_id);

        registry_client.initialize(&admin, &voting_id);
        
        (admin, registry_id, voting_client, registry_client)
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let (admin, registry_id, voting_client, _) = setup_test(&env);

        let start_time = 1000u64;
        let end_time = 2000u64;
        let title = String::from_str(&env, "Community Governance Ballot");

        voting_client.initialize(&admin, &registry_id, &title, &start_time, &end_time);

        let state = voting_client.get_state();
        assert_eq!(state.title, title);
        assert_eq!(state.admin, admin);
        assert_eq!(state.start_time, start_time);
        assert_eq!(state.end_time, end_time);
        assert_eq!(state.registry, registry_id);
        assert_eq!(state.total_candidates, 0);
    }

    #[test]
    fn test_register_candidate() {
        let env = Env::default();
        let (admin, registry_id, voting_client, registry_client) = setup_test(&env);

        let start_time = 1000u64;
        let end_time = 2000u64;
        let title = String::from_str(&env, "Election");

        voting_client.initialize(&admin, &registry_id, &title, &start_time, &end_time);

        assert_eq!(registry_client.get_candidates().len(), 0);

        let caller = Address::generate(&env);
        let cand_name = String::from_str(&env, "EcoStellar SNS");
        let cand_desc = String::from_str(&env, "Smart green oracle");

        // Set block time before end_time
        env.ledger().set(soroban_sdk::testutils::LedgerInfo {
            timestamp: 1500,
            protocol_version: 21,
            sequence_number: 100,
            network_id: [0; 32],
            base_reserve: 10,
        });

        let cand_id = voting_client.register_candidate(&caller, &cand_name, &cand_desc);
        assert_eq!(cand_id, 1);

        let candidates = registry_client.get_candidates();
        assert_eq!(candidates.len(), 1);
        let candidate = candidates.get(0).unwrap();
        assert_eq!(candidate.id, 1);
        assert_eq!(candidate.name, cand_name);
        assert_eq!(candidate.votes, 0);
        assert_eq!(candidate.registered_by, caller);
    }

    #[test]
    fn test_cast_single_vote() {
        let env = Env::default();
        let (admin, registry_id, voting_client, registry_client) = setup_test(&env);

        let start_time = 1000u64;
        let end_time = 2000u64;
        voting_client.initialize(&admin, &registry_id, &String::from_str(&env, "Election"), &start_time, &end_time);

        let caller = Address::generate(&env);
        
        env.ledger().set(soroban_sdk::testutils::LedgerInfo {
            timestamp: 1200,
            protocol_version: 21,
            sequence_number: 100,
            network_id: [0; 32],
            base_reserve: 10,
        });

        voting_client.register_candidate(&caller, &String::from_str(&env, "Eco"), &String::from_str(&env, "Desc"));

        let voter = Address::generate(&env);
        voting_client.vote(&voter, &1);

        assert!(voting_client.has_voted(&voter));
        let candidates = registry_client.get_candidates();
        let cand = candidates.get(0).unwrap();
        assert_eq!(cand.votes, 1);
    }

    #[test]
    #[should_panic(expected = "Wallet has already cast a vote")]
    fn test_prevent_double_voting() {
        let env = Env::default();
        let (admin, registry_id, voting_client, _) = setup_test(&env);
        voting_client.initialize(&admin, &registry_id, &String::from_str(&env, "Election"), &1000u64, &2000u64);

        let caller = Address::generate(&env);
        env.ledger().set(soroban_sdk::testutils::LedgerInfo {
            timestamp: 1200,
            protocol_version: 21,
            sequence_number: 100,
            network_id: [0; 32],
            base_reserve: 10,
        });

        voting_client.register_candidate(&caller, &String::from_str(&env, "Eco"), &String::from_str(&env, "Desc"));

        let voter = Address::generate(&env);
        voting_client.vote(&voter, &1);
        
        // This second vote should panic
        voting_client.vote(&voter, &1);
    }

    #[test]
    #[should_panic(expected = "Voting has ended")]
    fn test_voting_window_timebounds() {
        let env = Env::default();
        let (admin, registry_id, voting_client, _) = setup_test(&env);
        voting_client.initialize(&admin, &registry_id, &String::from_str(&env, "Election"), &1000u64, &2000u64);

        let caller = Address::generate(&env);
        // Set timestamp inside window to register
        env.ledger().set(soroban_sdk::testutils::LedgerInfo {
            timestamp: 1200,
            protocol_version: 21,
            sequence_number: 100,
            network_id: [0; 32],
            base_reserve: 10,
        });

        voting_client.register_candidate(&caller, &String::from_str(&env, "Eco"), &String::from_str(&env, "Desc"));

        // Warp block time to 2100 (after voting ended)
        env.ledger().set(soroban_sdk::testutils::LedgerInfo {
            timestamp: 2100,
            protocol_version: 21,
            sequence_number: 100,
            network_id: [0; 32],
            base_reserve: 10,
        });

        let voter = Address::generate(&env);
        voting_client.vote(&voter, &1);
    }

    #[test]
    #[should_panic]
    fn test_unauthorized_registration_rejection() {
        let test_env = Env::default();
        let admin = Address::generate(&test_env);
        let registry_id = test_env.register_contract(None, RegistryContract);
        let registry_client = RegistryContractClient::new(&test_env, &registry_id);
        
        let dummy_voting = Address::generate(&test_env);
        registry_client.initialize(&admin, &dummy_voting);

        let user = Address::generate(&test_env);
        // Direct unauthorized registration should fail require_auth check
        registry_client.register(&String::from_str(&test_env, "Test"), &String::from_str(&test_env, "Test"), &user, &1200u64);
    }
}
