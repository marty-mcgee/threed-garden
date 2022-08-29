// ** MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const CardStatsRadialBarChart = () => {
  // ** Hook
  const theme = useTheme()

  const options = {
    chart: {
      sparkline: { enabled: true }
    },
    stroke: { lineCap: 'round' },
    colors: [theme.palette.info.main],
    plotOptions: {
      radialBar: {
        endAngle: 90,
        startAngle: -90,
        hollow: { size: '65%' },
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: 0
          }
        }
      }
    }
  }

  return (
    <Card>
      <CardContent sx={{ '& .apexcharts-datalabel-value': { fontSize: '1.25rem', fontWeight: '500 !important' } }}>
        <Typography variant='h6' sx={{ mb: 2.5 }}>
          135k
        </Typography>
        <ReactApexcharts type='radialBar' height={150} options={options} series={[78]} />
        <Typography variant='body2' sx={{ mt: 7.5, fontWeight: 600, textAlign: 'center', color: 'text.primary' }}>
          Total Sales
        </Typography>
      </CardContent>
    </Card>
  )
}

export default CardStatsRadialBarChart
