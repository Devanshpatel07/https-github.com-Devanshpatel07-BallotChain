#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Vec};

#[contracttype]
pub enum DataKey {
    Owner,
    Votes,
    Voters,
    Candidates,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn init(env: Env, owner: Address) {
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage()
            .instance()
            .set(&DataKey::Votes, &Map::<String, u32>::new(&env));
        env.storage()
            .instance()
            .set(&DataKey::Voters, &Map::<Address, bool>::new(&env));
        env.storage()
            .instance()
            .set(&DataKey::Candidates, &Vec::<String>::new(&env));
    }

    pub fn add_candidate(env: Env, caller: Address, candidate: String) {
        caller.require_auth();
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        assert!(caller == owner, "only owner can add candidates");

        let mut candidates: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::Candidates)
            .unwrap();
        assert!(!candidates.contains(&candidate), "candidate already exists");
        candidates.push_back(candidate);
        env.storage()
            .instance()
            .set(&DataKey::Candidates, &candidates);
    }

    pub fn vote(env: Env, voter: Address, candidate: String) {
        voter.require_auth();
        let mut voters: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&DataKey::Voters)
            .unwrap();
        assert!(
            !voters.get(voter.clone()).unwrap_or(false),
            "already voted"
        );

        let candidates: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::Candidates)
            .unwrap();
        assert!(candidates.contains(&candidate), "unknown candidate");

        let mut votes: Map<String, u32> = env
            .storage()
            .instance()
            .get(&DataKey::Votes)
            .unwrap();
        let count = votes.get(candidate.clone()).unwrap_or(0);
        votes.set(candidate, count + 1);
        voters.set(voter, true);

        env.storage().instance().set(&DataKey::Votes, &votes);
        env.storage().instance().set(&DataKey::Voters, &voters);
    }

    pub fn get_votes(env: Env, candidate: String) -> u32 {
        let votes: Map<String, u32> = env
            .storage()
            .instance()
            .get(&DataKey::Votes)
            .unwrap();
        votes.get(candidate).unwrap_or(0)
    }

    pub fn get_candidates(env: Env) -> Vec<String> {
        env.storage()
            .instance()
            .get(&DataKey::Candidates)
            .unwrap()
    }

    pub fn get_voters(env: Env) -> Vec<Address> {
        let voters: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&DataKey::Voters)
            .unwrap();
        voters.keys()
    }

    pub fn get_owner(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Owner).unwrap()
    }
}

mod test;
