// ** React Imports
import { useRef, useState, useEffect } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Third Party Imports
import { Radar } from 'react-chartjs-2'

const ChartjsRadarChart = props => {
  // ** Props
  const { labelColor, gridLineColor } = props

  // ** States
  const [chartData, setChartData] = useState({
    datasets: []
  })

  // ** Hooks
  const chartRef = useRef(null)

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    layout: {
      padding: { top: -20 }
    },
    scales: {
      r: {
        ticks: {
          display: false,
          maxTicksLimit: 1,
          color: labelColor
        },
        grid: { color: gridLineColor },
        pointLabels: { color: labelColor },
        angleLines: { color: gridLineColor }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 25,
          color: labelColor
        }
      }
    }
  }
  useEffect(() => {
    if (!chartRef.current) {
      return
    } else {
      const gradientBlue = chartRef.current.ctx.createLinearGradient(0, 0, 0, 150)
      gradientBlue.addColorStop(0, 'rgba(155,136,250, 0.9)')
      gradientBlue.addColorStop(1, 'rgba(155,136,250, 0.8)')
      const gradientRed = chartRef.current.ctx.createLinearGradient(0, 0, 0, 150)
      gradientRed.addColorStop(0, 'rgba(255,161,161, 0.9)')
      gradientRed.addColorStop(1, 'rgba(255,161,161, 0.8)')

      const chartData = {
        labels: ['STA', 'STR', 'AGI', 'VIT', 'CHA', 'INT'],
        datasets: [
          {
            fill: true,
            label: 'Donté Panlin',
            borderColor: 'transparent',
            backgroundColor: gradientRed,
            data: [25, 59, 90, 81, 60, 82],
            pointBorderColor: 'transparent',
            pointBackgroundColor: 'transparent'
          },
          {
            fill: true,
            label: 'Mireska Sunbreeze',
            borderColor: 'transparent',
            backgroundColor: gradientBlue,
            data: [40, 100, 40, 90, 40, 90],
            pointBorderColor: 'transparent',
            pointBackgroundColor: 'transparent'
          }
        ]
      }
      setChartData(chartData)
    }
  }, [])

  return (
    <Card>
      <CardHeader title='Radar Chart' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Radar ref={chartRef} data={chartData} options={options} height={350} />
      </CardContent>
    </Card>
  )
}

export default ChartjsRadarChart
