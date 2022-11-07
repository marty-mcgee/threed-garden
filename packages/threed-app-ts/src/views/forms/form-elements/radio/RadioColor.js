// ** MUI Imports
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
