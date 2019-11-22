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

TABLE ecc_blind_sign_entries {
  uint64_t request_id;
  std::vector<char> R;
  uint64_t primary_key() const { return request_id; }
};
typedef eosio::multi_index<"eccbsign"_n, ecc_blind_sign_entries>
    eccbsign_entries_t;

TABLE rsa_params {
  uint64_t id;
  std::vector<char> N;
  uint64_t e;
  std::vector<char> secret_key_encrypted_to_dsp;
  uint64_t primary_key() const { return id; }
};
typedef eosio::multi_index<"rsaparams"_n, rsa_params>
    rsa_params_t;

ACTION setrsaparams(std::vector<char> N, uint64_t e, std::vector<char> secret_key_encrypted_to_dsp) {
  rsa_params_t rsa_params(get_self(), get_self().value);
  auto itr = rsa_params.find(0);
  if(itr == rsa_params.end()) {
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

struct ecc_blind_sign_request_input {
  uint64_t request_id;
};
struct ecc_blind_sign_request_result {
  std::vector<char> R;
};
static void ecc_blind_sign_request(uint64_t request_id) {
  /* STEP 1
  The signer randomly selects an integer k ∈ Zn,
  calculates R = kG, and then transmits R to the requester
  */
  ecc_blind_sign_request_input input;
  input.request_id = request_id;
  eosio::print("\nbefore call_cryp_fn\n");
  auto res = call_cryp_fn<ecc_blind_sign_request_result>(
      name("eccbsignreq"), pack(input), [&](auto &results) {
        eosio::print("\nin combinator\n");
        eosio::check(results.size() > 0, "not enough results");
        eosio::check(results[0].result.size() > 0, "not enough results1");
        eosio::print("\nend combinator\n");
        return results[0].result;
      });
  eosio::print("\nafter call_cryp_fn\n");

  auto _self = name(current_receiver());
  eccbsign_entries_t entries(_self, _self.value);
  eosio::print("\nbefore emplace call_cryp_fn\n");
  entries.emplace(_self, [&](auto &e) {
    e.request_id = request_id;
    e.R = res.R;
  });
  eosio::print("\nafter emplace call_cryp_fn\n");
};

[[eosio::action]] void testfn(name user) {
  require_auth(user);
  ecc_blind_sign_request(user.value);
}
CONTRACT_END((testfn)(setrsaparams))
