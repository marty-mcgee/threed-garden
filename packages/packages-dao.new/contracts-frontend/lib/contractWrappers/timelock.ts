import { config } from '../../config'
import { useEtherBalance } from '@usedapp/core'

export const useTimelockETHBalance = () => {
  return useEtherBalance(config.timelockAddress)
}
