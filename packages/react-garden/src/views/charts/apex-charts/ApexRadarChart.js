// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Component Import
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const radarColors = {
  series1: '#9b88fa',
  series2: '#ffa1a1'
}

const ApexRadarChart = () => {
  const options = {
    chart: {
      toolbar: {
        show: false
      },
      parentHeightOffset: 0,
      dropShadow: {
        top: 1,
        blur: 8,
        left: 1,
        opacity: 0.2,
        enabled: false
      }
    },
    legend: {
      show: true
    },
    yaxis: {
      show: false
    },
    colors: [radarColors.series1, radarColors.series2],
    xaxis: {
      categories: ['Battery', 'Brand', 'Camera', 'Memory', 'Storage', 'Display', 'OS', 'Price']
    },
    fill: {
      opacity: [1, 0.8]
    },
    stroke: {
      width: 0,
      show: false
    },
    markers: {
      size: 0
    },
    grid: {
      show: false,
      padding: {
        top: -20,
        bottom: -20
      }
    }
  }

  const series = [
    {
      name: 'iPhone 12',
      data: [41, 64, 81, 60, 42, 42, 33, 23]
    },
    {
      name: 'Samsung s20',
      data: [65, 46, 42, 25, 58, 63, 76, 43]
    }
  ]

  return (
    <Card>
      <CardHeader title='Mobile Comparison' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <ReactApexcharts options={options} series={series} type='radar' height={400} />
      </CardContent>
    </Card>
  )
}

export default ApexRadarChart
