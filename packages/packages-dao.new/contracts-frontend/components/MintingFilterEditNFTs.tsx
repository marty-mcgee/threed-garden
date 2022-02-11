import { useGetTokenFilters } from '../lib/contractWrappers/mintingFilter'
import { MintingFilterNFTsInputs } from '@create-nft-dao/shared'
import { useEffect } from 'react'

export const MintingFilterEditNFTs = ({
  mintingFilterAddress,
  values,
  onValuesChange,
}) => {
  const tokenFilters = useGetTokenFilters(mintingFilterAddress)
  useEffect(() => {
    if (tokenFilters === undefined) {
      return
    }

    onValuesChange(
      tokenFilters.map((tokenAndBalance) => {
        return {
          address: tokenAndBalance[0],
          minBalance: tokenAndBalance[1],
        }
      })
    )
  }, [mintingFilterAddress, tokenFilters])

  return (
    <MintingFilterNFTsInputs values={values} onValuesChange={onValuesChange} />
  )
}
