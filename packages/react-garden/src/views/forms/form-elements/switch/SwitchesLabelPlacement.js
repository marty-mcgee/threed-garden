// ** MUI Imports
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
