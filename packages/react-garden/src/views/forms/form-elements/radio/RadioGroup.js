// ** React Imports
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
