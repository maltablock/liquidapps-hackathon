const { getCreateKeys } = require('../../../extensions/helpers/key-utils');
const { loadModels } = require('../../../extensions/tools/models');
const { deserialize, eosDSPGateway, generateABI, genNode, eosPrivate, paccount, forwardEvent, resolveProviderData, resolveProvider, getProviders, resolveProviderPackage, paccountPermission } = require('../../dapp-services-node/common');
const logger = require('../../../extensions/helpers/logger');
const loader = require("assemblyscript/lib/loader");
const fs = require('fs');
const path = require('path');
const util = require('util')
const { eccBlindSignatureSignRequest } = require(`../crypto/ecc-blind-signature`)

module.exports = async({ event, rollback }, { uri, payload }, state) => {
    logger.info(`VRUN: in vrun ${JSON.stringify(payload)}`, payload)
    if (rollback) {
        event.action = 'vrunclean';
        console.log('cryp after failed transaction', uri);
        return {
            size: 0,
            uri
        };
    }
    const { payer, packageid, current_provider } = event;
    var contract_code = payer;
    var loadedExtensions = await loadModels("dapp-services");
    var service = loadedExtensions.find(a => a.name == "cryp").contract;
    const uriStr = Buffer.from(uri, 'hex').toString('utf8');

    var resolvedPackages = await resolveProviderPackage(contract_code, service, paccount);
    const payloadParts = uriStr.split('://', 4);
    let partIdx = 0;
    const trxId = payloadParts[partIdx++];
    const tapos = payloadParts[partIdx++];
    const method = payloadParts[partIdx++];
    // const payloadhash = payloadParts[partIdx++];

    try {
        const data = eccBlindSignatureSignRequest()
        // const data = `ffffffffffffffff`

        return {
            uri,
            data,
            size: data.length
        };
    }
    catch (e) {
        logger.error(`error running cryp fn: ${e}`);
        return {
            uri,
            data: '',
            size: 0
        };
    }
}
