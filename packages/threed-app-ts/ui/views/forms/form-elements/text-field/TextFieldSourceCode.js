export const TextFieldColorJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import TextField from '@mui/material/TextField'

const TextFieldColor = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <TextField id='color-outlined' label='Outlined success' color='success' />
      <TextField id='color-filled' label='Filled success' variant='filled' color='success' />
      <TextField id='color-standard' label='Standard success' color='success' variant='standard' />
    </form>
  )
}

export default TextFieldColor
`}</code>
  </pre>
)

export const TextFieldComponentsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Input from '@mui/material/Input'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import FilledInput from '@mui/material/FilledInput'
import OutlinedInput from '@mui/material/OutlinedInput'
import FormHelperText from '@mui/material/FormHelperText'

const TextFieldComponents = () => {
  // ** State
  const [name, setName] = useState('Composed TextField')

  const handleChange = event => {
    setName(event.target.value)
  }

  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <FormControl variant='standard'>
        <InputLabel htmlFor='component-simple'>Name</InputLabel>
        <Input id='component-simple' value={name} onChange={handleChange} />
      </FormControl>
      <FormControl variant='standard'>
        <InputLabel htmlFor='component-helper'>Name</InputLabel>
        <Input id='component-helper' value={name} onChange={handleChange} aria-describedby='component-helper-text' />
        <FormHelperText id='component-helper-text'>Some important helper text</FormHelperText>
      </FormControl>
      <FormControl disabled variant='standard'>
        <InputLabel htmlFor='component-disabled'>Name</InputLabel>
        <Input id='component-disabled' value={name} onChange={handleChange} />
        <FormHelperText>Disabled</FormHelperText>
      </FormControl>
      <FormControl error variant='standard'>
        <InputLabel htmlFor='component-error'>Name</InputLabel>
        <Input id='component-error' value={name} onChange={handleChange} aria-describedby='component-error-text' />
        <FormHelperText id='component-error-text'>Error</FormHelperText>
      </FormControl>
      <FormControl>
        <InputLabel htmlFor='component-outlined'>Name</InputLabel>
        <OutlinedInput id='component-outlined' value={name} onChange={handleChange} label='Name' />
      </FormControl>
      <FormControl variant='filled'>
        <InputLabel htmlFor='component-filled'>Name</InputLabel>
        <FilledInput id='component-filled' value={name} onChange={handleChange} />
      </FormControl>
    </form>
  )
}

export default TextFieldComponents
`}</code>
  </pre>
)

export const TextFieldControlledUncontrolledJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import TextField from '@mui/material/TextField'

const TextFieldControlledUncontrolled = () => {
  // ** State
  const [name, setName] = useState('Cat in the Hat')

  const handleChange = event => {
    setName(event.target.value)
  }

  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <TextField value={name} label='Controlled' onChange={handleChange} id='controlled-text-field' />
      <TextField id='uncontrolled-text-field' label='Uncontrolled' defaultValue='foo' />
    </form>
  )
}

export default TextFieldControlledUncontrolled
`}</code>
  </pre>
)

export const TextFieldCustomizedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import { alpha, styled } from '@mui/material/styles'
import MuiInputBase from '@mui/material/InputBase'

// Styled InputBase component
const InputBase = styled(MuiInputBase)(({ theme }) => ({
  marginTop: theme.spacing(4),
  '& .MuiInputBase-input': {
    fontSize: 16,
    width: 'auto',
    borderRadius: 4,
    padding: '10px 12px',
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    border: theme.palette.mode === 'light' ? '1px solid #ced4da' : 1px solid {theme.palette.divider},
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(','),
    '&:focus': {
      borderColor: theme.palette.primary.main,
      boxShadow: {alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem
    }
  }
}))

const TextFieldCustomized = () => {
  return (
    <form noValidate autoComplete='off'>
      <FormControl variant='standard'>
        <InputLabel shrink htmlFor='bootstrap-input' sx={{ transform: 'translate(0, -4px) scale(0.75)' }}>
          Bootstrap
        </InputLabel>
        <InputBase defaultValue='react-bootstrap' id='bootstrap-input' />
      </FormControl>
    </form>
  )
}

export default TextFieldCustomized
`}</code>
  </pre>
)

export const TextFieldIconsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Grid from '@mui/material/Grid'
import Input from '@mui/material/Input'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import InputAdornment from '@mui/material/InputAdornment'

// ** Icons Imports
import AccountCircleOutline from 'mdi-material-ui/AccountCircleOutline'

const TextFieldIcons = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <FormControl variant='standard'>
        <InputLabel htmlFor='input-with-icon-adornment'>With a start adornment</InputLabel>
        <Input
          id='input-with-icon-adornment'
          startAdornment={
            <InputAdornment position='start'>
              <AccountCircleOutline />
            </InputAdornment>
          }
        />
      </FormControl>
      <TextField
        label='TextField'
        variant='standard'
        id='input-with-icon-textfield'
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <AccountCircleOutline />
            </InputAdornment>
          )
        }}
      />
      <div>
        <Grid container spacing={2} alignItems='flex-end'>
          <Grid item>
            <AccountCircleOutline sx={{ color: theme => theme.palette.action.active }} />
          </Grid>
          <Grid item>
            <TextField variant='standard' id='input-with-icon-grid' label='With a grid' />
          </Grid>
        </Grid>
      </div>
    </form>
  )
}

