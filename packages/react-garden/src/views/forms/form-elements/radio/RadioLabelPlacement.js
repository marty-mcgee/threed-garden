// ** MUI Imports
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
