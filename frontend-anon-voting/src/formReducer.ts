import { loadingIndicatorCSS } from "react-select/src/components/indicators"

type FORM_TYPES = `login` | `requestvote` | `requestvoteresult` | `countvote`
type TAction = { type: string, payload?: any }

export const initialFormState = {
  type: `login` as FORM_TYPES,
  login: {
    selectedValue: `voter1`
  },
  requestvote: {
    selectedValue: `0`,
  },
  countvote: {
    message: ``,
    signature: ``,
  },
  loggedInUser: {
    account: ``
  }
}

export default function formReducer(state: typeof initialFormState, action: TAction) {
  switch (action.type) {
    case 'login/submit':
      return {
        ...state,
        type: `requestvote` as FORM_TYPES,
        loggedInUser: {
          account: state.login.selectedValue,
        }
      }
    case 'login/select':
      return {
        ...state,
        login: {
          ...state.login,
          selectedValue: action.payload
        }
      }
    case 'requestvote/submit':
      return {
        ...state,
        type: `requestvoteresult` as FORM_TYPES,
        loggedInUser: {
          account: state.requestvote.selectedValue,
        }
      }
    case 'requestvote/select':
      return {
        ...state,
        requestvote: {
          ...state.requestvote,
          selectedValue: action.payload
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
          signature: action.payload
        }
      }
    case 'countvote/submit':
      return {
        ...state,
        countvote: {
          ...state.countvote,
          message: action.payload
        }
      }
    default:
      throw new Error();
  }
}