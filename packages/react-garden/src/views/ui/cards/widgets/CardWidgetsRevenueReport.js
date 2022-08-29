// ** MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import DotsVertical from 'mdi-material-ui/DotsVertical'

// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const series = [
  {
    name: 'Earning',
    data: [95, 177, 284, 256, 105, 63, 168, 218, 72]
  },
  {
    name: 'Expense',
    data: [-145, -80, -60, -180, -100, -60, -85, -75, -100]
  }
]

const CardWidgetsRevenueReport = () => {
  // ** Hook
  const theme = useTheme()

  const options = {
    chart: {
      stacked: true,
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    grid: {
      yaxis: {
        lines: { show: false }
      },
      padding: {
        left: 0,
        right: 0
      }
    },
    legend: {
      offsetY: 8,
      markers: { radius: 15 }
    },
    stroke: {
      width: 2,
      colors: [theme.palette.background.paper]
    },
    dataLabels: { enabled: false },
    colors: [theme.palette.success.main, theme.palette.secondary.main],
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '50%',
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
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      labels: {
        show: false
      },
      axisTicks: {
        show: false
      },
      axisBorder: {
        show: false
      }
    },
    yaxis: {
      labels: { show: false }
    }
  }

  return (
    <Card>
      <CardHeader
        title='Revenue Report'
        action={
          <IconButton size='small' aria-label='settings' className='card-more-options' sx={{ color: 'text.secondary' }}>
            <DotsVertical />
          </IconButton>
        }
        titleTypographyProps={{
          sx: {
            fontSize: '1rem !important',
            fontWeight: '600 !important',
            lineHeight: '1.5rem !important',
            letterSpacing: '0.15px !important'
          }
        }}
      />
      <CardContent>
        <ReactApexcharts type='bar' height={240} series={series} options={options} />
      </CardContent>
    </Card>
  )
}

export default CardWidgetsRevenueReport
