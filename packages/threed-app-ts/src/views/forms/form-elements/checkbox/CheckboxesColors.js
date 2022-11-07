// ** MUI Imports
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
