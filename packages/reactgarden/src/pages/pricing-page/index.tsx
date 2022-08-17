import { useState } from "react"

// @mui material components
import Container from "@mui/material/Container"

// ThreeD Garden examples components
import PageLayout from "~/components/elements/LayoutContainers/PageLayout"

// Pricing page components
import Header from "~/pages/pricing-page/components/Header"
import Footer from "~/pages/pricing-page/components/Footer"
import PricingCards from "~/pages/pricing-page/components/PricingCards"
import TrustedBrands from "~/pages/pricing-page/components/TrustedBrands"
import Faq from "~/pages/pricing-page/components/Faq"

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
