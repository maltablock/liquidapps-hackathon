export type IEOSNetwork = {
    chainId: string;
    nodeEndpoint: string;
    protocol: string;
    host: string;
    port: number;
};

// mimicks EOS C++ smart contract microseconds class
type microseconds = {
    _count: number | string;
};

// mimicks EOS C++ smart contract symbol class
export type TAssetSymbol = {
    code: string;
    precision: number;
};

// mimicks EOS C++ smart contract extended_symbol class
export type TExtendedSymbol = {
    symbol: TAssetSymbol;
    contract: string;
};

export type TAsset = {
    amount: number;
    symbol: TAssetSymbol;
};

export type NetworkName = `local` | `kylin` | `mainnet`
export function isNetworkName(networkName: string): networkName is NetworkName {
    switch (networkName) {
        case `local`:
        case `kylin`:
        case `mainnet`:
            return true;
    }
    return false;
}

export type TAccountsRow = {
    balance: string;
};

export type TRsaParamsRow = {
    id: number;
    N: string;
    e: number;
    secret_key_encrypted_to_dsp: string;
};

export type TBSignRow = {
    request_id: string
    blinded_message: string
    blind_signature: string
};

export function exhaustiveCheck(x: never) { throw new Error('exhaustiveCheck: should not reach here') }

export type ArgsType<T> = T extends (...args: infer U) => any ? U : never;
