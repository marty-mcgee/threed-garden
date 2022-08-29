// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import Circle from 'mdi-material-ui/Circle'
import DotsVertical from 'mdi-material-ui/DotsVertical'

// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const CardWidgetsTotalRevenue = () => {
  // ** Hook
  const theme = useTheme()

  const options = {
    chart: {
      sparkline: { enabled: true }
    },
    labels: ['Returning', 'New Users', 'Referrals'],
    legend: { show: false },
    stroke: { lineCap: 'round' },
    colors: [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main],
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: '40%'
        },
        track: {
          background: 'transparent',
          margin: 10
        },
        dataLabels: {
          name: {
            offsetY: 28
          },
          value: {
            fontSize: '2.125rem',
            offsetY: -12,
            formatter(value) {
              return `${value}k`
            }
          },
          total: {
            show: true,
            label: `${new Date().getFullYear()}`,
            formatter(value) {
              return `${value.globals.seriesTotals.reduce((total, num) => total + num)}k`
            }
          }
        }
      }
    }
  }

  return (
    <Card>
      <CardHeader
        title='Total Revenue'
        titleTypographyProps={{
          sx: { lineHeight: '2rem !important', letterSpacing: '0.15px !important' }
        }}
        action={
          <IconButton size='small' aria-label='settings' className='card-more-options' sx={{ color: 'text.secondary' }}>
            <DotsVertical />
          </IconButton>
        }
      />
      <CardContent
        sx={{
          '& .apexcharts-radialbar>g>g:first-of-type .apexcharts-radialbar-area': {
            stroke: 'transparent !important'
          },
          '& .apexcharts-datalabel-label': {
            letterSpacing: '0.4px',
            fontSize: '0.75rem !important',
            fill: `${theme.palette.text.secondary} !important`
          },
          '& .apexcharts-datalabel-value': {
            letterSpacing: '0.25px',
            fontWeight: '500 !important'
          }
        }}
      >
        <ReactApexcharts type='radialBar' height={243} series={[71, 78, 86]} options={options} />
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-around' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Circle sx={{ mr: 1.25, fontSize: '0.75rem', color: 'primary.main' }} />
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>345</Typography>
            </Box>
            <Typography variant='caption'>Returning</Typography>
          </Box>
          <Divider orientation='vertical' sx={{ m: 0, height: 'auto' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Circle sx={{ mr: 1.25, fontSize: '0.75rem', color: 'success.main' }} />
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>856</Typography>
            </Box>
            <Typography variant='caption'>New User</Typography>
          </Box>
          <Divider orientation='vertical' sx={{ m: 0, height: 'auto' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Circle sx={{ mr: 1.25, fontSize: '0.75rem', color: 'warning.main' }} />
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>258</Typography>
            </Box>
            <Typography variant='caption'>Referrals</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default CardWidgetsTotalRevenue
