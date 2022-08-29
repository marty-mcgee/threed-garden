// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// ** Component Import
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const scatterColors = {
  series1: '#ff9f43',
  series2: '#7367f0',
  series3: '#28c76f'
}

const ApexScatterChart = () => {
  // ** State
  const [active, setActive] = useState('daily')

  const handleActive = (event, newActive) => {
    setActive(newActive)
  }

  const options = {
    chart: {
      zoom: {
        enabled: true,
        type: 'xy'
      },
      parentHeightOffset: 0,
      toolbar: {
        show: false
      }
    },
    grid: {
      xaxis: {
        lines: {
          show: true
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left'
    },
    colors: [scatterColors.series1, scatterColors.series2, scatterColors.series3],
    xaxis: {
      tickAmount: 10,
      labels: {
        formatter(val) {
          return parseFloat(val).toFixed(1)
        }
      }
    }
  }

  const series = [
    {
      name: 'Angular',
      data: [
        { x: 5.4, y: 170 },
        { x: 5.4, y: 100 },
        { x: 6.3, y: 170 },
        { x: 5.7, y: 140 },
        { x: 5.9, y: 130 },
        { x: 7.0, y: 150 },
        { x: 8.0, y: 120 },
        { x: 9.0, y: 170 },
        { x: 10.0, y: 190 },
        { x: 11.0, y: 220 },
        { x: 12.0, y: 170 },
        { x: 13.0, y: 230 }
      ]
    },
    {
      name: 'Vue',
      data: [
        { x: 14.0, y: 220 },
        { x: 15.0, y: 280 },
        { x: 16.0, y: 230 },
        { x: 18.0, y: 320 },
        { x: 17.5, y: 280 },
        { x: 19.0, y: 250 },
        { x: 20.0, y: 350 },
        { x: 20.5, y: 320 },
        { x: 20.0, y: 320 },
        { x: 19.0, y: 280 },
        { x: 17.0, y: 280 },
        { x: 22.0, y: 300 },
        { x: 18.0, y: 120 }
      ]
    },
    {
      name: 'React',
      data: [
        { x: 14.0, y: 290 },
        { x: 13.0, y: 190 },
        { x: 20.0, y: 220 },
        { x: 21.0, y: 350 },
        { x: 21.5, y: 290 },
        { x: 22.0, y: 220 },
        { x: 23.0, y: 140 },
        { x: 19.0, y: 400 },
        { x: 20.0, y: 200 },
        { x: 22.0, y: 90 },
        { x: 20.0, y: 120 }
      ]
    }
  ]

  return (
    <Card>
      <CardHeader
        title='New Technologies Data'
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
        <ReactApexcharts options={options} series={series} type='scatter' height={400} />
      </CardContent>
    </Card>
  )
}

export default ApexScatterChart
