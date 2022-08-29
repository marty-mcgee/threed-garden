// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Step from '@mui/material/Step'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import Divider from '@mui/material/Divider'
import Stepper from '@mui/material/Stepper'
import MenuItem from '@mui/material/MenuItem'
import StepLabel from '@mui/material/StepLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import OutlinedInput from '@mui/material/OutlinedInput'
import FormHelperText from '@mui/material/FormHelperText'
import InputAdornment from '@mui/material/InputAdornment'

// ** Third Party Imports
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup/dist/yup'

// ** Icons Imports
import EyeOutline from 'mdi-material-ui/EyeOutline'
import EyeOffOutline from 'mdi-material-ui/EyeOffOutline'

// ** Custom Components Imports
import StepperCustomDot from './StepperCustomDot'

// ** Styled Components
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

const defaultAccountValues = {
  email: '',
  username: '',
  password: '',
  'confirm-password': ''
}

const defaultPersonalValues = {
  country: '',
  language: [],
  'last-name': '',
  'first-name': ''
}

const defaultSocialValues = {
  google: '',
  twitter: '',
  facebook: '',
  linkedIn: ''
}

const accountSchema = yup.object().shape({
  username: yup.string().required(),
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
  'confirm-password': yup
    .string()
    .required()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
})

const personalSchema = yup.object().shape({
  country: yup.string().required(),
  'last-name': yup.string().required(),
  'first-name': yup.string().required(),
  language: yup.array().min(1).required()
})

const socialSchema = yup.object().shape({
  google: yup.string().required(),
  twitter: yup.string().required(),
  facebook: yup.string().required(),
  linkedIn: yup.string().required()
})

