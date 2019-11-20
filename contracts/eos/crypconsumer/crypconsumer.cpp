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
CONTRACT_END((testfn))

std::vector<char> vvcomdenom(std::vector<char> payload) {
  input_t input = unpack<input_t>(payload);
  result_t result;
  result.input = input;
  uint32_t x = input.a;
  uint32_t y = input.b;
  bool swap = false;
  if (x < y) {
    swap = true;
    x = input.b;
    y = input.a;
  }
  result.output = 0;
  for (int i = x; i > 1; i--) {
    if (x % i == 0 && y % i == 0) {
      result.output = i;
      result.output_b_denom = input.b / i;
      result.output_a_denom = input.a / i;
      break;
    }
  }
  auto packed = pack(result);
  return packed;
}

char *the_buffer;
uint32_t the_buffer_size;
char *the_result;
bool inited = false;
extern "C" {
char *initialize(uint32_t sze) {
  if (!inited) {
    inited = true;
    the_buffer = (char *)malloc(sze);
    the_buffer_size = sze;
    return the_buffer;
  } else {
    return the_result;
  }
}
uint32_t run_query() {
  std::vector<char> payload(the_buffer, the_buffer + the_buffer_size);
  auto res = vvcomdenom(payload);
  the_result = res.data();
  return res.size();
  // vvcomdenom(std::vector<char>(str.data(),str.data()+str.size()));
}
}
