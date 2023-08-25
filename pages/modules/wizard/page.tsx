'use client'

import { useState } from 'react'

// @mui material components
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'
import MDButton from '#/lib/mui/MDButton'

// ThreeD Garden examples components
import DashboardLayout from '#/ui/elements/LayoutContainers/DashboardLayout'
import DashboardNavbar from '#/ui/elements/Navbars/DashboardNavbar'
import Footer from '#/ui/elements/Footer'

// Wizard page components
import About from '#/pages/modules/wizard/components/About'
import Account from '#/pages/modules/wizard/components/Account'
import Address from '#/pages/modules/wizard/components/Address'

function getSteps(): string[] {
  return ['About', 'Account', 'Address']
}

function getStepContent(stepIndex: number): JSX.Element {
  switch (stepIndex) {
    case 0:
      return <About />
    case 1:
      return <Account />
    case 2:
      return <Address />
    default:
      return null
  }
}

function Wizard(): JSX.Element {
  const [activeStep, setActiveStep] = useState<number>(0)
  const steps = getSteps()
  const isLastStep: boolean = activeStep === steps.length - 1

  const handleNext = () => setActiveStep(activeStep + 1)
  const handleBack = () => setActiveStep(activeStep - 1)

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox
        pt={3}
        pb={8}
      >
        <Grid
          container
          justifyContent='center'
          sx={{ my: 4 }}
        >
          <Grid
            item
            xs={12}
            lg={8}
          >
            <MDBox
              mt={6}
              mb={8}
              textAlign='center'
            >
              <MDBox mb={1}>
                <MDTypography
                  variant='h3'
                  fontWeight='bold'
                >
                  Build Your Profile
                </MDTypography>
              </MDBox>
              <MDTypography
                variant='h5'
                fontWeight='regular'
                color='secondary'
              >
                This information will let us know more about you.
              </MDTypography>
            </MDBox>
            <Card>
              <MDBox
                mt={-3}
                mx={2}
              >
                <Stepper
                  activeStep={activeStep}
                  alternativeLabel
                >
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
                    width='100%'
                    display='flex'
                    justifyContent='space-between'
                  >
                    {activeStep === 0 ? (
                      <MDBox />
                    ) : (
                      <MDButton
                        variant='outlined'
                        color='dark'
                        onClick={handleBack}
                      >
                        back
                      </MDButton>
                    )}
                    <MDButton
                      variant='gradient'
                      color='dark'
                      onClick={!isLastStep ? handleNext : undefined}
                    >
                      {isLastStep ? 'send' : 'next'}
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

export default Wizard
