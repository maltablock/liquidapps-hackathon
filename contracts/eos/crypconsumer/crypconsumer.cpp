#include "../dappservices/cryp.hpp"

#define DAPPSERVICES_ACTIONS()                                                 \
  XSIGNAL_DAPPSERVICE_ACTION                                                   \
  CRYP_DAPPSERVICE_ACTIONS

#define DAPPSERVICE_ACTIONS_COMMANDS() CRYP_SVC_COMMANDS()

#define CONTRACT_NAME() crypconsumer


inline std::vector<std::string> parse_vote_message(const std::string& memo) {
  std::vector<std::string> results;
  auto end = memo.cend();
  auto start = memo.cbegin();

  for (auto it = memo.cbegin(); it != end; ++it) {
    if (*it == '-') {
      results.emplace_back(start, it);
      start = it + 1;
    }
  }
  if (start != end) results.emplace_back(start, end);

  return results;
}

CONTRACT_START()

TABLE bsign_entry {
  name request_id;
  std::vector<char> blinded_message;
  std::vector<char> blind_signature;
  uint64_t primary_key() const { return request_id.value; }
};
typedef eosio::multi_index<"bsign"_n, bsign_entry> bsign_entries_t;

TABLE rsa_params {
  uint64_t id;
  std::vector<char> N;
  uint64_t e;
  std::vector<char> secret_key_encrypted_to_dsp;
  uint64_t primary_key() const { return id; }
};
typedef eosio::multi_index<"rsaparams"_n, rsa_params> rsa_params_t;

ACTION setrsaparams(const std::vector<char> &N, uint64_t e,
                    const std::vector<char> &secret_key_encrypted_to_dsp) {
  require_auth(get_self());

  rsa_params_t rsa_params(get_self(), get_self().value);
  auto itr = rsa_params.find(0);
  if (itr == rsa_params.end()) {
    rsa_params.emplace(get_self(), [&](auto &params) {
      params.id = 0;
      params.N = N;
      params.e = e;
      params.secret_key_encrypted_to_dsp = secret_key_encrypted_to_dsp;
    });
  } else {
    rsa_params.modify(itr, get_self(), [&](auto &params) {
      params.N = N;
      params.e = e;
      params.secret_key_encrypted_to_dsp = secret_key_encrypted_to_dsp;
    });
  }
}

TABLE poll {
  name poll_name;
  std::vector<name> eligible_voters;

  uint64_t primary_key() const { return poll_name.value; }
};
typedef eosio::multi_index<"polls"_n, poll> polls_t;

// scope is poll_name
TABLE has_voted_s {
  name user;

  uint64_t primary_key() const { return user.value; }
};
typedef eosio::multi_index<"hasvoted"_n, has_voted_s> has_voted_t;

// scope is poll_name
TABLE vote_s {
  uint64_t id;
  std::string description;
  uint64_t num_votes = 0;

  uint64_t primary_key() const { return id; }
};
typedef eosio::multi_index<"votes"_n, vote_s> votes_t;
ACTION createpoll(name poll_name, const std::vector<std::string> &options,
                  const std::vector<name> &eligible_voters) {
  require_auth(get_self());

  polls_t polls(get_self(), get_self().value);
  auto itr = polls.find(poll_name.value);
  check(itr == polls.end(), "poll already exists");

  polls.emplace(get_self(), [&](auto &p) {
    p.poll_name = poll_name;
    p.eligible_voters = eligible_voters;
  });

  votes_t votes(get_self(), poll_name.value);
  for(auto& option : options) {
    votes.emplace(get_self(), [&](auto &entry) {
      entry.id = votes.available_primary_key();
      entry.description = option;
    });
  }
}

