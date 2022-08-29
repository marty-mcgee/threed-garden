// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import addDays from 'date-fns/addDays'
import setHours from 'date-fns/setHours'
import DatePicker from 'react-datepicker'
import setMinutes from 'date-fns/setMinutes'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersSpecificRange = () => {
  // ** States
  const [date, setDate] = useState(new Date())
  const [time, setTime] = useState(new Date())

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={date}
          id='specific-date'
          minDate={new Date()}
          maxDate={addDays(new Date(), 5)}
          onChange={date => setDate(date)}
          customInput={<CustomInput label='Specific Date Range' />}
        />
      </Box>
      <Box>
        <DatePicker
          showTimeSelect
          selected={time}
          id='specific-time'
          dateFormat='MM/dd/yyyy h:mm aa'
          onChange={date => setTime(date)}
          minTime={setHours(setMinutes(new Date(), 0), 17)}
          maxTime={setHours(setMinutes(new Date(), 30), 20)}
          customInput={<CustomInput label='Specific Time' />}
        />
      </Box>
    </Box>
  )
}

export default PickersSpecificRange
