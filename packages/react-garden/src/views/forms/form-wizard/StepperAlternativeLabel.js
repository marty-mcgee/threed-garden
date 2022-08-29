// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Step from '@mui/material/Step'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Stepper from '@mui/material/Stepper'
import MenuItem from '@mui/material/MenuItem'
import StepLabel from '@mui/material/StepLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import OutlinedInput from '@mui/material/OutlinedInput'
import InputAdornment from '@mui/material/InputAdornment'
import Select from '@mui/material/Select'

// ** Icons Imports
import EyeOutline from 'mdi-material-ui/EyeOutline'
import EyeOffOutline from 'mdi-material-ui/EyeOffOutline'

// ** Custom Components Imports
import StepperCustomDot from './StepperCustomDot'

// ** Third Party Imports
import toast from 'react-hot-toast'

// ** Styled Component
import StepperWrapper from 'src/@core/styles/mui/stepper'

const steps = [
  {
    title: 'Account Details',
    subtitle: 'Enter your Account Details'
  },
  {
    title: 'Personal Info',
    subtitle: 'Setup Information'
  },
  {
    title: 'Social Links',
    subtitle: 'Add Social Links'
  }
]

const StepperAlternativeLabel = () => {
  // ** States
  const [email, setEmail] = useState('')
  const [google, setGoogle] = useState('')
  const [country, setCountry] = useState('')
  const [twitter, setTwitter] = useState('')
  const [username, setUsername] = useState('')
  const [lastName, setLastName] = useState('')
  const [facebook, setFacebook] = useState('')
  const [linkedIn, setLinkedIn] = useState('')
  const [firstName, setFirstName] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [language, setLanguage] = useState([])

  const [state, setState] = useState({
    password: '',
    password2: '',
    showPassword: false,
    showPassword2: false
  })

  // Handle Stepper
  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1)
    if (activeStep === steps.length - 1) {
      toast.success('Form Submitted')
    }
  }

  const handleReset = () => {
    setEmail('')
    setGoogle('')
    setCountry('')
    setTwitter('')
    setUsername('')
    setLastName('')
    setFacebook('')
    setLinkedIn('')
    setLanguage([])
    setFirstName('')
    setActiveStep(0)
    setState({ ...state, password: '', password2: '' })
  }

  // Handle Password
  const handlePasswordChange = prop => event => {
    setState({ ...state, [prop]: event.target.value })
  }

  const handleClickShowPassword = () => {
    setState({ ...state, showPassword: !state.showPassword })
  }

  const handleMouseDownPassword = event => {
    event.preventDefault()
  }

  // Handle Confirm Password
  const handleConfirmChange = prop => event => {
    setState({ ...state, [prop]: event.target.value })
  }

  const handleClickShowConfirmPassword = () => {
    setState({ ...state, showPassword2: !state.showPassword2 })
  }

  const handleMouseDownConfirmPassword = event => {
    event.preventDefault()
  }

  // Handle Language
  const handleSelectChange = event => {
    setLanguage(event.target.value)
  }

  const getStepContent = step => {
    switch (step) {
      case 0:
        return (
          <Fragment>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Username'
                value={username}
                placeholder='carterLeonard'
                onChange={e => setUsername(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type='email'
                label='Email'
                value={email}
                placeholder='carterleonard@gmail.com'
                onChange={e => setEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor='stepper-alternative-account-password'>Password</InputLabel>
                <OutlinedInput
                  label='Password'
                  value={state.password}
                  id='stepper-alternative-account-password'
                  onChange={handlePasswordChange('password')}
                  type={state.showPassword ? 'text' : 'password'}
                  endAdornment={
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        aria-label='toggle password visibility'
                      >
                        {state.showPassword ? <EyeOutline /> : <EyeOffOutline />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor='stepper-alternative-account-password-2'>Confirm Password</InputLabel>
                <OutlinedInput
                  value={state.password2}
                  label='Confirm Password'
                  id='stepper-alternative-account-password-2'
                  onChange={handleConfirmChange('password2')}
                  type={state.showPassword2 ? 'text' : 'password'}
                  endAdornment={
                    <InputAdornment position='end'>
                      <IconButton
                        edge='end'
                        aria-label='toggle password visibility'
                        onClick={handleClickShowConfirmPassword}
                        onMouseDown={handleMouseDownConfirmPassword}
                      >
                        {state.showPassword2 ? <EyeOutline /> : <EyeOffOutline />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </FormControl>
            </Grid>
          </Fragment>
        )
      case 1:
        return (
          <Fragment key={step}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='First Name'
                placeholder='Leonard'
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Last Name'
                placeholder='Carter'
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='stepper-alternative-personal-select-label'>Country</InputLabel>
                <Select
                  label='Country'
                  value={country}
                  id='stepper-alternative-personal-select'
                  onChange={e => setCountry(e.target.value)}
                  labelId='stepper-alternative-personal-select-label'
                >
                  <MenuItem value='UK'>UK</MenuItem>
                  <MenuItem value='USA'>USA</MenuItem>
                  <MenuItem value='Australia'>Australia</MenuItem>
                  <MenuItem value='Germany'>Germany</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='stepper-alternative-personal-multiple-select-label'>Language</InputLabel>
                <Select
                  multiple
                  value={language}
                  onChange={handleSelectChange}
                  id='stepper-alternative-personal-multiple-select'
                  labelId='stepper-alternative-personal-multiple-select-label'
                  input={<OutlinedInput label='Language' id='stepper-alternative-select-multiple-language' />}
                >
                  <MenuItem value='English'>English</MenuItem>
                  <MenuItem value='French'>French</MenuItem>
                  <MenuItem value='Spanish'>Spanish</MenuItem>
                  <MenuItem value='Portuguese'>Portuguese</MenuItem>
                  <MenuItem value='Italian'>Italian</MenuItem>
                  <MenuItem value='German'>German</MenuItem>
                  <MenuItem value='Arabic'>Arabic</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Fragment>
        )
      case 2:
        return (
          <Fragment key={step}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Twitter'
                value={twitter}
                onChange={e => setTwitter(e.target.value)}
                placeholder='https://twitter.com/carterLeonard'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Facebook'
                value={facebook}
                onChange={e => setFacebook(e.target.value)}
                placeholder='https://facebook.com/carterLeonard'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Google+'
                value={google}
                onChange={e => setGoogle(e.target.value)}
                placeholder='https://plus.google.com/carterLeonard'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='LinkedIn'
                value={linkedIn}
                onChange={e => setLinkedIn(e.target.value)}
                placeholder='https://linkedin.com/carterLeonard'
              />
            </Grid>
          </Fragment>
        )
      default:
        return 'Unknown Step'
    }
  }

  const renderContent = () => {
    if (activeStep === steps.length) {
      return (
        <Fragment>
          <Typography>All steps are completed!</Typography>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button size='large' variant='contained' onClick={handleReset}>
              Reset
            </Button>
          </Box>
        </Fragment>
      )
    } else {
      return (
        <form onSubmit={e => e.preventDefault()}>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                {steps[activeStep].title}
              </Typography>
              <Typography variant='caption' component='p'>
                {steps[activeStep].subtitle}
              </Typography>
            </Grid>
            {getStepContent(activeStep)}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                size='large'
                variant='outlined'
                color='secondary'
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
              <Button size='large' variant='contained' onClick={handleNext}>
                {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
              </Button>
            </Grid>
          </Grid>
        </form>
      )
    }
  }

  return (
    <Fragment>
      <StepperWrapper>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((step, index) => {
            return (
              <Step key={index}>
                <StepLabel StepIconComponent={StepperCustomDot}>
                  <div className='step-label'>
                    <div>
                      <Typography className='step-title'>{step.title}</Typography>
                      <Typography className='step-subtitle'>{step.subtitle}</Typography>
                    </div>
                  </div>
                </StepLabel>
              </Step>
            )
          })}
        </Stepper>
      </StepperWrapper>
      <Card sx={{ mt: 4 }}>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </Fragment>
  )
}

export default StepperAlternativeLabel
