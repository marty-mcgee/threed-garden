import { Layout } from '@create-nft-dao/shared'
import { Heading, VStack } from '@chakra-ui/react'
import React from 'react'
import { MinterAdmin } from '../components/admin/MinterAdmin'
import { TokenAdmin } from '../components/admin/TokenAdmin'
import { GovernanceAdmin } from '../components/admin/GovernanceAdmin'
import { NavbarLinks } from '../components/NavbarLinks'

const Mint = () => {
  const layoutProps = {
    title: 'Create NFT DAO: Admin',
  }

  return (
    <Layout customMeta={layoutProps} navbarLinks={NavbarLinks}>
      <VStack maxW="container.lg" spacing={16} alignItems="flex-start" px={4}>
        <Heading as="h1" size="2xl">
          Admin
        </Heading>
        <Heading as="h2" size="xl">
          Minter contract
        </Heading>
        <MinterAdmin />
        <Heading as="h2" size="xl">
          NFT contract
        </Heading>
        <TokenAdmin />
        <Heading as="h2" size="xl">
          Governance
        </Heading>
        <GovernanceAdmin />
      </VStack>
    </Layout>
  )
}

export default Mint
