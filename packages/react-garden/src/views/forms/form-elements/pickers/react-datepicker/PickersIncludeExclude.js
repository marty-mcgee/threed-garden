// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import addDays from 'date-fns/addDays'
import subDays from 'date-fns/subDays'
import setHours from 'date-fns/setHours'
import DatePicker from 'react-datepicker'
import setMinutes from 'date-fns/setMinutes'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersIncludeExclude = () => {
  // ** States
  const [date, setDate] = useState(new Date())
  const [dateExclude, setDateExclude] = useState(new Date())
  const [time, setTime] = useState(setHours(setMinutes(new Date(), 30), 16))
  const [timeExclude, setTimeExclude] = useState(setHours(setMinutes(new Date(), 30), 16))

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={date}
          id='include-dates'
          onChange={date => setDate(date)}
          customInput={<CustomInput label='Include Dates' />}
          includeDates={[new Date(), addDays(new Date(), 1)]}
        />
      </Box>
      <Box>
        <DatePicker
          id='exclude-dates'
          selected={dateExclude}
          onChange={date => setDateExclude(date)}
          customInput={<CustomInput label='Exclude Dates' />}
          excludeDates={[subDays(new Date(), 1), subDays(new Date(), 2)]}
        />
      </Box>
      <Box>
        <DatePicker
          showTimeSelect
          selected={time}
          id='include-time'
          dateFormat='MM/dd/yyyy h:mm aa'
          onChange={date => setTime(date)}
          customInput={<CustomInput label='Include Time' />}
          includeTimes={[
            setHours(setMinutes(new Date(), 0), 17),
            setHours(setMinutes(new Date(), 30), 18),
            setHours(setMinutes(new Date(), 30), 19),
            setHours(setMinutes(new Date(), 30), 17)
          ]}
        />
      </Box>
      <Box>
        <DatePicker
          showTimeSelect
          id='exclude-time'
          selected={timeExclude}
          dateFormat='MM/dd/yyyy h:mm aa'
          onChange={date => setTimeExclude(date)}
          customInput={<CustomInput label='Exclude Time' />}
          excludeTimes={[
            setHours(setMinutes(new Date(), 0), 17),
            setHours(setMinutes(new Date(), 30), 18),
            setHours(setMinutes(new Date(), 30), 19),
            setHours(setMinutes(new Date(), 30), 17)
          ]}
        />
      </Box>
    </Box>
  )
}

export default PickersIncludeExclude
