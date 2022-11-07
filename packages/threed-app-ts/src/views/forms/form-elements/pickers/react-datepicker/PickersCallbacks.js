// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersCallbacks = () => {
  // ** States
  const [date, setDate] = useState(new Date())

  const handlePickerCallback = msg => {
    toast(msg, { duration: 2000 })
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={date}
          id='callback-open'
          dateFormat='MM/dd/yyyy'
          onChange={date => setDate(date)}
          customInput={<CustomInput label='Open & Closed' />}
          onCalendarOpen={() => handlePickerCallback(`Selected Date: ${new Date(date || '').toLocaleDateString()}`)}
          onCalendarClose={() => handlePickerCallback(`Selected Date: ${new Date(date || '').toLocaleDateString()}`)}
        />
      </Box>
      <Box>
        <DatePicker
          selected={date}
          id='callback-blur'
          onChange={date => setDate(date)}
          customInput={<CustomInput label='Blur' />}
          onBlur={() => handlePickerCallback('Picker Closed')}
        />
      </Box>
      <Box>
        <DatePicker
          selected={date}
          id='callback-change'
          customInput={<CustomInput label='onChange' />}
          onChange={date => {
            setDate(date)
            handlePickerCallback(`Selected Date: ${new Date(date || '').toLocaleDateString()}`)
          }}
        />
      </Box>
    </Box>
  )
}

export default PickersCallbacks
