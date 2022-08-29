// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import subDays from 'date-fns/subDays'
import addDays from 'date-fns/addDays'
import DatePicker from 'react-datepicker'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersMinMax = () => {
  // ** States
  const [minDate, setMinDate] = useState(new Date())
  const [maxDate, setMaxDate] = useState(new Date())

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          id='min-date'
          selected={minDate}
          minDate={subDays(new Date(), 5)}
          onChange={date => setMinDate(date)}
          customInput={<CustomInput label='Min Date' />}
        />
      </Box>
      <Box>
        <DatePicker
          id='max-date'
          selected={maxDate}
          maxDate={addDays(new Date(), 5)}
          onChange={date => setMaxDate(date)}
          customInput={<CustomInput label='Max Date' />}
        />
      </Box>
    </Box>
  )
}

export default PickersMinMax
