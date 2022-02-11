import React, { useEffect, useState } from 'react'
import { ChainId, useEthers } from '@usedapp/core'
import { Box, Link } from '@chakra-ui/react'
import { config } from '../config'

export const OpenSeaLink = ({ linkText }) => {
  const { chainId } = useEthers()
  const [openseaLink, setOpenseaLink] = useState('')

  useEffect(() => {
    let openseaAPIBaseURI: string
    let openseaBaseURI: string

    if (chainId == ChainId.Rinkeby) {
      openseaAPIBaseURI = 'https://rinkeby-api.opensea.io'
      openseaBaseURI = 'https://testnets.opensea.io'
    } else if (chainId == ChainId.Mainnet) {
      openseaAPIBaseURI = 'https://api.opensea.io'
      openseaBaseURI = 'https://opensea.io'
    } else {
      return
    }

    fetch(`${openseaAPIBaseURI}/api/v1/asset_contract/${config.tokenAddress}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.collection) {
          setOpenseaLink(`${openseaBaseURI}/collection/${data.collection.slug}`)
        }
      })
  }, [chainId])

  return (
    <>
      {openseaLink ? (
        <Link isExternal href={openseaLink}>
          {linkText}
        </Link>
      ) : (
        <Box>Opensea link not available</Box>
      )}
    </>
  )
}