export default TextFieldIcons
`}</code>
  </pre>
)

export const TextFieldInputAdornmentJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import IconButton from '@mui/material/IconButton'
import FormControl from '@mui/material/FormControl'
import OutlinedInput from '@mui/material/OutlinedInput'
import FormHelperText from '@mui/material/FormHelperText'
import InputAdornment from '@mui/material/InputAdornment'

// ** Icons Imports
import EyeOutline from 'mdi-material-ui/EyeOutline'
import EyeOffOutline from 'mdi-material-ui/EyeOffOutline'

const TextFieldInputAdornment = () => {
  // ** State
  const [values, setValues] = useState({
    weight: '',
    password: '',
    showPassword: false
  })

  const handleChange = prop => event => {
    setValues({ ...values, [prop]: event.target.value })
  }

  const handleClickShowPassword = () => {
    setValues({ ...values, showPassword: !values.showPassword })
  }

  const handleMouseDownPassword = event => {
    event.preventDefault()
  }

  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <TextField
        id='icons-start-adornment'
        label='With normal TextField'
        InputProps={{
          startAdornment: <InputAdornment position='start'>Kg</InputAdornment>
        }}
      />
      <FormControl>
        <OutlinedInput
          value={values.weight}
          id='icons-adornment-weight'
          onChange={handleChange('weight')}
          aria-describedby='icons-weight-helper-text'
          endAdornment={<InputAdornment position='end'>Kg</InputAdornment>}
          inputProps={{
            'aria-label': 'weight'
          }}
        />
        <FormHelperText id='icons-weight-helper-text'>Weight</FormHelperText>
      </FormControl>
      <FormControl>
        <InputLabel htmlFor='icons-adornment-password'>Password</InputLabel>
        <OutlinedInput
          label='Password'
          value={values.password}
          id='icons-adornment-password'
          onChange={handleChange('password')}
          type={values.showPassword ? 'text' : 'password'}
          endAdornment={
            <InputAdornment position='end'>
              <IconButton
                edge='end'
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                aria-label='toggle password visibility'
              >
                {values.showPassword ? <EyeOutline fontSize='small' /> : <EyeOffOutline fontSize='small' />}
              </IconButton>
            </InputAdornment>
          }
        />
      </FormControl>
    </form>
  )
}

export default TextFieldInputAdornment
`}</code>
  </pre>
)

export const TextFieldFormPropsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import TextField from '@mui/material/TextField'

const TextFieldFormProps = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <TextField required id='form-props-required' label='Required' defaultValue='Hello World' />
      <TextField disabled id='form-props-disabled' label='Disabled' defaultValue='Hello World' />
      <TextField type='password' label='Password' id='form-props-password-input' autoComplete='current-password' />
      <TextField
        label='Read Only'
        defaultValue='Hello World'
        id='form-props-read-only-input'
        InputProps={{ readOnly: true }}
      />
      <TextField type='number' label='Number' id='form-props-number' InputLabelProps={{ shrink: true }} />
      <TextField
        label='Label'
        placeholder='Placeholder'
        id='form-props-full-width'
        InputLabelProps={{ shrink: true }}
      />
      <TextField id='form-props-search' label='Search field' type='search' />
      <TextField
        label='Helper text'
        id='form-props-helperText'
        defaultValue='Default Value'
        helperText='Some important text'
      />
    </form>
  )
}

export default TextFieldFormProps
`}</code>
  </pre>
)

export const TextFieldSizesJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import TextField from '@mui/material/TextField'

const TextFieldSizes = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <TextField label='Size' id='size-small' defaultValue='Small' size='small' />
      <TextField label='Size' id='size-normal' defaultValue='Normal' />
    </form>
  )
}

export default TextFieldSizes
`}</code>
  </pre>
)

export const TextFieldInputsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Input from '@mui/material/Input'

const TextFieldInputs = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <Input defaultValue='Hello world' inputProps={{ 'aria-label': 'description' }} />
      <Input placeholder='Placeholder' inputProps={{ 'aria-label': 'description' }} />
      <Input defaultValue='Disabled' disabled inputProps={{ 'aria-label': 'description' }} />
      <Input defaultValue='Error' error inputProps={{ 'aria-label': 'description' }} />
    </form>
  )
}

export default TextFieldInputs
`}</code>
  </pre>
)

export const TextFieldValidationJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import TextField from '@mui/material/TextField'

const TextFieldValidation = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <TextField error id='validation-error' label='Error' defaultValue='Hello World' />
      <TextField
        error
        label='Error'
        defaultValue='Hello World'
        helperText='Incorrect entry.'
        id='validation-error-helper-text'
      />
    </form>
  )
}

export default TextFieldValidation
`}</code>
  </pre>
)

export const TextFieldLayoutJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'

const TextFieldLayout = () => {
  return (
    <Box noValidate component='form' autoComplete='off' sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <TextField fullWidth label='Full width' id='outlined-full-width' sx={{ mb: 4 }} />
      <TextField
        label='None'
        sx={{ mr: 4 }}
        id='outlined-margin-none'
        defaultValue='Margin None'
        helperText='Some important text'
      />
      <TextField
        label='Dense'
        margin='dense'
        sx={{ mr: 4 }}
        id='outlined-margin-dense'
        defaultValue='Margin Dense'
        helperText='Some important text'
      />
      <TextField
        label='Normal'
        margin='normal'
        id='outlined-margin-normal'
        defaultValue='Margin Normal'
        helperText='Some important text'
      />
    </Box>
  )
}

export default TextFieldLayout
`}</code>
  </pre>
)

export const TextFieldVariantJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import TextField from '@mui/material/TextField'

const TextFieldVariant = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <TextField id='outlined-basic' label='Outlined' />
      <TextField id='filled-basic' label='Filled' variant='filled' />
      <TextField id='standard-basic' label='Standard' variant='standard' />
    </form>
  )
}

export default TextFieldVariant
`}</code>
  </pre>
)
