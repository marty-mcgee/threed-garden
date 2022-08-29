// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import ArrowUp from 'mdi-material-ui/ArrowUp'

// ** Third Party Imports
import { Bubble } from 'react-chartjs-2'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'

const ChartjsBubbleChart = props => {
  // ** Props
  const { yellow, primary, labelColor, borderColor, gridLineColor } = props

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        min: 0,
        max: 140,
        grid: {
          borderColor,
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
          color: gridLineColor
        },
        ticks: {
          stepSize: 100,
          color: labelColor
        }
      }
    },
    plugins: {
      legend: { display: false }
    }
  }

  const data = {
    animation: { duration: 10000 },
    datasets: [
      {
        label: 'Dataset 1',
        borderColor: primary,
        backgroundColor: primary,
        data: [
          { x: 20, y: 74, r: 10 },
          { x: 10, y: 110, r: 5 },
          { x: 30, y: 165, r: 7 },
          { x: 40, y: 200, r: 20 },
          { x: 90, y: 185, r: 7 },
          { x: 50, y: 240, r: 7 },
          { x: 60, y: 275, r: 10 },
          { x: 70, y: 305, r: 5 },
          { x: 80, y: 325, r: 4 },
          { x: 100, y: 310, r: 5 },
          { x: 110, y: 240, r: 5 },
          { x: 120, y: 270, r: 7 },
          { x: 130, y: 300, r: 6 }
        ]
      },
      {
        label: 'Dataset 2',
        borderColor: yellow,
        backgroundColor: yellow,
        data: [
          { x: 30, y: 72, r: 5 },
          { x: 40, y: 110, r: 7 },
          { x: 20, y: 135, r: 6 },
          { x: 10, y: 160, r: 12 },
          { x: 50, y: 285, r: 5 },
          { x: 60, y: 235, r: 5 },
          { x: 70, y: 275, r: 7 },
          { x: 80, y: 290, r: 4 },
          { x: 90, y: 250, r: 10 },
          { x: 100, y: 220, r: 7 },
          { x: 120, y: 230, r: 4 },
          { x: 110, y: 320, r: 15 },
          { x: 130, y: 330, r: 7 }
        ]
      }
    ]
  }

  return (
    <Card>
      <CardHeader
        title='Bubble Chart'
        titleTypographyProps={{ variant: 'h6' }}
        subheader='Spending on various categories'
        subheaderTypographyProps={{ variant: 'caption' }}
        sx={{
          flexDirection: ['column', 'row'],
          alignItems: ['flex-start', 'center'],
          '& .MuiCardHeader-action': { mb: 0 },
          '& .MuiCardHeader-content': { mb: [2, 0] }
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='h6' sx={{ mr: 5 }}>
              $221,267
            </Typography>
            <CustomChip
              skin='light'
              color='success'
              sx={{ fontWeight: 500, borderRadius: 1, fontSize: '0.875rem' }}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowUp sx={{ fontSize: '1rem', mr: 1 }} />
                  <span>22%</span>
                </Box>
              }
            />
          </Box>
        }
      />
      <CardContent>
        <Bubble data={data} options={options} height={450} />
      </CardContent>
    </Card>
  )
}

export default ChartjsBubbleChart
