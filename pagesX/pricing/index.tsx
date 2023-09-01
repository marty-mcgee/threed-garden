import { useState } from 'react'

// @mui material components
import Container from '@mui/material/Container'

// ThreeD Garden examples components
import PageLayout from '#/ui/elements/LayoutContainers/PageLayout'

// Pricing page components
import Header from '#/pagesX/pricing/components/Header'
import Footer from '#/pagesX/pricing/components/Footer'
import PricingCards from '#/pagesX/pricing/components/PricingCards'
import TrustedBrands from '#/pagesX/pricing/components/TrustedBrands'
import Faq from '#/pagesX/pricing/components/Faq'

function PricingPage(): JSX.Element {
  const [tabValue, setTabValue] = useState<number>(0)
  const [prices, setPrices] = useState<string[]>(['59', '89', '99'])

  const handleSetTabValue = (event: any, newValue: any) => {
    setTabValue(newValue)

    if (event.currentTarget.id === 'annual') {
      setPrices(['119', '189', '399'])
    } else {
      setPrices(['49', '99', '299'])
    }
  }

  return (
    <PageLayout>
      <Header
        tabValue={tabValue}
        tabHandler={handleSetTabValue}
      >
        <Container>
          <PricingCards prices={prices} />
          <TrustedBrands />
          <Faq />
        </Container>
      </Header>
      <Footer />
    </PageLayout>
  )
}

export default PricingPage
