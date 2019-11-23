import { Action } from 'eosjs/dist/eosjs-serialize';
import { getAccountNames } from './networks';
import { api } from './api';

export type TransactionResult = {
  transaction_id: string;
};

const transactionOptions = {
  broadcast: true,
  blocksBehind: 3,
  expireSeconds: 300,
};

const createAction = (action: any): Action => {
  return {
    account: getAccountNames().voting,
    authorization: [
      {
        actor: getAccountNames().voting,
        permission: `relay`
      },
    ],
    data: {},
    ...action,
  }
};

type TTxResult = {
  transaction_id: string;
  processed: any;
}
export const sendTransaction = async (actions: Partial<Action>[] | Partial<Action>) => {
  const actionsArr = Array.isArray(actions) ? actions : [actions]

  const tx = {
    actions: actionsArr.map(createAction)
  }
  console.log(tx)

  return api.transact(
    tx,
    transactionOptions,
  ) as Promise<TTxResult>;
}
