import { useState } from 'react'

// formik components
import { Formik, Form } from 'formik'

// @mui material components
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDButton from '#/lib/mui/MDButton'

// ThreeD Garden examples components
import DashboardLayout from '#/ui/elements/LayoutContainers/DashboardLayout'
import DashboardNavbar from '#/ui/elements/Navbars/DashboardNavbar'
import Footer from '#/ui/elements/Footer'

// NewUser page components
import UserInfo from '#/pagesX/users/new-user/components/UserInfo'
import Address from '#/pagesX/users/new-user/components/Address'
import Socials from '#/pagesX/users/new-user/components/Socials'
import Profile from '#/pagesX/users/new-user/components/Profile'

// NewUser layout schemas for form and form feilds
import validations from '#/lib/api/@fake-db/pages/users/new-user/schemas/validations'
import form from '#/lib/api/@fake-db/pages/users/new-user/schemas/form'
import initialValues from '#/lib/api/@fake-db/pages/users/new-user/schemas/initialValues'

function getSteps(): string[] {
  return ['User Info', 'Address', 'Social', 'Profile']
}

function getStepContent(stepIndex: number, formData: any): JSX.Element {
  switch (stepIndex) {
    case 0:
      return <UserInfo formData={formData} />
    case 1:
      return <Address formData={formData} />
    case 2:
      return <Socials formData={formData} />
    case 3:
      return <Profile formData={formData} />
    default:
      return null
  }
}

function NewUser(): JSX.Element {
  const [activeStep, setActiveStep] = useState(0)
  const steps = getSteps()
  const { formId, formField } = form
  const currentValidation = validations[activeStep]
  const isLastStep = activeStep === steps.length - 1

  const sleep = (ms: any) =>
    new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  const handleBack = () => setActiveStep(activeStep - 1)

  const submitForm = async (values: any, actions: any) => {
    await sleep(1000)

    alert(JSON.stringify(values, null, 2))

    actions.setSubmitting(false)
    actions.resetForm()

    setActiveStep(0)
  }

  const handleSubmit = (values: any, actions: any) => {
    if (isLastStep) {
      submitForm(values, actions)
    } else {
      setActiveStep(activeStep + 1)
      actions.setTouched({})
      actions.setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox
        py={3}
        mb={20}
        height='65vh'
      >
        <Grid
          container
          justifyContent='center'
          alignItems='center'
          sx={{ height: '100%', mt: 8 }}
        >
          <Grid
            item
            xs={12}
            lg={8}
          >
            <Formik
              initialValues={initialValues}
              validationSchema={currentValidation}
              onSubmit={handleSubmit}
            >
              {({ values, errors, touched, isSubmitting }) => (
                <Form
                  id={formId}
                  autoComplete='off'
                >
                  <Card sx={{ height: '100%' }}>
                    <MDBox
                      mx={2}
                      mt={-3}
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
                    <MDBox p={3}>
                      <MDBox>
                        {getStepContent(activeStep, {
                          values,
                          touched,
                          formField,
                          errors,
                        })}
                        <MDBox
                          mt={2}
                          width='100%'
                          display='flex'
                          justifyContent='space-between'
                        >
                          {activeStep === 0 ? (
                            <MDBox />
                          ) : (
                            <MDButton
                              variant='gradient'
                              color='light'
                              onClick={handleBack}
                            >
                              back
                            </MDButton>
                          )}
                          <MDButton
                            disabled={isSubmitting}
                            type='submit'
                            variant='gradient'
                            color='dark'
                          >
                            {isLastStep ? 'send' : 'next'}
                          </MDButton>
                        </MDBox>
                      </MDBox>
                    </MDBox>
                  </Card>
                </Form>
              )}
            </Formik>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  )
}

export default NewUser
