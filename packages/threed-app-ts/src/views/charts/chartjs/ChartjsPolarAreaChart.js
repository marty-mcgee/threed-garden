// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import DotsVertical from 'mdi-material-ui/DotsVertical'

// ** Third Party Imports
import { PolarArea } from 'react-chartjs-2'

const ChartjsPolarAreaChart = props => {
  // ** Props
  const { info, grey, green, yellow, primary, warning, labelColor } = props

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    layout: {
      padding: {
        top: -5,
        bottom: -45
      }
    },
    scales: {
      r: {
        grid: { display: false },
        ticks: { display: false }
      }
    },
    plugins: {
      legend: {
        position: 'right',
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
    labels: ['Africa', 'Asia', 'Europe', 'America', 'Antarctica', 'Australia'],
    datasets: [
      {
        borderWidth: 0,
        label: 'Population (millions)',
        data: [19, 17.5, 15, 13.5, 11, 9],
        backgroundColor: [primary, yellow, warning, info, grey, green]
      }
    ]
  }

  return (
    <Card>
      <CardHeader
        title='Average Skills'
        titleTypographyProps={{ variant: 'h6' }}
        action={
          <IconButton size='small' aria-label='settings' className='card-more-options' sx={{ color: 'text.secondary' }}>
            <DotsVertical fontSize='small' />
          </IconButton>
        }
      />
      <CardContent>
        <PolarArea data={data} options={options} height={350} />
      </CardContent>
    </Card>
  )
}

export default ChartjsPolarAreaChart
