export const SwitchesBasicJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Switch from '@mui/material/Switch'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

const SwitchesBasic = () => {
  return (
    <FormGroup row>
      <FormControlLabel control={<Switch defaultChecked />} label='Checked' />
      <FormControlLabel control={<Switch />} label='Unchecked' />
      <FormControlLabel disabled control={<Switch defaultChecked />} label='Disabled Checked' />
      <FormControlLabel disabled control={<Switch />} label='Disabled Unchecked' />
    </FormGroup>
  )
}

export default SwitchesBasic
`}</code>
  </pre>
)

export const SwitchesColorsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Switch from '@mui/material/Switch'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

const SwitchesColors = () => {
  return (
    <FormGroup row>
      <FormControlLabel control={<Switch defaultChecked />} label='Primary' />
      <FormControlLabel control={<Switch defaultChecked color='secondary' />} label='Secondary' />
      <FormControlLabel control={<Switch defaultChecked color='success' />} label='Success' />
      <FormControlLabel control={<Switch defaultChecked color='error' />} label='Error' />
      <FormControlLabel control={<Switch defaultChecked color='warning' />} label='Warning' />
      <FormControlLabel control={<Switch defaultChecked color='info' />} label='Info' />
    </FormGroup>
  )
}

export default SwitchesColors
`}</code>
  </pre>
)

export const SwitchesControlledUncontrolledJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Switch from '@mui/material/Switch'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

const SwitchesControlledUncontrolled = () => {
  // ** State
  const [checked, setChecked] = useState(false)

  const handleChange = event => {
    setChecked(event.target.checked)
  }

  return (
    <FormGroup row>
      <FormControlLabel label='Controlled' control={<Switch checked={checked} onChange={handleChange} />} />
      <FormControlLabel control={<Switch />} label='Uncontrolled' />
    </FormGroup>
  )
}

export default SwitchesControlledUncontrolled
`}</code>
  </pre>
)

export const SwitchesCustomizedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Switch from '@mui/material/Switch'
import { styled } from '@mui/material/styles'
import MuiFormControlLabel from '@mui/material/FormControlLabel'

// Styled FormControlLabel component
const FormControlLabel = styled(MuiFormControlLabel)(({ theme }) => ({
  marginLeft: 0,
  '& .MuiSwitch-root': {
    width: 42,
    height: 26,
    padding: 0,
    marginRight: theme.spacing(3),
    '& .MuiSwitch-switchBase': {
      padding: 1,
      '&.Mui-checked': {
        transform: 'translateX(16px)',
        color: theme.palette.common.white,
        '& + .MuiSwitch-track': {
          opacity: 1,
          border: 'none',
          backgroundColor: '#52d869'
        }
      }
    },
    '& .MuiSwitch-thumb': {
      width: 24,
      height: 24
    },
    '& .MuiSwitch-track': {
      opacity: 1,
      borderRadius: 13,
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.action.selected : theme.palette.grey[50],
      border: 1px solid {theme.palette.grey[400]},
      transition: theme.transitions.create(['background-color', 'border'])
    }
  }
}))
const SwitchesCustomized = () => <FormControlLabel label='iOS Style' control={<Switch defaultChecked />} />

export default SwitchesCustomized
`}</code>
  </pre>
)

export const SwitchesLabelPlacementJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Switch from '@mui/material/Switch'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

const SwitchedLabelPlacement = () => {
  return (
    <div>
      <FormGroup row>
        <FormControlLabel value='top' label='Top' labelPlacement='top' sx={{ mr: 8 }} control={<Switch />} />
        <FormControlLabel value='bottom' control={<Switch />} label='Bottom' labelPlacement='bottom' />
      </FormGroup>
      <FormGroup row sx={{ mt: 4 }}>
        <FormControlLabel value='start' label='Start' labelPlacement='start' sx={{ mr: 4 }} control={<Switch />} />
        <FormControlLabel value='end' control={<Switch />} label='End' labelPlacement='end' />
      </FormGroup>
    </div>
  )
}

export default SwitchedLabelPlacement
`}</code>
  </pre>
)

export const SwitchesSizesJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Switch from '@mui/material/Switch'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

const SwitchesSizes = () => {
  return (
    <FormGroup row>
      <FormControlLabel control={<Switch size='small' />} label='Small' />
      <FormControlLabel control={<Switch />} label='Default' />
    </FormGroup>
  )
}

export default SwitchesSizes
`}</code>
  </pre>
)

export const SwitchesStandaloneJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Switch from '@mui/material/Switch'

const SwitchesStandalone = () => {
  return (
    <div>
      <Switch defaultChecked />
      <Switch />
      <Switch disabled defaultChecked />
      <Switch disabled />
    </div>
  )
}

export default SwitchesStandalone
`}</code>
  </pre>
)
