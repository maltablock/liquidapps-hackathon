import 'mocha';
require('babel-core/register');
require('babel-polyfill');
const { assert } = require('chai'); // Using Assert style
const { getNetwork, getCreateKeys, getCreateAccount, getEos } = require('../extensions/tools/eos/utils');
var Eos = require('eosjs');
const getDefaultArgs = require('../extensions/helpers/getDefaultArgs');

const artifacts = require('../extensions/tools/eos/artifacts');
const deployer = require('../extensions/tools/eos/deployer');
const { genAllocateDAPPTokens, readVRAMData } = require('../extensions/tools/eos/dapp-services');
const { getTestContract } = require('../extensions/tools/eos/utils');

var contractCode = 'crypconsumer';
var serviceName = 'cryp'
var ctrt = artifacts.require(`./${contractCode}/`);
const delay = ms => new Promise(res => setTimeout(res, ms));
const util = require('util');


const account = "crypconsumer";
describe(`${contractCode} Contract`, () => {
    var testcontract;


    const getTestAccountName = (num) => {
        var fivenum = num.toString(5).split('');
        for (var i = 0; i < fivenum.length; i++) {
            fivenum[i] = String.fromCharCode(fivenum[i].charCodeAt(0) + 1);
        }
        fivenum = fivenum.join('');
        var s = '111111111111' + fivenum;
        var prefix = 'test';
        s = prefix + s.substr(s.length - (12 - prefix.length));
        console.log(s);
        return s;
    };
    before(done => {
        (async() => {
            try {
                console.log(`TEST: running before`)
                var deployedContract = await deployer.deploy(ctrt, account);
                await genAllocateDAPPTokens(deployedContract, serviceName, "pprovider1", "default");
                // await genAllocateDAPPTokens(deployedContract, serviceName, "pprovider2", "foobar");
                testcontract = await getTestContract(account);

                console.log(`TEST: before done`)
                done();
            }
            catch (e) {
                done(e);
            }
        })();
    });

    it('Commom denom', done => {
        (async() => {
            try {
                var owner = getTestAccountName(10);
                var testAccountKeys = await getCreateAccount(owner);
                await testcontract.testfn({
                    user: owner,
                }, {
                    authorization: `${owner}@active`,
                    broadcast: true,
                    sign: true,
                    keyProvider: [testAccountKeys.active.privateKey],
                });

                const table = await testcontract.api.getTableRows({
                    'json': true,
                    'scope': account,
                    'code': account,
                    'table': 'eccbsign',
                    'limit': 100
                  });
                  const entry = table.rows[0];
                  console.log(entry)
                  assert.ok(Boolean(entry), 'no entry');
                  assert.equal(entry.R, `000102030405060708`, 'wrong entry');

                done();
            }
            catch (e) {
                done(e);
            }
        })();
    });

});
