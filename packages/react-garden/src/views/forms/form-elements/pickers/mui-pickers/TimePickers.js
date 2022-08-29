// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import TimePicker from '@mui/lab/TimePicker'
import TextField from '@mui/material/TextField'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import LocalizationProvider from '@mui/lab/LocalizationProvider'
import fr from 'date-fns/locale/fr'
import ar from 'date-fns/locale/ar-SA'
import en from 'date-fns/locale/en-US'
import { useTranslation } from 'react-i18next'

const langObj = { fr, ar, en }

const TimePickers = () => {
  // ** State
  const [basicPicker, setBasicPicker] = useState(new Date())
  const [minMaxPicker, setMinMaxPicker] = useState(new Date(`${new Date().getFullYear()}-01-01 12:00`))
  const [oddTimePicker, setOddTimePicker] = useState(new Date(`${new Date().getFullYear()}-01-01 12:00`))

  // ** Hooks
  const { i18n } = useTranslation()

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TimePicker
          label='Basic'
          value={basicPicker}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TimePicker
          disabled
          label='Disabled'
          value={basicPicker}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TimePicker
          readOnly
          label='ReadOnly'
          value={basicPicker}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TimePicker
          value={minMaxPicker}
          label='Min/Max Time'
          minTime={new Date(0, 0, 0, 8)}
          maxTime={new Date(0, 0, 0, 18, 45)}
          onChange={newValue => setMinMaxPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TimePicker
          value={oddTimePicker}
          label='Disable odd hours'
          onChange={newValue => setOddTimePicker(newValue)}
          renderInput={params => <TextField {...params} />}
          shouldDisableTime={(timeValue, clockType) => {
            if (clockType === 'hours' && timeValue % 2) {
              return true
            }

            return false
          }}
        />
      </LocalizationProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns} locale={langObj[i18n.language]}>
        <TimePicker
          label='Localization'
          value={basicPicker}
          onChange={newValue => setBasicPicker(newValue)}
          renderInput={params => <TextField {...params} />}
        />
      </LocalizationProvider>
    </Box>
  )
}

export default TimePickers
