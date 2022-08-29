export const PickersBasicJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersBasic = () => {
  // ** States
  const [date, setDate] = useState(new Date())

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={date}
          id='basic-input'
          onChange={date => setDate(date)}
          placeholderText='Click to select a date'
          customInput={<CustomInput label='Basic' />}
        />
      </Box>
      <Box>
        <DatePicker
          disabled
          selected={date}
          id='disabled-input'
          onChange={date => setDate(date)}
          placeholderText='Click to select a date'
          customInput={<CustomInput label='Disabled' />}
        />
      </Box>
      <Box>
        <DatePicker
          readOnly
          selected={date}
          id='read-only-input'
          onChange={date => setDate(date)}
          placeholderText='Click to select a date'
          customInput={<CustomInput label='Readonly' />}
        />
      </Box>
    </Box>
  )
}

export default PickersBasic
`}</code>
  </pre>
)

export const PickersCallbacksJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
          onCalendarOpen={() => handlePickerCallback(Selected Date: {new Date(date || '').toLocaleDateString()})}
          onCalendarClose={() => handlePickerCallback(Selected Date: {new Date(date || '').toLocaleDateString()})}
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
            handlePickerCallback(Selected Date: {new Date(date || '').toLocaleDateString()})
          }}
        />
      </Box>
    </Box>
  )
}

export default PickersCallbacks
`}</code>
  </pre>
)

export const PickersIncludeExcludeJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)

export const PickersCustomizationJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import subDays from 'date-fns/subDays'
import addDays from 'date-fns/addDays'
import DatePicker from 'react-datepicker'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersCustomization = () => {
  // ** States
  const [dateFormat, setDateFormat] = useState(new Date())

  const [dateHighlight, setDateHighlight] = useState(new Date())

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          id='custom-format'
          selected={dateFormat}
          dateFormat='MMMM d, yyyy h:mm aa'
          onChange={date => setDateFormat(date)}
          customInput={<CustomInput label='Custom Date Format' />}
        />
      </Box>
      <Box>
        <DatePicker
          id='highlight-dates'
          selected={dateHighlight}
          onChange={date => setDateHighlight(date)}
          customInput={<CustomInput label='Highlight Dates' />}
          highlightDates={[subDays(new Date(), 7), addDays(new Date(), 7)]}
        />
      </Box>
    </Box>
  )
}

export default PickersCustomization
`}</code>
  </pre>
)

export const PickersLocaleJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import fr from 'date-fns/locale/fr'
import ar from 'date-fns/locale/ar-SA'
import en from 'date-fns/locale/en-US'
import { useTranslation } from 'react-i18next'
import DatePicker, { registerLocale } from 'react-datepicker'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const langObj = { fr, ar, en }

const PickersLocale = () => {
  // ** States
  const [date, setDate] = useState(new Date())

  const [time, setTime] = useState(new Date())


  // ** Hooks
  const { i18n } = useTranslation()

  registerLocale(i18n.language, langObj[i18n.language])
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={date}
          id='locale-picker'
          locale={i18n.language}
          onChange={date => setDate(date)}
          customInput={<CustomInput label='Locale Dates' />}
        />
      </Box>
      <Box>
        <DatePicker
          showTimeSelect
          selected={time}
          id='locale-time'
          locale={i18n.language}
          dateFormat='MM/dd/yyyy h:mm aa'
          onChange={date => setTime(date)}
          customInput={<CustomInput label='Locale Time' />}
        />
      </Box>
    </Box>
  )
}

export default PickersLocale
`}</code>
  </pre>
)

export const PickersMonthYearDropdownsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)

export const PickersMonthYearQuarterJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersMonthYear = () => {
  // ** States
  const [year, setYear] = useState(new Date())

  const [month, setMonth] = useState(new Date())

  const [quarter, setQuarter] = useState(new Date())

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={month}
          id='month-picker'
          showMonthYearPicker
          dateFormat='MM/yyyy'
          onChange={date => setMonth(date)}
          customInput={<CustomInput label='Month Picker' />}
        />
      </Box>
      <Box>
        <DatePicker
          showYearPicker
          selected={year}
          id='year-picker'
          dateFormat='MM/yyyy'
          onChange={date => setYear(date)}
          customInput={<CustomInput label='Year Picker' />}
        />
      </Box>
      <Box>
        <DatePicker
          selected={quarter}
          id='quarter-picker'
          showQuarterYearPicker
          dateFormat='yyyy, QQQ'
          onChange={date => setQuarter(date)}
          customInput={<CustomInput label='Quarter Picker' />}
        />
      </Box>
    </Box>
  )
}

