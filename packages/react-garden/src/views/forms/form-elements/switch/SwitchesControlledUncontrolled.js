// ** React Imports
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
