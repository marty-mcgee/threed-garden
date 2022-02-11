import {
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  Link,
} from '@chakra-ui/react'
import { RoyaltiesForm } from '@create-nft-dao/shared'

export const TokenInputs = ({
  tokenConfig,
  royaltiesConfig,
  onTokenConfigChange,
  onRoyaltiesConfigChange,
}) => {
  function onTokenNameChange(e) {
    const newValues = Object.assign({}, tokenConfig)
    newValues.name = e.target.value
    onTokenConfigChange(newValues)
  }

  function onTokenSymbolChange(e) {
    const newValues = Object.assign({}, tokenConfig)
    newValues.symbol = e.target.value
    onTokenConfigChange(newValues)
  }

  function onTokenBaseURIChange(e) {
    const newValues = Object.assign({}, tokenConfig)
    newValues.baseURI = e.target.value
    onTokenConfigChange(newValues)
  }

  function onTokenContractInfoURIChange(e) {
    const newValues = Object.assign({}, tokenConfig)
    newValues.contractInfoURI = e.target.value
    onTokenConfigChange(newValues)
  }

  return (
    <>
      <Heading as="h2" mb={6} mt={6}>
        2. Token
      </Heading>
      <VStack spacing={6}>
        <FormControl id="token-name" isRequired>
          <FormLabel>Name</FormLabel>
          <Input
            type="text"
            value={tokenConfig.name}
            onChange={onTokenNameChange}
          />
          <FormHelperText>
            The same as collection name in OpenSea, e.g. Nouns.
          </FormHelperText>
        </FormControl>
        <FormControl id="token-symbol" isRequired>
          <FormLabel>Symbol</FormLabel>
          <Input
            type="text"
            value={tokenConfig.symbol}
            onChange={onTokenSymbolChange}
          />
          <FormHelperText>e.g. LOOT.</FormHelperText>
        </FormControl>
        <FormControl id="token-baseuri">
          <FormLabel>Base URI</FormLabel>
          <Input
            type="text"
            value={tokenConfig.baseURI}
            onChange={onTokenBaseURIChange}
          />
          <FormHelperText>
            A link to an IPFS folder with all the token descriptors and project
            descriptor. E.g.{' '}
            <Link
              href="ipfs://bafybeif4s7oom2ch6iv42yn7la4b3dnkud2dgujmnhuxuswekx4l6yz4me/"
              isExternal
              tabIndex={-1}
            >
              ipfs://bafybeif4s7oom2ch6iv42yn7la4b3dnkud2dgujmnhuxuswekx4l6yz4me/
            </Link>
            <br />
            <br />
            If you don't yet have art on IPFS, you can leave this empty and your
            NFTs will have a placeholder image.
          </FormHelperText>
        </FormControl>
        <FormControl id="token-contractinfouri">
          <FormLabel>Contract Info URI (optional)</FormLabel>
          <Input
            type="text"
            value={tokenConfig.contractInfoURI}
            onChange={onTokenContractInfoURIChange}
          />
          <FormHelperText>
            A URL to a JSON file describing storefront-level metadata for your
            token. See more details on{' '}
            <Link
              href="https://docs.opensea.io/docs/contract-level-metadata"
              isExternal
              tabIndex={-1}
            >
              https://docs.opensea.io/docs/contract-level-metadata
            </Link>
          </FormHelperText>
        </FormControl>
        <RoyaltiesForm
          values={royaltiesConfig}
          onValuesChange={onRoyaltiesConfigChange}
        />
      </VStack>
    </>
  )
}
