export const CheckboxesBasicJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

const CheckboxesBasic = () => {
  return (
    <FormGroup row>
      <FormControlLabel label='Checked' control={<Checkbox defaultChecked name='basic-checked' />} />
      <FormControlLabel label='Unchecked' control={<Checkbox name='basic-unchecked' />} />
      <FormControlLabel
        disabled
        label='Disabled Checked'
        control={<Checkbox defaultChecked name='basic-disabled-checked' />}
      />
      <FormControlLabel disabled label='Disabled Unchecked' control={<Checkbox name='basic-disabled-unchecked' />} />
    </FormGroup>
  )
}

export default CheckboxesBasic
`}</code>
  </pre>
)

export const CheckboxesColorsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

const CheckboxesColors = () => {
  return (
    <FormGroup row>
      <FormControlLabel label='Primary' control={<Checkbox defaultChecked name='color-primary' />} />
      <FormControlLabel
        label='Secondary'
        control={<Checkbox defaultChecked name='color-secondary' color='secondary' />}
      />
      <FormControlLabel label='Success' control={<Checkbox defaultChecked name='color-success' color='success' />} />
      <FormControlLabel label='Error' control={<Checkbox defaultChecked name='color-error' color='error' />} />
      <FormControlLabel label='Warning' control={<Checkbox defaultChecked name='color-warning' color='warning' />} />
      <FormControlLabel label='Info' control={<Checkbox defaultChecked name='color-info' color='info' />} />
    </FormGroup>
  )
}

export default CheckboxesColors
`}</code>
  </pre>
)

export const CheckboxesControlledUncontrolledJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

const CheckboxesControlledUncontrolled = () => {
  // ** State
  const [checked, setChecked] = useState(true)

  const handleChange = event => {
    setChecked(event.target.checked)
  }

  return (
    <FormGroup row>
      <FormControlLabel
        label='Controlled'
        control={<Checkbox checked={checked} onChange={handleChange} name='controlled' />}
      />
      <FormControlLabel label='Uncontrolled' control={<Checkbox defaultChecked name='uncontrolled' />} />
    </FormGroup>
  )
}

export default CheckboxesControlledUncontrolled
`}</code>
  </pre>
)

export const CheckboxesCustomIconsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

// ** Icons Imports
import Star from 'mdi-material-ui/Star'
import Heart from 'mdi-material-ui/Heart'
import StarOutline from 'mdi-material-ui/StarOutline'
import HeartOutline from 'mdi-material-ui/HeartOutline'

const CheckboxesCustomIcons = () => {
  return (
    <FormGroup row>
      <FormControlLabel
        label='Heart'
        control={<Checkbox defaultChecked name='size-small' icon={<HeartOutline />} checkedIcon={<Heart />} />}
      />
      <FormControlLabel
        label='Star'
        control={<Checkbox defaultChecked name='size-small' icon={<StarOutline />} checkedIcon={<Star />} />}
      />
    </FormGroup>
  )
}

export default CheckboxesCustomIcons
`}</code>
  </pre>
)

export const CheckboxesCustomizedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import { styled } from '@mui/material/styles'
import Checkbox from '@mui/material/Checkbox'

const BpIcon = styled('span')(({ theme }) => ({
  width: 16,
  height: 16,
  borderRadius: 3,
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
    backgroundImage:
      "url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath" +
      " fill-rule='evenodd' clip-rule='evenodd' d='M12 5c-.28 0-.53.11-.71.29L7 9.59l-2.29-2.3a1.003 " +
      "1.003 0 00-1.42 1.42l3 3c.18.18.43.29.71.29s.53-.11.71-.29l5-5A1.003 1.003 0 0012 5z' fill='%23fff'/%3E%3C/svg%3E")"
  }
})

// Inspired by blueprintjs
const BpCheckbox = props => {
  return (
    <Checkbox
      {...props}
      disableRipple
      color='default'
      icon={<BpIcon />}
      checkedIcon={<BpCheckedIcon />}
      inputProps={{ 'aria-label': 'Checkbox demo' }}
      sx={{ '&:hover': { backgroundColor: 'transparent' } }}
    />
  )
}

