// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Step from '@mui/material/Step'
import Button from '@mui/material/Button'
import Stepper from '@mui/material/Stepper'
import StepLabel from '@mui/material/StepLabel'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import StepContent from '@mui/material/StepContent'

// ** Third Party Imports
import clsx from 'clsx'
import toast from 'react-hot-toast'

// ** Custom Components Imports
import StepperCustomDot from './StepperCustomDot'

// ** Styled Components
import StepperWrapper from 'src/@core/styles/mui/stepper'

const steps = [
  {
    title: 'Account Details',
    subtitle: 'Enter your Account Details',
    description:
      'Chocolate cookie lollipop toffee candy canes marzipan liquorice chocolate. Cake gummi bears dessert lollipop apple pie candy. Candy pie sesame snaps lollipop biscuit chocolate cake fruitcake apple pie. Toffee carrot cake biscuit oat cake jujubes fruitcake biscuit gummi bears. Cake carrot cake jujubes sugar plum pastry gummi bears gingerbread icing. Lemon drops pie cake. Halvah marzipan bonbon gingerbread cupcake pastry gummi bears cake jujubes.'
  },
  {
    title: 'Personal Info',
    subtitle: 'Setup Information',
    description:
      'Lemon drops ice cream danish macaroon bear claw cookie. Liquorice ice cream chocolate bar pastry chocolate bar candy. Caramels candy canes marshmallow soufflé biscuit tart fruitcake tiramisu. Gummi bears icing gingerbread pastry bonbon gummies candy canes pastry. Candy canes chocolate chupa chups cake cheesecake apple pie halvah dessert. Chupa chups wafer tootsie roll fruitcake lemon drops cookie donut topping powder.'
  },
  {
    title: 'Social Links',
    subtitle: 'Add Social Links',
    description:
      'Jelly lollipop halvah bear claw jujubes macaroon candy canes. Soufflé halvah lollipop liquorice macaroon powder. Cookie topping pastry oat cake caramels bonbon. Sesame snaps sweet cookie macaroon soufflé pudding. Chocolate donut macaroon muffin donut biscuit marzipan halvah. Bear claw biscuit chocolate cake chupa chups oat cake bear claw cupcake tiramisu apple pie. Carrot cake bear claw marshmallow sweet pudding toffee.'
  }
]

const StepperVerticalWithoutNumbers = () => {
  // ** States
  const [activeStep, setActiveStep] = useState(0)

  // Handle Stepper
  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1)
    if (activeStep === steps.length - 1) {
      toast.success('Completed All Steps!!')
    }
  }

  const handleReset = () => {
    setActiveStep(0)
  }

  return (
    <Card>
      <CardHeader title='Vertical Stepper without Numbers' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <StepperWrapper>
          <Stepper activeStep={activeStep} orientation='vertical'>
            {steps.map((step, index) => {
              return (
                <Step key={index} className={clsx({ active: activeStep === index })}>
                  <StepLabel StepIconComponent={StepperCustomDot}>
                    <div className='step-label'>
                      <div>
                        <Typography className='step-title'>{step.title}</Typography>
                        <Typography className='step-subtitle'>{step.subtitle}</Typography>
                      </div>
                    </div>
                  </StepLabel>
                  <StepContent>
                    <Typography>{step.description}</Typography>
                    <div className='button-wrapper'>
                      <Button
                        size='small'
                        color='secondary'
                        variant='outlined'
                        onClick={handleBack}
                        disabled={activeStep === 0}
                      >
                        Back
                      </Button>
                      <Button size='small' variant='contained' onClick={handleNext} sx={{ ml: 4 }}>
                        {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                      </Button>
                    </div>
                  </StepContent>
                </Step>
              )
            })}
          </Stepper>
        </StepperWrapper>
        {activeStep === steps.length && (
          <Box sx={{ mt: 4 }}>
            <Typography>All steps are completed!</Typography>
            <Button size='small' sx={{ mt: 2 }} variant='contained' onClick={handleReset}>
              Reset
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default StepperVerticalWithoutNumbers
