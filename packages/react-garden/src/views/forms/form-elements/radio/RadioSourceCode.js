export const RadioColorJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

const RadioColor = () => {
  return (
    <RadioGroup row aria-label='colored' name='colored' defaultValue='primary'>
      <FormControlLabel value='primary' control={<Radio />} label='Primary' />
      <FormControlLabel value='secondary' control={<Radio color='secondary' />} label='Secondary' />
      <FormControlLabel value='success' label='Success' control={<Radio color='success' />} />
      <FormControlLabel value='error' label='Error' control={<Radio color='error' />} />
      <FormControlLabel value='warning' label='Warning' control={<Radio color='warning' />} />
      <FormControlLabel value='info' label='Info' control={<Radio color='info' />} />
    </RadioGroup>
  )
}

export default RadioColor
`}</code>
  </pre>
)

export const RadioCustomizedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import { styled } from '@mui/material/styles'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import FormControl from '@mui/material/FormControl'
import Radio from '@mui/material/Radio'
import FormControlLabel from '@mui/material/FormControlLabel'

const BpIcon = styled('span')(({ theme }) => ({
  width: 16,
  height: 16,
  borderRadius: '50%',
  backgroundColor: theme.palette.mode === 'dark' ? '#394b59' : '#f5f8fa',
  'input:hover ~ &': {
    backgroundColor: theme.palette.mode === 'dark' ? '#30404d' : '#ebf1f5'
  },
  '.Mui-focusVisible &': {
    outlineOffset: 2,
    outline: '2px auto rgba(19,124,189,.6)'
  },
  'input:disabled ~ &': {
    boxShadow: 'none',
    background: theme.palette.mode === 'dark' ? 'rgba(57,75,89,.5)' : 'rgba(206,217,224,.5)'
  },
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 0 0 1px rgb(16 22 26 / 40%)'
      : 'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
  backgroundImage:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg,hsla(0,0%,100%,.05),hsla(0,0%,100%,0))'
      : 'linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))'
}))

const BpCheckedIcon = styled(BpIcon)({
  backgroundColor: '#137cbd',
  backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
  'input:hover ~ &': {
    backgroundColor: '#106ba3'
  },
  '&:before': {
    width: 16,
    height: 16,
    content: '""',
    display: 'block',
    backgroundImage: 'radial-gradient(#fff,#fff 28%,transparent 32%)'
  }
})

// Inspired by blueprintjs
const BpRadio = props => {
  return (
    <Radio
      {...props}
      disableRipple
      color='default'
      icon={<BpIcon />}
      checkedIcon={<BpCheckedIcon />}
      sx={{ '&:hover': { backgroundColor: 'transparent' } }}
    />
  )
}

const RadioCustomized = () => {
  return (
    <FormControl>
      <FormLabel component='legend'>Gender</FormLabel>
      <RadioGroup row defaultValue='female' aria-label='gender' name='customized-radios'>
        <FormControlLabel value='female' control={<BpRadio />} label='Female' />
        <FormControlLabel value='male' control={<BpRadio />} label='Male' />
        <FormControlLabel value='other' control={<BpRadio />} label='Other' />
        <FormControlLabel value='disabled' disabled control={<BpRadio />} label='Disabled' />
      </RadioGroup>
    </FormControl>
  )
}

export default RadioCustomized
`}</code>
  </pre>
)

export const RadioLabelPlacementJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'

const RadioLabelPlacement = () => {
  return (
    <FormControl>
      <RadioGroup row aria-label='position' name='vertical' defaultValue='top'>
        <FormControlLabel value='top' label='Top' labelPlacement='top' sx={{ mr: 8.8 }} control={<Radio />} />
        <FormControlLabel value='bottom' control={<Radio />} label='Bottom' labelPlacement='bottom' />
      </RadioGroup>
      <RadioGroup row aria-label='position' name='horizontal' defaultValue='start' sx={{ mt: 4 }}>
        <FormControlLabel value='start' label='Start' labelPlacement='start' sx={{ mr: 4 }} control={<Radio />} />
        <FormControlLabel value='end' control={<Radio />} label='End' />
      </RadioGroup>
    </FormControl>
  )
}

