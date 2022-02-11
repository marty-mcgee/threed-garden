import { Layout } from '@create-nft-dao/shared'
import { Minter } from '../components/Minter'
import { Center, Container } from '@chakra-ui/react'
import { NavbarLinks } from '../components/NavbarLinks'

const Mint = () => {
  const layoutProps = {
    title: 'Mint',
  }

  return (
    <Layout customMeta={layoutProps} navbarLinks={NavbarLinks}>
      <Container maxW="container.lg">
        <Center>
          <Minter />
        </Center>
      </Container>
    </Layout>
  )
}

export default Mint
