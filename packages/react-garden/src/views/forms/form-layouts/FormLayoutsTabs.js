// ** React Imports
import { forwardRef, useState } from 'react'

// ** MUI Imports
import Tab from '@mui/material/Tab'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import TabContext from '@mui/lab/TabContext'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import CardActions from '@mui/material/CardActions'
import OutlinedInput from '@mui/material/OutlinedInput'
import InputAdornment from '@mui/material/InputAdornment'
import Select from '@mui/material/Select'

// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Icons Imports
import EyeOutline from 'mdi-material-ui/EyeOutline'
import EyeOffOutline from 'mdi-material-ui/EyeOffOutline'

const CustomInput = forwardRef((props, ref) => {
  return <TextField fullWidth {...props} inputRef={ref} label='Birth Date' autoComplete='off' />
})

const FormLayoutsTabs = () => {
  // ** States
  const [value, setValue] = useState('personal-info')
  const [date, setDate] = useState(null)
  const [language, setLanguage] = useState([])

  const [values, setValues] = useState({
    password: '',
    password2: '',
    showPassword: false,
    showPassword2: false
  })

  const handleTabsChange = (event, newValue) => {
    setValue(newValue)
  }

  // Handle Password
  const handlePasswordChange = prop => event => {
    setValues({ ...values, [prop]: event.target.value })
  }

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword })
  }

  const handleMouseDownPassword = event => {
    event.preventDefault()
  }

  // Handle Confirm Password
  const handleConfirmChange = prop => event => {
    setValues({ ...values, [prop]: event.target.value })
  }

  const handleClickShowConfirmPassword = () => {
    setValues({ ...values, showPassword2: !values.showPassword2 })
  }

  const handleMouseDownConfirmPassword = event => {
    event.preventDefault()
  }

  // Handle Select
  const handleSelectChange = event => {
    setLanguage(event.target.value)
  }

  return (
    <Card>
      <TabContext value={value}>
        <TabList
          variant='scrollable'
          scrollButtons={false}
          onChange={handleTabsChange}
          sx={{ borderBottom: theme => `1px solid ${theme.palette.divider}` }}
        >
          <Tab value='personal-info' label='Personal Info' />
          <Tab value='account-details' label='Account Details' />
          <Tab value='social-links' label='Social Links' />
        </TabList>
        <form onSubmit={e => e.preventDefault()}>
          <CardContent>
            <TabPanel value='personal-info'>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='First Name' placeholder='Leonard' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='Last Name' placeholder='Carter' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id='form-layouts-tabs-select-label'>Country</InputLabel>
                    <Select
                      label='Country'
                      defaultValue=''
                      id='form-layouts-tabs-select'
                      labelId='form-layouts-tabs-select-label'
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
                    <InputLabel id='form-layouts-tabs-multiple-select-label'>Language</InputLabel>
                    <Select
                      multiple
                      value={language}
                      onChange={handleSelectChange}
                      id='form-layouts-tabs-multiple-select'
                      labelId='form-layouts-tabs-multiple-select-label'
                      input={<OutlinedInput label='Language' id='tabs-select-multiple-language' />}
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
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    selected={date}
                    showYearDropdown
                    showMonthDropdown
                    id='form-layouts-tabs-date'
                    placeholderText='MM-DD-YYYY'
                    customInput={<CustomInput />}
                    onChange={date => setDate(date)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='Phone No.' placeholder='+1-123-456-8790' />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value='account-details'>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='Username' placeholder='carterLeonard' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type='email' label='Email' placeholder='carterleonard@gmail.com' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel htmlFor='form-layouts-tabs-password'>Password</InputLabel>
                    <OutlinedInput
                      label='Password'
                      value={values.password}
                      id='form-layouts-tabs-password'
                      onChange={handlePasswordChange('password')}
                      type={values.showPassword ? 'text' : 'password'}
                      endAdornment={
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={handleClickShowPassword}
                            onMouseDown={handleMouseDownPassword}
                            aria-label='toggle password visibility'
                          >
                            {values.showPassword ? <EyeOutline /> : <EyeOffOutline />}
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel htmlFor='form-layouts-tabs-password-2'>Confirm Password</InputLabel>
                    <OutlinedInput
                      value={values.password2}
                      label='Confirm Password'
                      id='form-layouts-tabs-password-2'
                      onChange={handleConfirmChange('password2')}
                      type={values.showPassword2 ? 'text' : 'password'}
                      endAdornment={
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            aria-label='toggle password visibility'
                            onClick={handleClickShowConfirmPassword}
                            onMouseDown={handleMouseDownConfirmPassword}
                          >
                            {values.showPassword2 ? <EyeOutline /> : <EyeOffOutline />}
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value='social-links'>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='Twitter' placeholder='https://twitter.com/carterLeonard' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='Facebook' placeholder='https://facebook.com/carterLeonard' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='Google+' placeholder='https://plus.google.com/carterLeonard' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='LinkedIn' placeholder='https://linkedin.com/carterLeonard' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='Instagram' placeholder='https://instagram.com/carterLeonard' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label='Quora' placeholder='https://quora.com/carterLeonard' />
                </Grid>
              </Grid>
            </TabPanel>
          </CardContent>
          <Divider sx={{ m: 0 }} />
          <CardActions>
            <Button size='large' type='submit' sx={{ mr: 2 }} variant='contained'>
              Submit
            </Button>
            <Button size='large' variant='outlined' color='secondary'>
              Cancel
            </Button>
          </CardActions>
        </form>
      </TabContext>
    </Card>
  )
}

export default FormLayoutsTabs