struct bsign_get_signature_input {
  name request_id;
  std::vector<char> secret_key_encrypted;
  std::vector<char> blinded_message;
};
struct bsign_get_signature_result {
  std::vector<char> blind_signature;
};
static void bsign_get_signature(const bsign_get_signature_input &input) {
  // eosio::print("\nbefore call_cryp_fn\n");
  auto res = call_cryp_fn<bsign_get_signature_result>(
      name("bsigngetsign"), pack(input), [&](auto &results) {
        eosio::print("\nin combinator\n");
        eosio::check(results.size() > 0, "not enough results");
        eosio::check(results[0].result.size() > 0, "not enough results1");
        eosio::print("\nend combinator\n");
        return results[0].result;
      });
  // eosio::print("\nafter call_cryp_fn\n");

  auto _self = name(current_receiver());
  bsign_entries_t entries(_self, _self.value);
  // eosio::print("\nbefore emplace call_cryp_fn\n");
  entries.emplace(_self, [&](auto &e) {
    e.request_id = input.request_id;
    e.blinded_message = input.blinded_message;
    e.blind_signature = res.blind_signature;
  });
  // eosio::print("\nafter emplace call_cryp_fn\n");
};

struct bsign_verify_signature_input {
  std::vector<char> N;
  uint64_t e;
  std::string message;
  std::vector<char> signature;
};
struct bsign_verify_signature_result {
  uint64_t is_valid;
};
static bool bsign_verify_signature(const bsign_verify_signature_input &input) {
  // eosio::print("\nbefore call_cryp_fn\n");
  auto res = call_cryp_fn<bsign_verify_signature_result>(
      name("bsignverify"), pack(input), [&](auto &results) {
        eosio::check(results.size() > 0, "not enough results");
        eosio::check(results[0].result.size() > 0, "not enough results1");
        return results[0].result;
      });

  return res.is_valid;
};

ACTION requestvote(name user, name for_poll_name, const std::vector<char> &blinded_message) {
  require_auth(user);

  rsa_params_t rsa_params(get_self(), get_self().value);
  auto itr = rsa_params.find(0);
  check(itr != rsa_params.end(), "need to call rsasetparams first");

  // check if user already requested a vote before
  // TODO: this contains a bug where users can vote for any poll instead of the one they claim
  // because we cannot check if the unblinded message actually contains the poll they submit here
  // FIX: each poll has its own different rsa params, or allow only one active poll at a time
  has_voted_t has_voted(get_self(), for_poll_name.value);
  check(has_voted.find(user.value) == has_voted.end(), "user already requested a signature for this vote");

  bsign_get_signature_input input;
  input.request_id = user;
  input.secret_key_encrypted = itr->secret_key_encrypted_to_dsp;
  input.blinded_message = blinded_message;
  bsign_get_signature(input);

  has_voted.emplace(get_self(), [&](auto &p) {
    p.user = user;
  });
}

ACTION countvote(const std::string &vote_message,
                 const std::vector<char> &signature) {
  // no require_auth, anyone can submit a vote as long as it's a fresh valid
  // signature important to hide initial user for anonymity
  rsa_params_t rsa_params(get_self(), get_self().value);
  auto itr = rsa_params.find(0);
  check(itr != rsa_params.end(), "need to call rsasetparams first");

  bsign_verify_signature_input input;
  input.N = itr->N;
  input.e = itr->e;
  input.message = vote_message;
  input.signature = signature;
  auto is_valid = bsign_verify_signature(input);
  check(is_valid, "invalid signature provided");

  vector<string> parsed_vote = parse_vote_message(vote_message);
  check(parsed_vote.size() >= 2, "invalid vote message structure");
  name poll_name = name(parsed_vote[0]);
  uint64_t vote_id = stoull(parsed_vote[1]);

  eosio::print("voted for ", parsed_vote[0], parsed_vote[1]);

  votes_t votes(get_self(), poll_name.value);
  auto vote_itr = votes.find(vote_id);
  check(vote_itr != votes.end(), "poll or vote option does not exist");

  votes.modify(vote_itr, eosio::same_payer, [&](auto &v) {
    v.num_votes += 1;
  });
}

CONTRACT_END((setrsaparams)(createpoll)(requestvote)(countvote))