export default PickersMonthYear
`}</code>
  </pre>
)

export const PickersOptionsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersOptions = () => {
  // ** States
  const [dateOpen, setDateOpen] = useState(null)

  const [dateClear, setDateClear] = useState(new Date())

  const [dateTodayBtn, setDateTodayBtn] = useState(null)

  const [dateFilter, setDateFilter] = useState(new Date())

  const [dateWeekNum, setDateWeekNum] = useState(new Date())

  const isWeekday = date => {
    const day = new Date(date).getDay()

    return day !== 0 && day !== 6
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          isClearable
          id='picker-clear'
          selected={dateClear}
          customInput={<CustomInput label='Clear' />}
          onChange={date => setDateClear(date)}
        />
      </Box>
      <Box>
        <DatePicker
          showWeekNumbers
          id='picker-week-num'
          selected={dateWeekNum}
          onChange={date => setDateWeekNum(date)}
          customInput={<CustomInput label='Week Numbers' />}
        />
      </Box>
      <Box>
        <DatePicker
          id='picker-filter'
          selected={dateFilter}
          filterDate={isWeekday}
          onChange={date => setDateFilter(date)}
          customInput={<CustomInput label='Filter Dates' />}
        />
      </Box>
      <Box>
        <DatePicker
          selected={dateOpen}
          id='picker-open-date'
          openToDate={new Date('1993/09/28')}
          onChange={date => setDateOpen(date)}
          customInput={<CustomInput label='Open To Date' />}
        />
      </Box>
      <Box>
        <DatePicker
          todayButton='Today'
          selected={dateTodayBtn}
          id='picker-date-today-btn'
          onChange={date => setDateTodayBtn(date)}
          customInput={<CustomInput label='Date Today Button' />}
        />
      </Box>
    </Box>
  )
}

export default PickersOptions
`}</code>
  </pre>
)

export const PickersRangeJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState, forwardRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'

// ** Third Party Imports
import format from 'date-fns/format'
import DatePicker from 'react-datepicker'

const PickersRange = () => {
  // ** States
  const [endDate, setEndDate] = useState(null)

  const [startDate, setStartDate] = useState(new Date())

  const [endDateRange, setEndDateRange] = useState(null)

  const [startDateRange, setStartDateRange] = useState(new Date())

  const handleOnChange = dates => {
    const [start, end] = dates

    setStartDate(start)
    setEndDate(end)
  }

  const handleOnChangeRange = dates => {
    const [start, end] = dates

    setStartDateRange(start)
    setEndDateRange(end)
  }

  const CustomInput = forwardRef((props, ref) => {
    const startDate = format(props.start, 'MM/dd/yyyy')

    const endDate = props.end !== null ?  - {format(props.end, 'MM/dd/yyyy')} : null

    const value = {startDate}{endDate !== null ? endDate : ''}

    return <TextField inputRef={ref} label={props.label || ''} {...props} value={value} />
  })

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selectsRange
          endDate={endDate}
          selected={startDate}
          startDate={startDate}
          id='date-range-picker'
          onChange={handleOnChange}
          shouldCloseOnSelect={false}
          customInput={<CustomInput label='Date Range' start={startDate} end={endDate} />}
        />
      </Box>
      <Box>
        <DatePicker
          selectsRange
          monthsShown={2}
          endDate={endDateRange}
          selected={startDateRange}
          startDate={startDateRange}
          shouldCloseOnSelect={false}
          id='date-range-picker-months'
          onChange={handleOnChangeRange}
          customInput={<CustomInput label='Multiple Months' end={endDateRange} start={startDateRange} />}
        />
      </Box>
    </Box>
  )
}

