#include "../dappservices/cryp.hpp"

#define DAPPSERVICES_ACTIONS()                                                 \
  XSIGNAL_DAPPSERVICE_ACTION                                                   \
  CRYP_DAPPSERVICE_ACTIONS

#define DAPPSERVICE_ACTIONS_COMMANDS() CRYP_SVC_COMMANDS()

#define CONTRACT_NAME() crypconsumer

struct input_t {
  uint32_t a;
  uint32_t b;
};
struct result_t {
  input_t input;
  uint32_t output;
  uint32_t output_a_denom;
  uint32_t output_b_denom;
};

CONTRACT_START()

static void ecc_blind_verify(std::vector<char> uri){
    SEND_SVC_REQUEST(vrunclean, uri)};

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

ACTION blindsignreq(name user, const std::vector<char> &blinded_message) {
  require_auth(user);

  rsa_params_t rsa_params(get_self(), get_self().value);
  auto itr = rsa_params.find(0);
  check(itr != rsa_params.end(), "need to call rsasetparams first");

  bsign_get_signature_input input;
  input.request_id = user;
  input.secret_key_encrypted = itr->secret_key_encrypted_to_dsp;
  input.blinded_message = blinded_message;
  bsign_get_signature(input);
}

CONTRACT_END((setrsaparams)(blindsignreq))
