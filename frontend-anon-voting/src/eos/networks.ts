import { IEOSNetwork, NetworkName, isNetworkName, exhaustiveCheck } from '../typings';
import { JsonRpc } from 'eosjs';

const createNetwork = (nodeEndpoint: string, chainId: string): IEOSNetwork => {
    const matches = /^(https?):\/\/(.+):(\d+)\D*$/.exec(nodeEndpoint);
    if (!matches) {
        throw new Error(
            `Could not parse EOS HTTP endpoint. Needs protocol and port: "${nodeEndpoint}"`,
        );
    }

    const [, httpProtocol, host, port] = matches;

    return {
        chainId,
        protocol: httpProtocol,
        host,
        port: Number.parseInt(port, 10),
        nodeEndpoint,
    };
};

const KylinNetwork: IEOSNetwork = createNetwork(
    `https://api-kylin.eoslaomao.com:443`,
    `5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191`,
);

const LocalNetwork: IEOSNetwork = createNetwork(
    `http://localhost:13015`,
    `cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f`,
);

const MainNetwork: IEOSNetwork = createNetwork(
    `https://eos.greymass.com:443`,
    `aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906`,
);

const getNetworkName = (): NetworkName => {
    const networkName = `local` // liquid-crypto service is only available on local
    if (!isNetworkName(networkName)) throw new Error(`Unknown network ${networkName}`)
    return networkName
}

const getNetwork = (): IEOSNetwork => {
    const networkName = getNetworkName()

    switch (networkName) {
        case `local`:
            return LocalNetwork;
        case `kylin`:
            return KylinNetwork;
        case `mainnet`:
            return MainNetwork;
    }

    exhaustiveCheck(networkName)
}

const getAccountNames = () => {
    const networkName = getNetworkName()
    switch (networkName) {
        case `local`:
        case `kylin`:
        case `mainnet`:
            return {
                voting: `anonvoting`,
                voter1: `voter1`,
                voter2: `voter2`
            }
    }

    exhaustiveCheck(networkName)
}

const network = getNetwork();

const rpc = new JsonRpc(network.nodeEndpoint);

export { getNetwork, getAccountNames, rpc };
