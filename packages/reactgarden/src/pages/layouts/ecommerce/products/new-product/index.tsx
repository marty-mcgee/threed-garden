import { useState } from "react"

// @mui material components
import Grid from "@mui/material/Grid"
import Stepper from "@mui/material/Stepper"
import Step from "@mui/material/Step"
import StepLabel from "@mui/material/StepLabel"
import Card from "@mui/material/Card"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDButton from "~/components/MDButton"
import MDTypography from "~/components/MDTypography"

// ThreeD Garden examples components
import DashboardLayout from "~/components/examples/LayoutContainers/DashboardLayout"
import DashboardNavbar from "~/components/examples/Navbars/DashboardNavbar"
import Footer from "~/components/examples/Footer"

// NewProduct page components
import ProductInfo from "~/pages/layouts/ecommerce/products/new-product/components/ProductInfo"
import Media from "~/pages/layouts/ecommerce/products/new-product/components/Media"
import Socials from "~/pages/layouts/ecommerce/products/new-product/components/Socials"
import Pricing from "~/pages/layouts/ecommerce/products/new-product/components/Pricing"

function getSteps(): string[] {
  return ["1. Product Info", "2. Media", "3. Social", "4. Pricing"]
}

function getStepContent(stepIndex: number): JSX.Element {
  switch (stepIndex) {
    case 0:
      return <ProductInfo />
    case 1:
      return <Media />
    case 2:
      return <Socials />
    case 3:
      return <Pricing />
    default:
      return null
  }
}

function NewProduct(): JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(0)
  const steps = getSteps()
  const isLastStep: boolean = activeStep === steps.length - 1

  const handleNext = () => setActiveStep(activeStep + 1)
  const handleBack = () => setActiveStep(activeStep - 1)

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mt={5} mb={9}>
        <Grid container justifyContent="center">
          <Grid item xs={12} lg={8}>
            <MDBox mt={6} mb={8} textAlign="center">
              <MDBox mb={1}>
                <MDTypography variant="h3" fontWeight="bold">
                  Add New Product
                </MDTypography>
              </MDBox>
              <MDTypography variant="h5" fontWeight="regular" color="secondary">
                This information will describe more about the product.
              </MDTypography>
            </MDBox>
            <Card>
              <MDBox mt={-3} mb={3} mx={2}>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </MDBox>
              <MDBox p={2}>
                <MDBox>
                  {getStepContent(activeStep)}
                  <MDBox
                    mt={3}
                    width="100%"
                    display="flex"
                    justifyContent="space-between">
                    {activeStep === 0 ? (
                      <MDBox />
                    ) : (
                      <MDButton
                        variant="gradient"
                        color="light"
                        onClick={handleBack}>
                        back
                      </MDButton>
                    )}
                    <MDButton
                      variant="gradient"
                      color="dark"
                      onClick={!isLastStep ? handleNext : undefined}>
                      {isLastStep ? "send" : "next"}
                    </MDButton>
                  </MDBox>
                </MDBox>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  )
}

export default NewProduct
