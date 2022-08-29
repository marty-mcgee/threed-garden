// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'

const SelectControlledUncontrolled = () => {
  // ** State
  const [value, setValue] = useState('')

  const handleChange = event => {
    setValue(event.target.value)
  }

  return (
    <div className='demo-space-x'>
      <FormControl>
        <InputLabel id='controlled-select-label'>Controlled</InputLabel>
        <Select
          value={value}
          label='Controlled'
          id='controlled-select'
          onChange={handleChange}
          labelId='controlled-select-label'
        >
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
      <FormControl>
        <InputLabel id='uncontrolled-select-label'>Uncontrolled</InputLabel>
        <Select defaultValue='' label='Uncontrolled' id='uncontrolled-select' labelId='uncontrolled-select-label'>
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
    </div>
  )
}

export default SelectControlledUncontrolled
