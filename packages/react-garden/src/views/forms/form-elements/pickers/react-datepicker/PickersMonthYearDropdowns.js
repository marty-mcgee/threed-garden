// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersMonthYearDropdowns = () => {
  // ** States
  const [year, setYear] = useState(new Date())
  const [month, setMonth] = useState(new Date())
  const [monthYear, setMonthYear] = useState(new Date())

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={month}
          showMonthDropdown
          id='month-dropdown'
          placeholderText='MM-DD-YYYY'
          onChange={date => setMonth(date)}
          customInput={<CustomInput label='Month Dropdown' />}
        />
      </Box>
      <Box>
        <DatePicker
          selected={year}
          showYearDropdown
          id='year-dropdown'
          placeholderText='MM-DD-YYYY'
          onChange={date => setYear(date)}
          customInput={<CustomInput label='Year Dropdown' />}
        />
      </Box>
      <Box>
        <DatePicker
          showYearDropdown
          showMonthDropdown
          selected={monthYear}
          id='month-year-dropdown'
          placeholderText='MM-DD-YYYY'
          onChange={date => setMonthYear(date)}
          customInput={<CustomInput label='Month & Year Dropdown' />}
        />
      </Box>
    </Box>
  )
}

export default PickersMonthYearDropdowns
