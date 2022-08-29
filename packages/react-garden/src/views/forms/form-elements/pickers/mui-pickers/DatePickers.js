// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import DatePicker from '@mui/lab/DatePicker'
import TextField from '@mui/material/TextField'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import MobileDatePicker from '@mui/lab/MobileDatePicker'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import fr from 'date-fns/locale/fr'
import ar from 'date-fns/locale/ar-SA'
import en from 'date-fns/locale/en-US'
import { useTranslation } from 'react-i18next'

const langObj = { fr, ar, en }

const DatePickers = () => {
  // ** State
  const [basicPicker, setBasicPicker] = useState(new Date())

  // ** Hook
  const { i18n } = useTranslation()

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label='Basic'
          value={basicPicker}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          disabled
          label='Disabled'
          value={basicPicker}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          readOnly
          label='Readonly'
          value={basicPicker}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns} locale={langObj[i18n.language]}>
        <DatePicker
          value={basicPicker}
          label='Localization'
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          openTo='year'
          disableFuture
          label='Responsive'
          value={basicPicker}
          views={['year', 'month', 'day']}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <MobileDatePicker
          label='For mobile'
          value={basicPicker}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
    </Box>
  )
}

export default DatePickers
