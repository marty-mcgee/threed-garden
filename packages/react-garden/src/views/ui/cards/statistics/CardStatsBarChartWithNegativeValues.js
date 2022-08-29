// ** MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const series = [
  {
    name: 'Earning',
    data: [180, 120, 284, 180, 102]
  },
  {
    name: 'Expense',
    data: [-100, -130, -100, -60, -120]
  }
]

const CardStatsBarChartWithNegativeValues = () => {
  // ** Hook
  const theme = useTheme()

  const options = {
    chart: {
      stacked: true,
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    grid: {
      padding: {
        top: -13,
        left: -20,
        right: -10,
        bottom: -3
      },
      yaxis: {
        lines: { show: false }
      }
    },
    legend: { show: false },
    stroke: { lineCap: 'round' },
    dataLabels: { enabled: false },
    colors: [theme.palette.grey[theme.palette.mode === 'light' ? 700 : 500], theme.palette.error.main],
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '25%',
        endingShape: 'rounded',
        startingShape: 'rounded'
      }
    },
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false },
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May']
    },
    yaxis: {
      labels: { show: false }
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h6'>4,350</Typography>
        <ReactApexcharts type='bar' height={116} options={options} series={series} />
        <Typography variant='body2' sx={{ fontWeight: 600, textAlign: 'center', color: 'text.primary' }}>
          Sessions
        </Typography>
      </CardContent>
    </Card>
  )
}

export default CardStatsBarChartWithNegativeValues
