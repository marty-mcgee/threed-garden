// ** MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const series = [
  {
    data: [30, 58, 45, 68]
  }
]

const CardStatsLineChartWithShadow = () => {
  // ** Hook
  const theme = useTheme()

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      dropShadow: {
        top: 12,
        blur: 3,
        left: 3,
        enabled: true,
        opacity: 0.14,
        color: theme.palette.primary.main
      }
    },
    grid: {
      show: false,
      padding: {
        left: -5,
        top: -10
      }
    },
    tooltip: { enabled: false },
    colors: [theme.palette.primary.main],
    markers: {
      size: 6,
      offsetX: -2,
      offsetY: -1,
      strokeWidth: 5,
      colors: ['transparent'],
      strokeColors: 'transparent',
      discrete: [
        {
          size: 7,
          seriesIndex: 0,
          strokeColor: theme.palette.primary.main,
          fillColor: theme.palette.background.paper,
          dataPointIndex: series[0].data.length - 1
        }
      ]
    },
    stroke: {
      width: 5,
      curve: 'smooth',
      lineCap: 'round'
    },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: {
      labels: { show: false }
    }
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h6'>$35.4k</Typography>
        <ReactApexcharts type='line' height={116} options={options} series={series} />
        <Typography variant='body2' sx={{ fontWeight: 600, textAlign: 'center', color: 'text.primary' }}>
          Total Revenue
        </Typography>
      </CardContent>
    </Card>
  )
}

export default CardStatsLineChartWithShadow