const StepperLinearWithValidation = () => {
  // ** States
  const [activeStep, setActiveStep] = useState(0)

  const [state, setState] = useState({
    password: '',
    password2: '',
    showPassword: false,
    showPassword2: false
  })

  // ** Hooks
  const {
    reset: accountReset,
    control: accountControl,
    handleSubmit: handleAccountSubmit,
    formState: { errors: accountErrors }
  } = useForm({
    defaultValues: defaultAccountValues,
    resolver: yupResolver(accountSchema)
  })

  const {
    reset: personalReset,
    control: personalControl,
    handleSubmit: handlePersonalSubmit,
    formState: { errors: personalErrors }
  } = useForm({
    defaultValues: defaultPersonalValues,
    resolver: yupResolver(personalSchema)
  })

  const {
    reset: socialReset,
    control: socialControl,
    handleSubmit: handleSocialSubmit,
    formState: { errors: socialErrors }
  } = useForm({
    defaultValues: defaultSocialValues,
    resolver: yupResolver(socialSchema)
  })

  // Handle Stepper
  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
    socialReset({ google: '', twitter: '', facebook: '', linkedIn: '' })
    accountReset({ email: '', username: '', password: '', 'confirm-password': '' })
    personalReset({ country: '', language: [], 'last-name': '', 'first-name': '' })
  }

  const onSubmit = () => {
    setActiveStep(activeStep + 1)
    if (activeStep === steps.length - 1) {
      toast.success('Form Submitted')
    }
  }

  // Handle Password
  const handleClickShowPassword = () => {
    setState({ ...state, showPassword: !state.showPassword })
  }

  const handleMouseDownPassword = event => {
    event.preventDefault()
  }

  // Handle Confirm Password
  const handleClickShowConfirmPassword = () => {
    setState({ ...state, showPassword2: !state.showPassword2 })
  }

  const handleMouseDownConfirmPassword = event => {
    event.preventDefault()
  }

  const getStepContent = step => {
    switch (step) {
      case 0:
        return (
          <form key={0} onSubmit={handleAccountSubmit(onSubmit)}>
            <Grid container spacing={5}>
              <Grid item xs={12}>
                <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {steps[0].title}
                </Typography>
                <Typography variant='caption' component='p'>
                  {steps[0].subtitle}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='username'
                    control={accountControl}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        value={value}
                        label='Username'
                        onChange={onChange}
                        placeholder='carterLeonard'
                        error={Boolean(accountErrors.username)}
                        aria-describedby='stepper-linear-account-username'
                      />
                    )}
                  />
                  {accountErrors.username && (
                    <FormHelperText sx={{ color: 'error.main' }} id='stepper-linear-account-username'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='email'
                    control={accountControl}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        type='email'
                        value={value}
                        label='Email'
                        onChange={onChange}
                        error={Boolean(accountErrors.email)}
                        placeholder='carterleonard@gmail.com'
                        aria-describedby='stepper-linear-account-email'
                      />
                    )}
                  />
                  {accountErrors.email && (
                    <FormHelperText sx={{ color: 'error.main' }} id='stepper-linear-account-email'>
                      {accountErrors.email.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel htmlFor='stepper-linear-account-password' error={Boolean(accountErrors.password)}>
                    Password
                  </InputLabel>
                  <Controller
                    name='password'
                    control={accountControl}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <OutlinedInput
                        value={value}
                        label='Password'
                        onChange={onChange}
                        id='stepper-linear-account-password'
                        error={Boolean(accountErrors.password)}
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
                    )}
                  />
                  {accountErrors.password && (
                    <FormHelperText sx={{ color: 'error.main' }} id='stepper-linear-account-password-helper'>
                      {accountErrors.password.message}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel
                    htmlFor='stepper-linear-account-confirm-password'
                    error={Boolean(accountErrors['confirm-password'])}
                  >
                    Confirm Password
                  </InputLabel>
                  <Controller
                    name='confirm-password'
                    control={accountControl}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <OutlinedInput
                        value={value}
                        onChange={onChange}
                        label='Confirm Password'
                        id='stepper-linear-account-confirm-password'
                        type={state.showPassword2 ? 'text' : 'password'}
                        error={Boolean(accountErrors['confirm-password'])}
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
                    )}
                  />
                  {accountErrors['confirm-password'] && (
                    <FormHelperText sx={{ color: 'error.main' }} id='stepper-linear-account-confirm-password-helper'>
                      {accountErrors['confirm-password'].message}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button size='large' variant='outlined' color='secondary' disabled>
                  Back
                </Button>
                <Button size='large' type='submit' variant='contained'>
                  Next
                </Button>
              </Grid>
            </Grid>
          </form>
        )
      case 1:
        return (
          <form key={1} onSubmit={handlePersonalSubmit(onSubmit)}>
            <Grid container spacing={5}>
              <Grid item xs={12}>
                <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {steps[1].title}
                </Typography>
                <Typography variant='caption' component='p'>
                  {steps[1].subtitle}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='first-name'
                    control={personalControl}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        value={value}
                        label='First Name'
                        onChange={onChange}
                        placeholder='Leonard'
                        error={Boolean(personalErrors['first-name'])}
                        aria-describedby='stepper-linear-personal-first-name'
                      />
                    )}
                  />
                  {personalErrors['first-name'] && (
                    <FormHelperText sx={{ color: 'error.main' }} id='stepper-linear-personal-first-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='last-name'
                    control={personalControl}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        value={value}
                        label='Last Name'
                        onChange={onChange}
                        placeholder='Carter'
                        error={Boolean(personalErrors['last-name'])}
                        aria-describedby='stepper-linear-personal-last-name'
                      />
                    )}
                  />
                  {personalErrors['last-name'] && (
                    <FormHelperText sx={{ color: 'error.main' }} id='stepper-linear-personal-last-name'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel
                    id='stepper-linear-personal-country'
                    error={Boolean(personalErrors.country)}
                    htmlFor='stepper-linear-personal-country'
                  >
                    Country
                  </InputLabel>
                  <Controller
                    name='country'
                    control={personalControl}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        value={value}
                        label='Country'
                        onChange={onChange}
                        error={Boolean(personalErrors.country)}
                        labelId='stepper-linear-personal-country'
                        aria-describedby='stepper-linear-personal-country-helper'
                      >
                        <MenuItem value='UK'>UK</MenuItem>
                        <MenuItem value='USA'>USA</MenuItem>
                        <MenuItem value='Australia'>Australia</MenuItem>
                        <MenuItem value='Germany'>Germany</MenuItem>
                      </Select>
                    )}
                  />
                  {personalErrors.country && (
                    <FormHelperText sx={{ color: 'error.main' }} id='stepper-linear-personal-country-helper'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel
                    error={Boolean(personalErrors.language)}
                    htmlFor='stepper-linear-personal-language'
                    id='stepper-linear-personal-language-label'
                  >
                    Language
                  </InputLabel>
                  <Controller
                    name='language'
                    control={personalControl}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <Select
                        multiple
                        onChange={onChange}
                        id='stepper-linear-personal-language'
                        value={Array.isArray(value) ? value : []}
                        error={Boolean(personalErrors.language)}
                        labelId='stepper-linear-personal-language-label'
                        input={<OutlinedInput label='Language' id='stepper-linear-select-multiple-language' />}
                      >
                        <MenuItem value='English'>English</MenuItem>
                        <MenuItem value='French'>French</MenuItem>
                        <MenuItem value='Spanish'>Spanish</MenuItem>
                        <MenuItem value='Portuguese'>Portuguese</MenuItem>
                        <MenuItem value='Italian'>Italian</MenuItem>
                        <MenuItem value='German'>German</MenuItem>
                        <MenuItem value='Arabic'>Arabic</MenuItem>
                      </Select>
                    )}
                  />
                  {personalErrors.language && (
                    <FormHelperText sx={{ color: 'error.main' }} id='stepper-linear-personal-language-helper'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button size='large' variant='outlined' color='secondary' onClick={handleBack}>
                  Back
                </Button>
                <Button size='large' type='submit' variant='contained'>
                  Next
                </Button>
              </Grid>
            </Grid>
          </form>
        )
      case 2:
        return (
          <form key={2} onSubmit={handleSocialSubmit(onSubmit)}>
            <Grid container spacing={5}>
              <Grid item xs={12}>
                <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {steps[2].title}
                </Typography>
                <Typography variant='caption' component='p'>
                  {steps[2].subtitle}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='twitter'
                    control={socialControl}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        value={value}
                        label='Twitter'
                        onChange={onChange}
                        error={Boolean(socialErrors.twitter)}
                        placeholder='https://twitter.com/carterLeonard'
                        aria-describedby='stepper-linear-social-twitter'
                      />
                    )}
                  />
                  {socialErrors.twitter && (
                    <FormHelperText sx={{ color: 'error.main' }} id='stepper-linear-social-twitter'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='facebook'
                    control={socialControl}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        value={value}
                        label='Facebook'
                        onChange={onChange}
                        error={Boolean(socialErrors.facebook)}
                        placeholder='https://facebook.com/carterLeonard'
                        aria-describedby='stepper-linear-social-facebook'
                      />
                    )}
                  />
                  {socialErrors.facebook && (
                    <FormHelperText sx={{ color: 'error.main' }} id='stepper-linear-social-facebook'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='google'
                    control={socialControl}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        value={value}
                        label='Google+'
                        onChange={onChange}
                        error={Boolean(socialErrors.google)}
                        aria-describedby='stepper-linear-social-google'
                        placeholder='https://plus.google.com/carterLeonard'
                      />
                    )}
                  />
                  {socialErrors.google && (
                    <FormHelperText sx={{ color: 'error.main' }} id='stepper-linear-social-google'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <Controller
                    name='linkedIn'
                    control={socialControl}
                    rules={{ required: true }}
                    render={({ field: { value, onChange } }) => (
                      <TextField
                        value={value}
                        label='LinkedIn'
                        onChange={onChange}
                        error={Boolean(socialErrors.linkedIn)}
                        placeholder='https://linkedin.com/carterLeonard'
                        aria-describedby='stepper-linear-social-linkedIn'
                      />
                    )}
                  />
                  {socialErrors.linkedIn && (
                    <FormHelperText sx={{ color: 'error.main' }} id='stepper-linear-social-linkedIn'>
                      This field is required
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button size='large' variant='outlined' color='secondary' onClick={handleBack}>
                  Back
                </Button>
                <Button size='large' type='submit' variant='contained'>
                  Submit
                </Button>
              </Grid>
            </Grid>
          </form>
        )
      default:
        return null
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
      return getStepContent(activeStep)
    }
  }

  return (
    <Card>
      <CardContent>
        <StepperWrapper>
          <Stepper activeStep={activeStep}>
            {steps.map((step, index) => {
              const labelProps = {}
              if (index === activeStep) {
                labelProps.error = false
                if (
                  (accountErrors.email ||
                    accountErrors.username ||
                    accountErrors.password ||
                    accountErrors['confirm-password']) &&
                  activeStep === 0
                ) {
                  labelProps.error = true
                } else if (
                  (personalErrors.country ||
                    personalErrors.language ||
                    personalErrors['last-name'] ||
                    personalErrors['first-name']) &&
                  activeStep === 1
                ) {
                  labelProps.error = true
                } else if (
                  (socialErrors.google || socialErrors.twitter || socialErrors.facebook || socialErrors.linkedIn) &&
                  activeStep === 2
                ) {
                  labelProps.error = true
                } else {
                  labelProps.error = false
                }
              }

              return (
                <Step key={index}>
                  <StepLabel {...labelProps} StepIconComponent={StepperCustomDot}>
                    <div className='step-label'>
                      <Typography className='step-number'>0{index + 1}</Typography>
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
      </CardContent>

      <Divider sx={{ m: 0 }} />

      <CardContent>{renderContent()}</CardContent>
    </Card>
  )
}

export default StepperLinearWithValidation