export default PickersRange
`}</code>
  </pre>
)

export const PickersSpecificRangeJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)

export const PickersTimeJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'

// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersTime = () => {
  // ** States
  const [time, setTime] = useState(new Date())

  const [dateTime, setDateTime] = useState(new Date())

  const [customTime, setCustomTime] = useState(new Date())

  const CustomTimeInput = props => {
    return (
      <TextField
        {...props}
        size='small'
        value={props.value}
        sx={{ maxWidth: '190px' }}
        onChange={e => props.onChange(e.target.value)}
      />
    )
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          showTimeSelect
          selected={time}
          timeIntervals={15}
          showTimeSelectOnly
          dateFormat='h:mm aa'
          id='time-only-picker'
          timeCaption='Time Picker'
          onChange={date => setTime(date)}
          customInput={<CustomInput label='Time Only' />}
        />
      </Box>
      <Box>
        <DatePicker
          showTimeSelect
          timeFormat='HH:mm'
          timeIntervals={15}
          selected={dateTime}
          id='date-time-picker'
          timeCaption='Time Picker'
          dateFormat='MM/dd/yyyy h:mm aa'
          onChange={date => setDateTime(date)}
          customInput={<CustomInput label='Date & Time' />}
        />
      </Box>
      <Box>
        <DatePicker
          showTimeInput
          selected={customTime}
          id='custom-time-input'
          customTimeInput={<CustomTimeInput />}
          onChange={date => setCustomTime(date)}
          customInput={<CustomInput label='Custom Time Input' />}
        />
      </Box>
    </Box>
  )
}

export default PickersTime
`}</code>
  </pre>
)

export const PickersMinMaxJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)

export const PickersCustomInputJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { forwardRef } from 'react'

// ** MUI Imports
import TextField from '@mui/material/TextField'

const PickersComponent = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} label={props.label || ''} />
})

export default PickersComponent
`}</code>
  </pre>
)

export const PickersCallbacksTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import toast from 'react-hot-toast'
import DatePicker from 'react-datepicker'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersCallbacks = () => {
  // ** States
  const [date, setDate] = useState<DateType>(new Date())

  const handlePickerCallback = (msg: string) => {
    toast(msg, { duration: 2000 })
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={date}
          id='callback-open'
          dateFormat='MM/dd/yyyy'
          onChange={(date: Date) => setDate(date)}
          customInput={<CustomInput label='Open & Closed' />}
          onCalendarOpen={() => handlePickerCallback(Selected Date: {new Date(date || '').toLocaleDateString()})}
          onCalendarClose={() => handlePickerCallback(Selected Date: {new Date(date || '').toLocaleDateString()})}
        />
      </Box>
      <Box>
        <DatePicker
          selected={date}
          id='callback-blur'
          onChange={(date: Date) => setDate(date)}
          customInput={<CustomInput label='Blur' />}
          onBlur={() => handlePickerCallback('Picker Closed')}
        />
      </Box>
      <Box>
        <DatePicker
          selected={date}
          id='callback-change'
          customInput={<CustomInput label='onChange' />}
          onChange={(date: Date) => {
            setDate(date)
            handlePickerCallback(Selected Date: {new Date(date || '').toLocaleDateString()})
          }}
        />
      </Box>
    </Box>
  )
}

export default PickersCallbacks
`}</code>
  </pre>
)

export const PickersCustomInputTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { forwardRef } from 'react'

// ** MUI Imports
import TextField from '@mui/material/TextField'

interface PickerProps {
  label?: string
}

const PickersComponent = forwardRef(({ ...props }: PickerProps, ref) => {
  return <TextField inputRef={ref} {...props} label={props.label || ''} />
})

export default PickersComponent
`}</code>
  </pre>
)

export const PickersIncludeExcludeTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import addDays from 'date-fns/addDays'
import subDays from 'date-fns/subDays'
import setHours from 'date-fns/setHours'
import DatePicker from 'react-datepicker'
import setMinutes from 'date-fns/setMinutes'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersIncludeExclude = () => {
  // ** States
  const [date, setDate] = useState<DateType>(new Date())
  const [dateExclude, setDateExclude] = useState<DateType>(new Date())
  const [time, setTime] = useState<DateType>(setHours(setMinutes(new Date(), 30), 16))
  const [timeExclude, setTimeExclude] = useState<DateType>(setHours(setMinutes(new Date(), 30), 16))

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={date}
          id='include-dates'
          onChange={(date: Date) => setDate(date)}
          customInput={<CustomInput label='Include Dates' />}
          includeDates={[new Date(), addDays(new Date(), 1)]}
        />
      </Box>
      <Box>
        <DatePicker
          id='exclude-dates'
          selected={dateExclude}
          onChange={(date: Date) => setDateExclude(date)}
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
          onChange={(date: Date) => setTime(date)}
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
          onChange={(date: Date) => setTimeExclude(date)}
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
`}</code>
  </pre>
)

