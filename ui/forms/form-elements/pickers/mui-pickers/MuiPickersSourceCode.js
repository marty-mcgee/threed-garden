export const DatePickersJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)

export const DateTimePickersJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
          minDateTime={new Date({new Date().getFullYear()}-01-01 12:00)}
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
`}</code>
  </pre>
)

export const TimePickersJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
          minDateTime={new Date({new Date().getFullYear()}-01-01 12:00)}
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
`}</code>
  </pre>
)

export const DatePickersTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import DatePicker from '@mui/lab/DatePicker'
import TextField from '@mui/material/TextField'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import MobileDatePicker from '@mui/lab/MobileDatePicker'
import LocalizationProvider from '@mui/lab/LocalizationProvider'

// ** Third Party imports
import { Locale } from 'date-fns'
import fr from 'date-fns/locale/fr'
import ar from 'date-fns/locale/ar-SA'
import en from 'date-fns/locale/en-US'
import { useTranslation } from 'react-i18next'

const langObj: { [key: string]: Locale } = { fr, ar, en }

const DatePickers = () => {
  // ** State
  const [basicPicker, setBasicPicker] = useState<Date | null>(new Date())

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
`}</code>
  </pre>
)

export const DateTimePickersTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import DateTimePicker from '@mui/lab/DateTimePicker'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import MobileDateTimePicker from '@mui/lab/MobileDateTimePicker'
import LocalizationProvider from '@mui/lab/LocalizationProvider'

// ** Third Party imports
import { Locale } from 'date-fns'
import fr from 'date-fns/locale/fr'
import ar from 'date-fns/locale/ar-SA'
import en from 'date-fns/locale/en-US'
import { useTranslation } from 'react-i18next'

const langObj: { [key: string]: Locale } = { fr, ar, en }

const DateTimePickers = () => {
  // ** State
  const [basicPicker, setBasicPicker] = useState<Date | null>(new Date())

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
          minDateTime={new Date({new Date().getFullYear()}-01-01 12:00)}
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
`}</code>
  </pre>
)

export const TimePickersTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import TimePicker from '@mui/lab/TimePicker'
import TextField from '@mui/material/TextField'
import AdapterDateFns from '@mui/lab/AdapterDateFns'
import LocalizationProvider from '@mui/lab/LocalizationProvider'

// ** Third Party imports
import { Locale } from 'date-fns'
import fr from 'date-fns/locale/fr'
import ar from 'date-fns/locale/ar-SA'
import en from 'date-fns/locale/en-US'
import { useTranslation } from 'react-i18next'

const langObj: { [key: string]: Locale } = { fr, ar, en }

const TimePickers = () => {
  // ** State
  const [basicPicker, setBasicPicker] = useState<Date | null>(new Date())
  const [minMaxPicker, setMinMaxPicker] = useState<Date | null>(new Date())
  const [oddTimePicker, setOddTimePicker] = useState<Date | string | null>(
    new Date({new Date().getFullYear()}-01-01 12:00)
  )

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
`}</code>
  </pre>
)
