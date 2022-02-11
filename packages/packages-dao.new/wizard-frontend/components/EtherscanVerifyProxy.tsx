import { VStack, Button, Text, Flex, Spacer, Heading } from '@chakra-ui/react'
import { verifyProxy, checkProxyVerification } from '../lib/etherscan'
import { useState } from 'react'
import { RepeatIcon } from '@chakra-ui/icons'
import { useEthers } from '@usedapp/core'

export const EtherscanVerifyProxy = ({ name, address }) => {
  const { chainId } = useEthers()
  const [isStartLoading, setIsStartLoading] = useState(false)
  const [verifyGuid, setVerifyGuid] = useState('')
  const [verifyStatus, setVerifyStatus] = useState('Not verified.')
  const [isCheckLoading, setIsCheckLoading] = useState(false)
  const [isVerificationSuccessful, setIsVerificationSuccessful] =
    useState(false)

  const checkVerification = async () => {
    setIsCheckLoading(true)
    try {
      const checkResponse = await checkProxyVerification(verifyGuid, chainId)
      if (checkResponse.success) {
        setVerifyStatus('Verification succeeded!')
        setIsVerificationSuccessful(true)
      } else {
        setVerifyStatus(checkResponse.message)
      }
    } catch (e) {
      setVerifyStatus(`Error: ${JSON.stringify(e)}`)
    } finally {
      setIsCheckLoading(false)
    }
  }

  const startVerification = async () => {
    setIsStartLoading(true)
    try {
      const verifyResult = await verifyProxy(address, chainId)
      if (!verifyResult.success) {
        setVerifyStatus(`Verification failed: ${verifyResult.messageOrGuid}`)
      } else {
        setVerifyGuid(verifyResult.messageOrGuid)
        setVerifyStatus(
          'Verification queued. Click refresh until you get a final success/failure status.'
        )
      }
    } catch (e) {
      setVerifyStatus(`Error: ${JSON.stringify(e)}`)
    } finally {
      setIsStartLoading(false)
    }
  }

  return (
    <VStack spacing={4} alignItems="flex-start" width="100%">
      <Heading as="h4" size="sm">
        {name}
      </Heading>
      <Button
        colorScheme="teal"
        onClick={startVerification}
        isLoading={isStartLoading}
      >
        Verify {name}
      </Button>
      <Flex width="100%" alignItems="center">
        <Text>Status: {verifyStatus}</Text>
        <Spacer />
        <Button
          leftIcon={<RepeatIcon />}
          colorScheme="teal"
          isLoading={isCheckLoading}
          isDisabled={isCheckLoading || !verifyGuid || isVerificationSuccessful}
          onClick={checkVerification}
        >
          Refresh Status
        </Button>
      </Flex>
    </VStack>
  )
}