export const PickersLocaleTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import { Locale } from 'date-fns'
import fr from 'date-fns/locale/fr'
import ar from 'date-fns/locale/ar-SA'
import en from 'date-fns/locale/en-US'
import { useTranslation } from 'react-i18next'
import DatePicker, { registerLocale } from 'react-datepicker'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const langObj: { [key: string]: Locale } = { fr, ar, en }

const PickersLocale = () => {
  // ** States
  const [date, setDate] = useState<DateType>(new Date())
  const [time, setTime] = useState<DateType>(new Date())

  // ** Hooks
  const { i18n } = useTranslation()

  registerLocale(i18n.language, langObj[i18n.language])

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={date}
          id='locale-picker'
          locale={i18n.language}
          onChange={(date: Date) => setDate(date)}
          customInput={<CustomInput label='Locale Dates' />}
        />
      </Box>
      <Box>
        <DatePicker
          showTimeSelect
          selected={time}
          id='locale-time'
          locale={i18n.language}
          dateFormat='MM/dd/yyyy h:mm aa'
          onChange={(date: Date) => setTime(date)}
          customInput={<CustomInput label='Locale Time' />}
        />
      </Box>
    </Box>
  )
}

export default PickersLocale
`}</code>
  </pre>
)

export const PickersCustomizationTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import subDays from 'date-fns/subDays'
import addDays from 'date-fns/addDays'
import DatePicker from 'react-datepicker'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersCustomization = () => {
  // ** States
  const [dateFormat, setDateFormat] = useState<DateType>(new Date())
  const [dateHighlight, setDateHighlight] = useState<DateType>(new Date())

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          id='custom-format'
          selected={dateFormat}
          dateFormat='MMMM d, yyyy h:mm aa'
          onChange={(date: Date) => setDateFormat(date)}
          customInput={<CustomInput label='Custom Date Format' />}
        />
      </Box>
      <Box>
        <DatePicker
          id='highlight-dates'
          selected={dateHighlight}
          onChange={(date: Date) => setDateHighlight(date)}
          customInput={<CustomInput label='Highlight Dates' />}
          highlightDates={[subDays(new Date(), 7), addDays(new Date(), 7)]}
        />
      </Box>
    </Box>
  )
}

export default PickersCustomization
`}</code>
  </pre>
)

export const PickersMonthYearDropdownsTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersMonthYearDropdowns = () => {
  // ** States
  const [year, setYear] = useState<DateType>(new Date())
  const [month, setMonth] = useState<DateType>(new Date())
  const [monthYear, setMonthYear] = useState<DateType>(new Date())

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={month}
          showMonthDropdown
          id='month-dropdown'
          placeholderText='MM-DD-YYYY'
          onChange={(date: Date) => setMonth(date)}
          customInput={<CustomInput label='Month Dropdown' />}
        />
      </Box>
      <Box>
        <DatePicker
          selected={year}
          showYearDropdown
          id='year-dropdown'
          placeholderText='MM-DD-YYYY'
          onChange={(date: Date) => setYear(date)}
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
          onChange={(date: Date) => setMonthYear(date)}
          customInput={<CustomInput label='Month & Year Dropdown' />}
        />
      </Box>
    </Box>
  )
}

export default PickersMonthYearDropdowns
`}</code>
  </pre>
)

export const PickersOptionsTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersOptions = () => {
  // ** States
  const [dateOpen, setDateOpen] = useState<DateType>(null)
  const [dateClear, setDateClear] = useState<DateType>(new Date())
  const [dateTodayBtn, setDateTodayBtn] = useState<DateType>(null)
  const [dateFilter, setDateFilter] = useState<DateType>(new Date())
  const [dateWeekNum, setDateWeekNum] = useState<DateType>(new Date())

  const isWeekday = (date: Date) => {
    const day = new Date(date).getDay()

    return day !== 0 && day !== 6
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          isClearable
          id='picker-clear'
          selected={dateClear}
          customInput={<CustomInput label='Clear' />}
          onChange={(date: Date) => setDateClear(date)}
        />
      </Box>
      <Box>
        <DatePicker
          showWeekNumbers
          id='picker-week-num'
          selected={dateWeekNum}
          onChange={(date: Date) => setDateWeekNum(date)}
          customInput={<CustomInput label='Week Numbers' />}
        />
      </Box>
      <Box>
        <DatePicker
          id='picker-filter'
          selected={dateFilter}
          filterDate={isWeekday}
          onChange={(date: Date) => setDateFilter(date)}
          customInput={<CustomInput label='Filter Dates' />}
        />
      </Box>
      <Box>
        <DatePicker
          selected={dateOpen}
          id='picker-open-date'
          openToDate={new Date('1993/09/28')}
          onChange={(date: Date) => setDateOpen(date)}
          customInput={<CustomInput label='Open To Date' />}
        />
      </Box>
      <Box>
        <DatePicker
          todayButton='Today'
          selected={dateTodayBtn}
          id='picker-date-today-btn'
          onChange={(date: Date) => setDateTodayBtn(date)}
          customInput={<CustomInput label='Date Today Button' />}
        />
      </Box>
    </Box>
  )
}

export default PickersOptions
`}</code>
  </pre>
)

export const PickersMonthYearQuarterTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersMonthYear = () => {
  // ** States
  const [year, setYear] = useState<DateType>(new Date())
  const [month, setMonth] = useState<DateType>(new Date())
  const [quarter, setQuarter] = useState<DateType>(new Date())

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={month}
          id='month-picker'
          showMonthYearPicker
          dateFormat='MM/yyyy'
          onChange={(date: Date) => setMonth(date)}
          customInput={<CustomInput label='Month Picker' />}
        />
      </Box>
      <Box>
        <DatePicker
          showYearPicker
          selected={year}
          id='year-picker'
          dateFormat='MM/yyyy'
          onChange={(date: Date) => setYear(date)}
          customInput={<CustomInput label='Year Picker' />}
        />
      </Box>
      <Box>
        <DatePicker
          selected={quarter}
          id='quarter-picker'
          showQuarterYearPicker
          dateFormat='yyyy, QQQ'
          onChange={(date: Date) => setQuarter(date)}
          customInput={<CustomInput label='Quarter Picker' />}
        />
      </Box>
    </Box>
  )
}

export default PickersMonthYear
`}</code>
  </pre>
)

export const PickersRangeTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState, forwardRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'

// ** Third Party Imports
import format from 'date-fns/format'
import DatePicker from 'react-datepicker'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

interface PickerProps {
  label?: string
  end: Date | number
  start: Date | number
}

const PickersRange = () => {
  // ** States
  const [endDate, setEndDate] = useState<DateType>(null)
  const [startDate, setStartDate] = useState<DateType>(new Date())
  const [endDateRange, setEndDateRange] = useState<DateType>(null)
  const [startDateRange, setStartDateRange] = useState<DateType>(new Date())

  const handleOnChange = (dates: any) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
  }

  const handleOnChangeRange = (dates: any) => {
    const [start, end] = dates
    setStartDateRange(start)
    setEndDateRange(end)
  }

  const CustomInput = forwardRef((props: PickerProps, ref) => {
    const startDate = format(props.start, 'MM/dd/yyyy')
    const endDate = props.end !== null ?  - {format(props.end, 'MM/dd/yyyy')} : null

    const value = {startDate}{endDate !== null ? endDate : ''}

    return <TextField inputRef={ref} label={props.label || ''} {...props} value={value} />
  })

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selectsRange
          endDate={endDate}
          selected={startDate}
          startDate={startDate}
          id='date-range-picker'
          onChange={handleOnChange}
          shouldCloseOnSelect={false}
          customInput={
            <CustomInput label='Date Range' start={startDate as Date | number} end={endDate as Date | number} />
          }
        />
      </Box>
      <Box>
        <DatePicker
          selectsRange
          monthsShown={2}
          endDate={endDateRange}
          selected={startDateRange}
          startDate={startDateRange}
          shouldCloseOnSelect={false}
          id='date-range-picker-months'
          onChange={handleOnChangeRange}
          customInput={
            <CustomInput
              label='Multiple Months'
              end={endDateRange as Date | number}
              start={startDateRange as Date | number}
            />
          }
        />
      </Box>
    </Box>
  )
}

export default PickersRange
`}</code>
  </pre>
)

