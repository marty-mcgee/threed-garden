// ** React Imports
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
