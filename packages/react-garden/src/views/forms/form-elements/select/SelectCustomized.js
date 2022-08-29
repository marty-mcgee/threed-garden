// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import InputBase from '@mui/material/InputBase'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MuiFormControl from '@mui/material/FormControl'

// Styled FormControl component
const FormControl = styled(MuiFormControl)(({ theme }) => ({
  '& .MuiFormLabel-root.Mui-focused': {
    color: theme.palette.info.main
  },
  '& .MuiInputLabel-root': {
    left: -14,
    zIndex: 0
  },
  '& > .MuiInputBase-root': {
    marginTop: theme.spacing(4),
    '&.MuiInput-root:before, &.MuiInput-root:after': {
      border: 0
    }
  },
  '& .MuiInputBase-input': {
    fontSize: 16,
    borderRadius: 4,
    position: 'relative',
    padding: '10px 26px 10px 12px',
    backgroundColor: theme.palette.background.paper,
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    border: theme.palette.mode === 'light' ? '1px solid #ced4da' : `1px solid ${theme.palette.divider}`,
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(','),
    '&:focus': {
      borderRadius: 4,
      borderColor: '#80bdff',
      boxShadow: '0 0 0 0.2rem rgba(0,123,255,0.25)'
    }
  }
}))

const SelectCustomized = () => {
  // ** State
  const [value, setValue] = useState('')

  const handleChange = event => {
    setValue(event.target.value)
  }

  return (
    <div className='demo-space-x'>
      <FormControl>
        <InputLabel id='demo-customized-select-label'>Age</InputLabel>
        <Select
          value={value}
          input={<InputBase />}
          onChange={handleChange}
          id='demo-customized-select'
          labelId='demo-customized-select-label'
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
        <InputLabel htmlFor='demo-customized-select-native'>Age</InputLabel>
        <Select native input={<InputBase />} id='demo-customized-select-native' value={value} onChange={handleChange}>
          <option aria-label='None' value='' />
          <option value={10}>Ten</option>
          <option value={20}>Twenty</option>
          <option value={30}>Thirty</option>
        </Select>
      </FormControl>
    </div>
  )
}

export default SelectCustomized