export const PickersSpecificRangeTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import addDays from 'date-fns/addDays'
import setHours from 'date-fns/setHours'
import DatePicker from 'react-datepicker'
import setMinutes from 'date-fns/setMinutes'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersSpecificRange = () => {
  // ** States
  const [date, setDate] = useState<DateType>(new Date())
  const [time, setTime] = useState<DateType>(new Date())

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={date}
          id='specific-date'
          minDate={new Date()}
          maxDate={addDays(new Date(), 5)}
          onChange={(date: Date) => setDate(date)}
          customInput={<CustomInput label='Specific Date Range' />}
        />
      </Box>
      <Box>
        <DatePicker
          showTimeSelect
          selected={time}
          id='specific-time'
          dateFormat='MM/dd/yyyy h:mm aa'
          onChange={(date: Date) => setTime(date)}
          minTime={setHours(setMinutes(new Date(), 0), 17)}
          maxTime={setHours(setMinutes(new Date(), 30), 20)}
          customInput={<CustomInput label='Specific Time' />}
        />
      </Box>
    </Box>
  )
}

export default PickersSpecificRange
`}</code>
  </pre>
)

export const PickersTimeTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'

// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersTime = () => {
  // ** States
  const [time, setTime] = useState<DateType>(new Date())
  const [dateTime, setDateTime] = useState<DateType>(new Date())
  const [customTime, setCustomTime] = useState<DateType>(new Date())

  const CustomTimeInput = (props: any) => {
    return (
      <TextField
        {...props}
        size='small'
        value={props.value}
        sx={{ maxWidth: '190px' }}
        onChange={e => props.onChange(e.target.value)}
      />
    )
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          showTimeSelect
          selected={time}
          timeIntervals={15}
          showTimeSelectOnly
          dateFormat='h:mm aa'
          id='time-only-picker'
          timeCaption='Time Picker'
          onChange={(date: Date) => setTime(date)}
          customInput={<CustomInput label='Time Only' />}
        />
      </Box>
      <Box>
        <DatePicker
          showTimeSelect
          timeFormat='HH:mm'
          timeIntervals={15}
          selected={dateTime}
          id='date-time-picker'
          timeCaption='Time Picker'
          dateFormat='MM/dd/yyyy h:mm aa'
          onChange={(date: Date) => setDateTime(date)}
          customInput={<CustomInput label='Date & Time' />}
        />
      </Box>
      <Box>
        <DatePicker
          showTimeInput
          selected={customTime}
          id='custom-time-input'
          customTimeInput={<CustomTimeInput />}
          onChange={(date: Date) => setCustomTime(date)}
          customInput={<CustomInput label='Custom Time Input' />}
        />
      </Box>
    </Box>
  )
}

export default PickersTime
`}</code>
  </pre>
)

export const PickersMinMaxTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import subDays from 'date-fns/subDays'
import addDays from 'date-fns/addDays'
import DatePicker from 'react-datepicker'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

const PickersMinMax = () => {
  // ** States
  const [minDate, setMinDate] = useState<DateType>(new Date())
  const [maxDate, setMaxDate] = useState<DateType>(new Date())

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          id='min-date'
          selected={minDate}
          minDate={subDays(new Date(), 5)}
          onChange={(date: Date) => setMinDate(date)}
          customInput={<CustomInput label='Min Date' />}
        />
      </Box>
      <Box>
        <DatePicker
          id='max-date'
          selected={maxDate}
          maxDate={addDays(new Date(), 5)}
          onChange={(date: Date) => setMaxDate(date)}
          customInput={<CustomInput label='Max Date' />}
        />
      </Box>
    </Box>
  )
}

export default PickersMinMax
`}</code>
  </pre>
)

export const PickersBasicTSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Imports
import DatePicker from 'react-datepicker'

// ** Custom Component Imports
import CustomInput from './PickersCustomInput'

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes'

const PickersBasic = () => {
  // ** States
  const [date, setDate] = useState<DateType>(new Date())

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }} className='demo-space-x'>
      <Box>
        <DatePicker
          selected={date}
          id='basic-input'
          onChange={(date: Date) => setDate(date)}
          placeholderText='Click to select a date'
          customInput={<CustomInput label='Basic' />}
        />
      </Box>
      <Box>
        <DatePicker
          disabled
          selected={date}
          id='disabled-input'
          onChange={(date: Date) => setDate(date)}
          placeholderText='Click to select a date'
          customInput={<CustomInput label='Disabled' />}
        />
      </Box>
      <Box>
        <DatePicker
          readOnly
          selected={date}
          id='read-only-input'
          onChange={(date: Date) => setDate(date)}
          placeholderText='Click to select a date'
          customInput={<CustomInput label='Readonly' />}
        />
      </Box>
    </Box>
  )
}

export default PickersBasic
`}</code>
  </pre>
)