export default RadioLabelPlacement
`}</code>
  </pre>
)

export const RadioControlledUncontrolledJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Radio from '@mui/material/Radio'
import Typography from '@mui/material/Typography'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

const RadioControlledUncontrolled = () => {
  // ** State
  const [value, setValue] = useState('controlled-checked')

  const handleChange = event => {
    setValue(event.target.value)
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sm={6}>
        <Typography>Controlled</Typography>
        <RadioGroup row aria-label='controlled' name='controlled' value={value} onChange={handleChange}>
          <FormControlLabel value='controlled-checked' control={<Radio />} label='Checked' />
          <FormControlLabel value='controlled-unchecked' control={<Radio />} label='Unchecked' />
        </RadioGroup>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography>Uncontrolled</Typography>
        <RadioGroup row aria-label='uncontrolled' name='uncontrolled' defaultValue='uncontrolled-checked'>
          <FormControlLabel value='uncontrolled-checked' control={<Radio />} label='Checked' />
          <FormControlLabel value='uncontrolled-unchecked' control={<Radio />} label='Unchecked' />
        </RadioGroup>
      </Grid>
    </Grid>
  )
}

export default RadioControlledUncontrolled
`}</code>
  </pre>
)

export const RadioGroupJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'

const RadioGroupComponent = () => {
  // ** State
  const [value, setValue] = useState('checked')

  const handleChange = event => {
    setValue(event.target.value)
  }

  return (
    <FormControl sx={{ flexWrap: 'wrap', flexDirection: 'row' }}>
      <RadioGroup row value={value} name='simple-radio' onChange={handleChange} aria-label='simple-radio'>
        <FormControlLabel value='checked' control={<Radio />} label='Checked' />
        <FormControlLabel value='unchecked' control={<Radio />} label='Unchecked' />
      </RadioGroup>

      <RadioGroup row value='disabled-checked' name='simple-disabled-radio' aria-label='simple-disabled-radio'>
        <FormControlLabel disabled value='disabled-checked' label='Disabled Checked' control={<Radio />} />
        <FormControlLabel disabled value='disabled-unchecked' label='Disabled Unchecked' control={<Radio />} />
      </RadioGroup>
    </FormControl>
  )
}

export default RadioGroupComponent
`}</code>
  </pre>
)

export const RadioShowErrorJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Radio from '@mui/material/Radio'
import Button from '@mui/material/Button'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import FormControlLabel from '@mui/material/FormControlLabel'

const RadioShowError = () => {
  // ** States
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [helperText, setHelperText] = useState('Choose wisely')

  const handleRadioChange = event => {
    setError(false)
    setHelperText(' ')
    setValue(event.target.value)
  }

  const handleSubmit = event => {
    event.preventDefault()
    if (value === 'best') {
      setError(false)
      setHelperText('You got it!')
    } else if (value === 'worst') {
      setError(true)
      setHelperText('Sorry, wrong answer!')
    } else {
      setError(true)
      setHelperText('Please select an option.')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormControl error={error}>
        <FormLabel component='legend'>Pop quiz: MUI is...</FormLabel>
        <RadioGroup aria-label='quiz' name='quiz' value={value} onChange={handleRadioChange}>
          <FormControlLabel value='best' control={<Radio />} label='The best!' />
          <FormControlLabel value='worst' control={<Radio />} label='The worst.' />
        </RadioGroup>
        <FormHelperText>{helperText}</FormHelperText>
        <Button type='submit' variant='outlined' sx={{ mt: 3 }}>
          Check Answer
        </Button>
      </FormControl>
    </form>
  )
}

export default RadioShowError
`}</code>
  </pre>
)

export const RadioSizesJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

const RadioSizes = () => {
  return (
    <RadioGroup row aria-label='sizes' name='sizes' defaultValue='small'>
      <FormControlLabel value='small' control={<Radio size='small' />} label='Small' />
      <FormControlLabel value='default' control={<Radio />} label='Default' />
    </RadioGroup>
  )
}

export default RadioSizes
`}</code>
  </pre>
)

export const RadioStandaloneJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Radio from '@mui/material/Radio'

const RadioStandalone = () => {
  // ** State
  const [selectedValue, setSelectedValue] = useState('a')

  const handleChange = event => {
    setSelectedValue(event.target.value)
  }

  return (
    <div>
      <Radio
        value='a'
        onChange={handleChange}
        name='radio-button-demo'
        checked={selectedValue === 'a'}
        inputProps={{ 'aria-label': 'A' }}
      />
      <Radio
        value='b'
        onChange={handleChange}
        name='radio-button-demo'
        checked={selectedValue === 'b'}
        inputProps={{ 'aria-label': 'B' }}
      />
    </div>
  )
}

export default RadioStandalone
`}</code>
  </pre>
)
