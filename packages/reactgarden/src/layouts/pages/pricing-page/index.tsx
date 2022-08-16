import { useState } from "react"

// @mui material components
import Container from "@mui/material/Container"

// Company Juice Dashboard examples components
import PageLayout from "~/examples/LayoutContainers/PageLayout"

// Pricing page components
import Header from "~/layouts/pages/pricing-page/components/Header"
import Footer from "~/layouts/pages/pricing-page/components/Footer"
import PricingCards from "~/layouts/pages/pricing-page/components/PricingCards"
import TrustedBrands from "~/layouts/pages/pricing-page/components/TrustedBrands"
import Faq from "~/layouts/pages/pricing-page/components/Faq"

function PricingPage(): JSX.Element {
  const [tabValue, setTabValue] = useState<number>(0)
  const [prices, setPrices] = useState<string[]>(["59", "89", "99"])

  const handleSetTabValue = (event: any, newValue: any) => {
    setTabValue(newValue)

    if (event.currentTarget.id === "annual") {
      setPrices(["119", "159", "399"])
    } else {
      setPrices(["59", "89", "99"])
    }
  }

  return (
    <PageLayout>
      <Header tabValue={tabValue} tabHandler={handleSetTabValue}>
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
