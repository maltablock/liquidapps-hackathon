# LiquidCrypto

> 📹 Check the video walkthrough of our [anonymous e-voting protocol](https://streamable.com/wiqgp)

## Development

Bootstrapped with [zeus-sdk](https://docs.liquidapps.io/en/stable/developers/zeus-getting-started.html).

### Setup

```
npm install -g @liquidapps/zeus-cmd
```

I'm on Mac and could not deploy the zeus box due to a bug.
Only way to test a service consistently right now is by bootstrapping with a different service and then manually merging the files of this repo:

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

### Testing & Deploying

To run the smart contract tests and also set up the second test voter, we can just run the tests.
After the tests ran, the DSP node is still kept alive.

```bash
zeus compile
npm run test-crypto
```


The React frontend in `frontend-anon-voting` can be run with:

```
cd frontend-anon-voting
npm i
npm start
```

