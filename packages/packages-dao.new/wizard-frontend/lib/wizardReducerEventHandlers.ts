import { ActionType, StateType } from './wizardTypes'

export function wizardReducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
      }
    case 'SET_TOKEN_CONFIG':
      return {
        ...state,
        tokenConfig: action.tokenConfig,
      }
    case 'SET_MINTER_CONFIG':
      return {
        ...state,
        minterConfig: action.minterConfig,
      }
    case 'SET_GOVERNOR_CONFIG':
      return {
        ...state,
        governorConfig: action.governorConfig,
      }
    case 'SET_MINTING_FILTER_CONFIG':
      return {
        ...state,
        mintingFilterConfig: action.mintingFilterConfig,
      }
    case 'SET_ROYALTIES_CONFIG':
      return {
        ...state,
        royaltiesConfig: action.royaltiesConfig,
      }
    case 'SET_CLONES':
      return {
        ...state,
        clones: action.clones,
      }
    default:
      throw new Error()
  }
}
