// ** MUI Imports
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
