#![cfg(test)]
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
fn test_add_candidate() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    client.init(&owner);

    client.add_candidate(&owner, &String::from_str(&env, "Alice"));
    client.add_candidate(&owner, &String::from_str(&env, "Bob"));

    let candidates = client.get_candidates();
    assert_eq!(candidates.len(), 2);
    assert_eq!(candidates.get_unchecked(0), String::from_str(&env, "Alice"));
    assert_eq!(candidates.get_unchecked(1), String::from_str(&env, "Bob"));
}

#[test]
#[should_panic(expected = "only owner can add candidates")]
fn test_add_candidate_not_owner() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let other = Address::generate(&env);
    client.init(&owner);

    client.add_candidate(&other, &String::from_str(&env, "Alice"));
}

#[test]
#[should_panic(expected = "candidate already exists")]
fn test_add_candidate_duplicate() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    client.init(&owner);

    client.add_candidate(&owner, &String::from_str(&env, "Alice"));
    client.add_candidate(&owner, &String::from_str(&env, "Alice"));
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

    assert_eq!(
        client.get_votes(&String::from_str(&env, "Alice")),
        1
    );
}

#[test]
fn test_multiple_votes() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    client.init(&owner);
    client.add_candidate(&owner, &String::from_str(&env, "Alice"));
    client.add_candidate(&owner, &String::from_str(&env, "Bob"));

    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    let voter3 = Address::generate(&env);

    client.vote(&voter1, &String::from_str(&env, "Alice"));
    client.vote(&voter2, &String::from_str(&env, "Bob"));
    client.vote(&voter3, &String::from_str(&env, "Alice"));

    assert_eq!(
        client.get_votes(&String::from_str(&env, "Alice")),
        2
    );
    assert_eq!(
        client.get_votes(&String::from_str(&env, "Bob")),
        1
    );
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
}

#[test]
#[should_panic(expected = "unknown candidate")]
fn test_vote_unknown_candidate() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    client.init(&owner);

    let voter = Address::generate(&env);
    client.vote(&voter, &String::from_str(&env, "Ghost"));
}

#[test]
fn test_get_voters() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    client.init(&owner);
    client.add_candidate(&owner, &String::from_str(&env, "Alice"));

    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    client.vote(&voter1, &String::from_str(&env, "Alice"));
    client.vote(&voter2, &String::from_str(&env, "Alice"));

    let voters = client.get_voters();
    assert_eq!(voters.len(), 2);
}
