import React from 'react'
import { IncrementalMinter } from './minter/IncrementalMinter'
import { SpecificIdMinter } from './minter/SpecificIdMinter'
import { config, MinterType } from '../config'

export const Minter = () => {
  if (config.minterType === MinterType.FixedPriceSequentialMinter) {
    return <IncrementalMinter />
  } else if (config.minterType === MinterType.FixedPriceSpecificIDMinter) {
    return <SpecificIdMinter />
  }
}
