# LiquidCrypto

## Development

Bootstrapped with [zeus-sdk](https://docs.liquidapps.io/en/stable/developers/zeus-getting-started.html).

### Setup

```
npm install -g @liquidapps/zeus-cmd
```

Only way to do it consistently right now is by bootstrapping with a different service and then manually merging this repo:

```bash
# clone this repo somewhere
git clone liquid-crypto liquid-crypto_

# create a new liquid-crypto dir
mkdir liquid-crypto
cd liquid-crypto
zeus unbox vcpu-dapp-service --no-create-dir

# manually merge this repo to the liquid-crypto dir
# Add cryptoconsumer project to contracts/eos/CMakeLists.txt
# And add a CMakeLists.txt to contracts/eos/cryptoconsumer
```

### Testing

```bash
zeus compile
npm run test-crypto
```


# vCPU Notes

```
ACTION vcpuconsumer/vcpuconsumer.cpp::testfn(input)
  -> dappservices/vcpu/headers.hpp::call_vcpu_fn("gcd", input, combinator)
    -> dappservices/vcpu/headers.hpp::_call_vcpu_fn(uri, input, combinator)
      -> SEND_SVC_REQUEST(vrun, uri, input);

/services/vcpu-dapp-service-node/chain/vrun.js
  -> dappservices/vcpu/cmds/vrun.hpp::vrun
    -> dappservices/vcpu/headers.hpp::updateVCPUResult
      -> enters result into vcpuentries_t

DSP retries initial action
ACTION vcpuconsumer/vcpuconsumer.cpp::testfn(input)
  -> dappservices/vcpu/headers.hpp::call_vcpu_fn("gcd", input, combinator)
    -> dappservices/vcpu/headers.hpp::_call_vcpu_fn(uri, input, combinator)
      -> dappservices/vcpu/headers.hpp::_vcpu_extractResults(vcpuentry, combinator)
  -> can now work with result
```