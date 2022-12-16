import { createContext } from 'react'
import { createContextualCan } from '@casl/react'

export const AbilityContext = createContext(undefined)

export default createContextualCan(AbilityContext.Consumer)
