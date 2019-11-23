import React from 'react';
import { BigInteger } from 'jsbn';
import { action, observable } from 'mobx';
import { TBSignRow, TRsaParamsRow } from 'typings';
import { getAccountNames } from 'eos/networks';
import { sendTransaction } from 'eos/transactions';
import { fetchRows } from 'eos/utils';
import { bigIntegerToHexString, blindMessage, unblindSignature } from './crypto';


type FORM_TYPES = `login` | `requestvote` | `requestvoteresult` | `countvote`
type TAction = { type: string, payload?: any }
type SelectOption = { value: string, label: string }
export const initialFormState = {
  type: `login` as FORM_TYPES,
  login: {
    selectedValue: {
      value: `voter1`,
    }
  },
  requestvote: {
    selectedValue: {
      value: `0`,
    },
  },
  requestvoteresult: {
    message: ``,
    blindedMessage: new BigInteger(`0`),
    blindFactor: new BigInteger(`0`),
    signatureHex: ``,
  },
  countvote: {
    message: ``,
    signatureHex: ``,
    success: false,
  },
  loggedInUser: {
    account: ``
  },
  error: ``,
}

export default class RootStore {
  @observable formState = initialFormState
  @observable rsaPublicParams?: TRsaParamsRow;

  @action async init() {
    this.fetchRsaParams()
  }

  @action async fetchRsaParams() {
    const rows = await fetchRows<TRsaParamsRow>({
      code: getAccountNames().voting,
      scope: getAccountNames().voting,
      table: `rsaparams`,
      limit: 1,
    })

    if(!rows[0]) throw new Error(`RSA public params not found on contract`)
    this.rsaPublicParams = rows[0]
  }

  formReducer(state: typeof initialFormState, action: TAction) {
    switch (action.type) {
      case 'login/submit':
        this.fetchRsaParams()
        return {
          ...state,
          type: `requestvote` as FORM_TYPES,
          loggedInUser: {
            account: state.login.selectedValue.value,
          },
          error: ``,
        }
      case 'login/select':
        return {
          ...state,
          login: {
            ...state.login,
            selectedValue: action.payload,
          }
        }
      case 'requestvote/submit': {
        const randomness = `-${Math.random().toString(36).slice(2)}`
        const voteMessage = `hackathon-${state.requestvote.selectedValue.value}${randomness}`
        const { blindedMessage, blindFactor } = blindMessage(
          voteMessage,
          this.rsaPublicParams!.N,
          this.rsaPublicParams!.e,
        );

        this.requestVote(blindedMessage)

        return {
          ...state,
          type: `requestvoteresult` as FORM_TYPES,
          requestvoteresult: {
            message: voteMessage,
            blindedMessage,
            blindFactor,
            signatureHex: `Loading ...`, // need to load async
          },
          error: ``,
        }
      }
      case 'requestvote/select':
        return {
          ...state,
          requestvote: {
            ...state.requestvote,
            selectedValue: action.payload,
          }
        }
      case 'countvote/message':
        return {
          ...state,
          countvote: {
            ...state.countvote,
            message: action.payload
          }
        }
      case 'countvote/signature':
        return {
          ...state,
          countvote: {
            ...state.countvote,
            signatureHex: action.payload
          },
        }
      case 'countvote/submit':
        this.countVote()
        return {
          ...state,
          error: ``,
          success: false,
        }
      default:
        throw new Error();
    }
  }

  @action dispatch = async (action: TAction) => {
    this.formState = this.formReducer(this.formState, action)
  }

  @action requestVote = async (blindedMessage: BigInteger) => {
    const blindedMessageHex = bigIntegerToHexString(blindedMessage)

    try {
      await sendTransaction({
        account: getAccountNames().voting,
        name: `requestvote`,
        authorization: [{
          actor: this.formState.loggedInUser.account,
          permission: `active`,
        }],
        data: {
          user: this.formState.loggedInUser.account,
          for_poll_name: `hackathon`,
          blinded_message: blindedMessageHex,
        },
      })
      // fetch blind signature
      const rows = await fetchRows<TBSignRow>({
        code: getAccountNames().voting,
        scope: getAccountNames().voting,
        table: "bsign",
        lower_bound: this.formState.loggedInUser.account,
        limit: 1,
      })

      if (!rows[0] || rows[0].request_id !== this.formState.loggedInUser.account || !rows[0].blind_signature) {
        throw new Error(`No blind signature was returned for this user.`)
      }

      const signature = unblindSignature(rows[0].blind_signature, this.rsaPublicParams!.N, this.formState.requestvoteresult.blindFactor)
      this.formState.requestvoteresult.signatureHex = bigIntegerToHexString(signature)
    } catch (error) {
      this.formState.error = error.message
    }
  }

  @action countVote = async () => {
    try {
      await sendTransaction({
        account: getAccountNames().voting,
        name: `countvote`,
        authorization: [{
          actor: getAccountNames().voting,
          permission: `relay`,
        }],
        data: {
          vote_message: this.formState.countvote.message,
          signature: this.formState.countvote.signatureHex,
        },
      })
      this.formState.countvote.success = true
    } catch (error) {
      this.formState.error = error.message
    }
  }

}

export const rootStore = new RootStore();
export const storeContext = React.createContext<RootStore>(rootStore);
