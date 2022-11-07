// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Third Party Imports
import { Bar } from 'react-chartjs-2'

const ChartjsHorizontalBarChart = props => {
  // ** Props
  const { info, warning, labelColor, borderColor, gridLineColor } = props

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    elements: {
      bar: {
        borderRadius: {
          topRight: 15,
          bottomRight: 15
        }
      }
    },
    layout: {
      padding: { top: -4 }
    },
    scales: {
      x: {
        min: 0,
        grid: {
          drawTicks: false,
          color: gridLineColor,
          borderColor: 'transparent'
        },
        ticks: { color: labelColor }
      },
      y: {
        grid: {
          borderColor,
          display: false
        },
        ticks: { color: labelColor }
      }
    },
    plugins: {
      legend: {
        align: 'end',
        position: 'top',
        labels: { color: labelColor }
      }
    }
  }

  const data = {
    labels: ['MON', 'TUE', 'WED ', 'THU', 'FRI'],
    datasets: [
      {
        maxBarThickness: 15,
        label: 'Market Data',
        backgroundColor: warning,
        borderColor: 'transparent',
        data: [710, 350, 580, 460, 120]
      },
      {
        maxBarThickness: 15,
        backgroundColor: info,
        label: 'Personal Data',
        borderColor: 'transparent',
        data: [430, 590, 510, 240, 360]
      }
    ]
  }

  return (
    <Card>
      <CardHeader
        title='Balance'
        subheader='$74,123'
        titleTypographyProps={{ variant: 'h6' }}
        subheaderTypographyProps={{ variant: 'caption' }}
      />
      <CardContent>
        <Bar data={data} options={options} height={400} />
      </CardContent>
    </Card>
  )
}

export default ChartjsHorizontalBarChart
