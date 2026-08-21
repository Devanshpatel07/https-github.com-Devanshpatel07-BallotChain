#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, Map, String, Vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    VotingContract,
    CandidateCount,
    Candidates,       // Map<u32, Candidate>
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
pub struct RegistryContract;

#[contractimpl]
impl RegistryContract {
    pub fn initialize(env: Env, admin: Address, voting_contract: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Registry contract is already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VotingContract, &voting_contract);
        env.storage().instance().set(&DataKey::CandidateCount, &0u32);
        
        let candidates_map: Map<u32, Candidate> = Map::new(&env);
        env.storage().instance().set(&DataKey::Candidates, &candidates_map);
    }

    pub fn register(
        env: Env,
        name: String,
        description: String,
        registered_by: Address,
        registered_at: u64,
    ) -> u32 {
        if !env.storage().instance().has(&DataKey::Admin) {
            panic!("Registry contract is not initialized");
        }

        // Verify that the caller is the authorized voting contract
        let voting_contract: Address = env.storage().instance().get(&DataKey::VotingContract).unwrap();
        voting_contract.require_auth();

        let mut count: u32 = env.storage().instance().get(&DataKey::CandidateCount).unwrap_or(0);
        count += 1;

        let candidate = Candidate {
            id: count,
            name,
            description,
            votes: 0,
            registered_by,
            registered_at,
        };

        let mut candidates: Map<u32, Candidate> = env
            .storage()
            .instance()
            .get(&DataKey::Candidates)
            .unwrap();
            
        candidates.set(count, candidate);
        env.storage().instance().set(&DataKey::Candidates, &candidates);
        env.storage().instance().set(&DataKey::CandidateCount, &count);

        count
    }

    pub fn increment_votes(env: Env, candidate_id: u32) {
        if !env.storage().instance().has(&DataKey::Admin) {
            panic!("Registry contract is not initialized");
        }

        // Verify that the caller is the authorized voting contract
        let voting_contract: Address = env.storage().instance().get(&DataKey::VotingContract).unwrap();
        voting_contract.require_auth();

        let mut candidates: Map<u32, Candidate> = env
            .storage()
            .instance()
            .get(&DataKey::Candidates)
            .unwrap();

        if !candidates.contains_key(candidate_id) {
            panic!("Candidate ID does not exist");
        }

        let mut candidate = candidates.get(candidate_id).unwrap();
        candidate.votes += 1;
        candidates.set(candidate_id, candidate);
        env.storage().instance().set(&DataKey::Candidates, &candidates);
    }

    pub fn get_candidates(env: Env) -> Vec<Candidate> {
        if !env.storage().instance().has(&DataKey::Candidates) {
            return Vec::new(&env);
        }
        let candidates_map: Map<u32, Candidate> = env
            .storage()
            .instance()
            .get(&DataKey::Candidates)
            .unwrap();

        let mut result = Vec::new(&env);
        for item in candidates_map.values() {
            result.push_back(item);
        }
        result
    }
}
