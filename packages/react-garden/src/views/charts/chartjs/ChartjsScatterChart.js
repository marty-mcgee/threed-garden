// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// ** Third Party Imports
import { Scatter } from 'react-chartjs-2'

const ChartjsScatterChart = props => {
  // ** Props
  const { green, warning, primary, labelColor, borderColor, gridLineColor } = props

  // ** State
  const [active, setActive] = useState('daily')

  const handleActive = (event, newActive) => {
    setActive(newActive)
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800 },
    layout: {
      padding: { top: -20 }
    },
    scales: {
      x: {
        min: 0,
        max: 140,
        grid: {
          borderColor,
          drawTicks: false,
          color: gridLineColor
        },
        ticks: {
          stepSize: 10,
          color: labelColor
        }
      },
      y: {
        min: 0,
        max: 400,
        grid: {
          borderColor,
          drawTicks: false,
          color: gridLineColor
        },
        ticks: {
          stepSize: 100,
          color: labelColor
        }
      }
    },
    plugins: {
      legend: {
        align: 'start',
        position: 'top',
        labels: {
          padding: 25,
          boxWidth: 9,
          color: labelColor,
          usePointStyle: true
        }
      }
    }
  }

  const data = {
    datasets: [
      {
        pointRadius: 5,
        label: 'iPhone',
        pointBorderWidth: 2,
        backgroundColor: primary,
        pointHoverBorderWidth: 2,
        borderColor: 'transparent',
        data: [
          { x: 72, y: 225 },
          { x: 81, y: 270 },
          { x: 90, y: 230 },
          { x: 103, y: 305 },
          { x: 103, y: 245 },
          { x: 108, y: 275 },
          { x: 110, y: 290 },
          { x: 111, y: 315 },
          { x: 109, y: 350 },
          { x: 116, y: 340 },
          { x: 113, y: 260 },
          { x: 117, y: 275 },
          { x: 117, y: 295 },
          { x: 126, y: 280 },
          { x: 127, y: 340 },
          { x: 133, y: 330 }
        ]
      },
      {
        pointRadius: 5,
        pointBorderWidth: 2,
        label: 'Samsung Note',
        backgroundColor: warning,
        pointHoverBorderWidth: 2,
        borderColor: 'transparent',
        data: [
          { x: 13, y: 95 },
          { x: 22, y: 105 },
          { x: 17, y: 115 },
          { x: 19, y: 130 },
          { x: 21, y: 125 },
          { x: 35, y: 125 },
          { x: 13, y: 155 },
          { x: 21, y: 165 },
          { x: 25, y: 155 },
          { x: 18, y: 190 },
          { x: 26, y: 180 },
          { x: 43, y: 180 },
          { x: 53, y: 202 },
          { x: 61, y: 165 },
          { x: 67, y: 225 }
        ]
      },
      {
        pointRadius: 5,
        label: 'OnePlus',
        pointBorderWidth: 2,
        backgroundColor: green,
        pointHoverBorderWidth: 2,
        borderColor: 'transparent',
        data: [
          { x: 70, y: 195 },
          { x: 72, y: 270 },
          { x: 98, y: 255 },
          { x: 100, y: 215 },
          { x: 87, y: 240 },
          { x: 94, y: 280 },
          { x: 99, y: 300 },
          { x: 102, y: 290 },
          { x: 110, y: 275 },
          { x: 111, y: 250 },
          { x: 94, y: 280 },
          { x: 92, y: 340 },
          { x: 100, y: 335 },
          { x: 108, y: 330 }
        ]
      }
    ]
  }

  return (
    <Card>
      <CardHeader
        title='New Product Data'
        titleTypographyProps={{ variant: 'h6' }}
        sx={{
          flexDirection: ['column', 'row'],
          alignItems: ['flex-start', 'center'],
          '& .MuiCardHeader-action': { mb: 0 },
          '& .MuiCardHeader-content': { mb: [2, 0] }
        }}
        action={
          <ToggleButtonGroup exclusive value={active} onChange={handleActive}>
            <ToggleButton value='daily'>Daily</ToggleButton>
            <ToggleButton value='monthly'>Monthly</ToggleButton>
            <ToggleButton value='yearly'>Yearly</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <CardContent>
        <Scatter data={data} options={options} height={400} />
      </CardContent>
    </Card>
  )
}

export default ChartjsScatterChart
