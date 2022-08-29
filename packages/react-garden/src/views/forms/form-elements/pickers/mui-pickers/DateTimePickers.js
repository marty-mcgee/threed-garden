// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import DateTimePicker from '@mui/lab/DateTimePicker'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import MobileDateTimePicker from '@mui/lab/MobileDateTimePicker'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import fr from 'date-fns/locale/fr'
import ar from 'date-fns/locale/ar-SA'
import en from 'date-fns/locale/en-US'
import { useTranslation } from 'react-i18next'

const langObj = { fr, ar, en }

const DateTimePickers = () => {
  // ** State
  const [basicPicker, setBasicPicker] = useState(new Date())

  // ** Hooks
  const { i18n } = useTranslation()

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateTimePicker
          label='Basic'
          value={basicPicker}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateTimePicker
          disabled
          label='Disabled'
          value={basicPicker}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateTimePicker
          readOnly
          label='Readonly'
          value={basicPicker}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns} locale={langObj[i18n.language]}>
        <DateTimePicker
          label='Localization'
          value={basicPicker}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DateTimePicker
          value={basicPicker}
          label='Ignore date and time'
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
          minDateTime={new Date(`${new Date().getFullYear()}-01-01 12:00`)}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <MobileDateTimePicker
          label='For mobile'
          value={basicPicker}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
    </Box>
  )
}

export default DateTimePickers
