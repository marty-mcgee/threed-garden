// ** Material UI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import ChevronUp from 'mdi-material-ui/ChevronUp'

// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const EcommerceTotalSalesDonut = () => {
  // ** Hooks
  const theme = useTheme()

  const options = {
    chart: {
      sparkline: { enabled: true },
      animations: { enabled: false }
    },
    stroke: {
      width: 6,
      colors: [theme.palette.background.paper]
    },
    legend: { show: false },
    tooltip: { enabled: false },
    dataLabels: { enabled: false },
    colors: [theme.palette.primary.main, theme.palette.info.main, theme.palette.warning.main, theme.palette.error.main],
    grid: {
      padding: {
        top: -7,
        bottom: 5
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
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: {
              offsetY: -2,
              formatter: () => '28%'
            },
            value: {
              offsetY: 2,
              formatter: () => '1 Quarter'
            },
            total: {
              show: true,
              label: '18%',
              formatter: () => '1 Quarter'
            }
          }
        }
      }
    }
  }

  return (
    <Card>
      <CardContent
        sx={{
          py: `${theme.spacing(3.75)} !important`,
          '& .apexcharts-datalabel-label': {
            fontWeight: '500 !important',
            fontSize: '1.25rem !important',
            fill: `${theme.palette.text.primary} !important`
          },
          '& .apexcharts-datalabel-value': {
            fontSize: '0.75rem !important',
            letterSpacing: '0.4px !important',
            fill: `${theme.palette.text.secondary} !important`
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ my: 1.25 }}>
            <Typography variant='h6' sx={{ mb: 5 }}>
              Total Sales
            </Typography>
            <Typography component='p' variant='caption' sx={{ lineHeight: '1.25rem' }}>
              Calculated in last 7 days
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant='h6'>$25,980</Typography>
              <ChevronUp sx={{ color: 'success.main' }} />
              <Typography variant='caption' sx={{ color: 'success.main' }}>
                15.6%
              </Typography>
            </Box>
          </Box>
          <ReactApexcharts type='donut' width={110} height={125} options={options} series={[80, 22, 30, 50]} />
        </Box>
      </CardContent>
    </Card>
  )
}

export default EcommerceTotalSalesDonut
