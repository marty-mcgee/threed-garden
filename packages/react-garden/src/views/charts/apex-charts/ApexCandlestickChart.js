// ** React Imports
import { forwardRef, useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import TextField from '@mui/material/TextField'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import InputAdornment from '@mui/material/InputAdornment'

// ** Third Party Imports
import format from 'date-fns/format'
import DatePicker from 'react-datepicker'

// ** Icons Imports
import BellOutline from 'mdi-material-ui/BellOutline'
import ChevronDown from 'mdi-material-ui/ChevronDown'

// ** Component Import
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const candlestickColors = {
  series1: '#28c76f',
  series2: '#ea5455'
}

const ApexCandlestickChart = () => {
  // ** States
  const [endDate, setEndDate] = useState(null)
  const [startDate, setStartDate] = useState(new Date())

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: {
        show: false
      }
    },
    xaxis: {
      type: 'datetime'
    },
    yaxis: {
      tooltip: {
        enabled: true
      }
    },
    grid: {
      xaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: -10
      }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: candlestickColors.series1,
          downward: candlestickColors.series2
        }
      },
      bar: {
        columnWidth: '40%'
      }
    }
  }

  const series = [
    {
      data: [
        {
          x: `7/12/${new Date().getFullYear()}`,
          y: [150, 170, 50, 100]
        },
        {
          x: `8/12/${new Date().getFullYear()}`,
          y: [200, 400, 170, 330]
        },
        {
          x: `9/12/${new Date().getFullYear()}`,
          y: [330, 340, 250, 280]
        },
        {
          x: `10/12/${new Date().getFullYear()}`,
          y: [300, 330, 200, 320]
        },
        {
          x: `11/12/${new Date().getFullYear()}`,
          y: [320, 450, 280, 350]
        },
        {
          x: `12/12/${new Date().getFullYear()}`,
          y: [300, 350, 80, 250]
        },
        {
          x: `13/12/${new Date().getFullYear()}`,
          y: [200, 330, 170, 300]
        },
        {
          x: `14/12/${new Date().getFullYear()}`,
          y: [200, 220, 70, 130]
        },
        {
          x: `15/12/${new Date().getFullYear()}`,
          y: [220, 270, 180, 250]
        },
        {
          x: `16/12/${new Date().getFullYear()}`,
          y: [200, 250, 80, 100]
        },
        {
          x: `17/12/${new Date().getFullYear()}`,
          y: [150, 170, 50, 120]
        },
        {
          x: `18/12/${new Date().getFullYear()}`,
          y: [110, 450, 10, 420]
        },
        {
          x: `19/12/${new Date().getFullYear()}`,
          y: [400, 480, 300, 320]
        },
        {
          x: `20/12/${new Date().getFullYear()}`,
          y: [380, 480, 350, 450]
        }
      ]
    }
  ]

  const CustomInput = forwardRef((props, ref) => {
    const startDate = format(props.start, 'MM/dd/yyyy')
    const endDate = props.end !== null ? ` - ${format(props.end, 'MM/dd/yyyy')}` : null
    const value = `${startDate}${endDate !== null ? endDate : ''}`

    return (
      <TextField
        {...props}
        size='small'
        value={value}
        inputRef={ref}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <BellOutline />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position='end'>
              <ChevronDown />
            </InputAdornment>
          )
        }}
      />
    )
  })

  const handleOnChange = dates => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
  }

  return (
    <Card>
      <CardHeader
        title='Stocks Prices'
        subheader='$50,863.98'
        titleTypographyProps={{ variant: 'h6' }}
        subheaderTypographyProps={{ variant: 'caption' }}
        sx={{
          flexDirection: ['column', 'row'],
          alignItems: ['flex-start', 'center'],
          '& .MuiCardHeader-action': { mb: 0 },
          '& .MuiCardHeader-content': { mb: [2, 0] }
        }}
        action={
          <DatePicker
            selectsRange
            endDate={endDate}
            selected={startDate}
            startDate={startDate}
            onChange={handleOnChange}
            id='apexchart-candlestick'
            placeholderText='Click to select a date'
            customInput={<CustomInput start={startDate} end={endDate} />}
          />
        }
      />
      <CardContent>
        <ReactApexcharts options={options} series={series} type='candlestick' height={400} />
      </CardContent>
    </Card>
  )
}

export default ApexCandlestickChart