const CheckboxesCustomized = () => {
  return (
    <div>
      <BpCheckbox />
      <BpCheckbox defaultChecked />
      <BpCheckbox disabled />
    </div>
  )
}

export default CheckboxesCustomized
`}</code>
  </pre>
)

export const CheckboxesLabelPlacementJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

const CheckboxesLabelPlacement = () => {
  return (
    <div>
      <FormGroup row>
        <FormControlLabel value='top' label='Top' labelPlacement='top' control={<Checkbox />} sx={{ mr: 9.2 }} />
        <FormControlLabel value='bottom' label='Bottom' labelPlacement='bottom' control={<Checkbox />} />
      </FormGroup>
      <FormGroup row sx={{ mt: 4 }}>
        <FormControlLabel value='start' label='Start' control={<Checkbox />} labelPlacement='start' sx={{ mr: 4 }} />
        <FormControlLabel value='end' control={<Checkbox />} label='End' labelPlacement='end' />
      </FormGroup>
    </div>
  )
}

export default CheckboxesLabelPlacement
`}</code>
  </pre>
)

export const CheckboxesSizesJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

// ** Icons Imports
import CheckboxMarked from 'mdi-material-ui/CheckboxMarked'
import CheckboxBlankOutline from 'mdi-material-ui/CheckboxBlankOutline'

const CheckboxesSizes = () => {
  return (
    <FormGroup row>
      <FormControlLabel
        label='Small'
        control={
          <Checkbox
            defaultChecked
            name='size-small'
            icon={<CheckboxBlankOutline fontSize='small' />}
            checkedIcon={<CheckboxMarked fontSize='small' />}
          />
        }
      />
      <FormControlLabel label='Default' control={<Checkbox defaultChecked name='size-default' />} />
    </FormGroup>
  )
}

export default CheckboxesSizes
`}</code>
  </pre>
)

export const CheckboxesShowErrorJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormLabel from '@mui/material/FormLabel'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import FormControlLabel from '@mui/material/FormControlLabel'

const CheckboxesShowError = () => {
  // ** State
  const [state, setState] = useState({
    gilad: true,
    jason: false,
    antoine: false
  })

  // ** Vars
  const { gilad, jason, antoine } = state
  const error = [gilad, jason, antoine].filter(v => v).length !== 2

  const handleChange = event => {
    setState({ ...state, [event.target.name]: event.target.checked })
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <FormControl sx={{ mt: 4, mr: 4 }}>
        <FormLabel>Assign responsibility</FormLabel>
        <FormGroup>
          <FormControlLabel
            label='Gilad Gray'
            control={<Checkbox checked={gilad} onChange={handleChange} name='gilad' />}
          />
          <FormControlLabel
            label='Jason Killian'
            control={<Checkbox checked={jason} onChange={handleChange} name='jason' />}
          />
          <FormControlLabel
            label='Antoine Llorca'
            control={<Checkbox checked={antoine} onChange={handleChange} name='antoine' />}
          />
        </FormGroup>
        <FormHelperText>Be careful</FormHelperText>
      </FormControl>
      <FormControl required error={error} sx={{ mt: 4 }}>
        <FormLabel>Pick two</FormLabel>
        <FormGroup>
          <FormControlLabel
            label='Gilad Gray'
            control={<Checkbox checked={gilad} onChange={handleChange} name='gilad' />}
          />
          <FormControlLabel
            label='Jason Killian'
            control={<Checkbox checked={jason} onChange={handleChange} name='jason' />}
          />
          <FormControlLabel
            label='Antoine Llorca'
            control={<Checkbox checked={antoine} onChange={handleChange} name='antoine' />}
          />
        </FormGroup>
        <FormHelperText>You can display an error</FormHelperText>
      </FormControl>
    </Box>
  )
}

export default CheckboxesShowError
`}</code>
  </pre>
)
