// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import Circle from 'mdi-material-ui/Circle'
import CurrencyUsd from 'mdi-material-ui/CurrencyUsd'
import DotsVertical from 'mdi-material-ui/DotsVertical'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'
import ReactApexcharts from 'src/@core/components/react-apexcharts'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

const CardWidgetsSalesOverview = () => {
  // ** Hook
  const theme = useTheme()

  const options = {
    chart: {
      sparkline: { enabled: true }
    },
    colors: [
      theme.palette.primary.main,
      hexToRGBA(theme.palette.primary.main, 0.7),
      hexToRGBA(theme.palette.primary.main, 0.5),
      theme.palette.customColors.bodyBg
    ],
    stroke: { width: 0 },
    legend: { show: false },
    dataLabels: { enabled: false },
    labels: ['Apparel', 'Electronics', 'FMCG', 'Other Sales'],
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
        customScale: 0.9,
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              offsetY: 25
            },
            value: {
              offsetY: -15,
              formatter: value => `${value}k`
            },
            total: {
              show: true,
              label: 'Weekly Sales',
              formatter: value => `${value.globals.seriesTotals.reduce((total, num) => total + num)}k`
            }
          }
        }
      }
    }
  }

  return (
    <Card>
      <CardHeader
        title='Sales Overview'
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
          '& .apexcharts-datalabel-label': {
            lineHeight: '1.313rem',
            letterSpacing: '0.25px',
            fontSize: '0.875rem !important',
            fill: `${theme.palette.text.secondary} !important`
          },
          '& .apexcharts-datalabel-value': {
            letterSpacing: 0,
            lineHeight: '2rem',
            fontWeight: '500 !important'
          }
        }}
      >
        <Grid container sx={{ my: [0, 4, 7.375] }}>
          <Grid item xs={12} sm={6} sx={{ mb: [3, 0] }}>
            <ReactApexcharts type='donut' height={220} series={[12, 25, 13, 50]} options={options} />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ my: 'auto' }}>
            <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <CustomAvatar skin='light' sx={{ mr: 3 }} variant='rounded'>
                <CurrencyUsd sx={{ color: 'primary.main' }} />
              </CustomAvatar>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant='body2'>Number of Sales</Typography>
                <Typography variant='h6'>$86,400</Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 4 }} />
            <Grid container>
              <Grid item xs={6} sx={{ mb: 4 }}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                  <Circle sx={{ mr: 1.5, fontSize: '0.75rem', color: 'primary.main' }} />
                  <Typography variant='body2'>Apparel</Typography>
                </Box>
                <Typography sx={{ fontWeight: 600 }}>$12,150</Typography>
              </Grid>
              <Grid item xs={6} sx={{ mb: 4 }}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                  <Circle sx={{ mr: 1.5, fontSize: '0.75rem', color: hexToRGBA(theme.palette.primary.main, 0.7) }} />
                  <Typography variant='body2'>Electronic</Typography>
                </Box>
                <Typography sx={{ fontWeight: 600 }}>$24,900</Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                  <Circle sx={{ mr: 1.5, fontSize: '0.75rem', color: hexToRGBA(theme.palette.primary.main, 0.5) }} />
                  <Typography variant='body2'>FMCG</Typography>
                </Box>
                <Typography sx={{ fontWeight: 600 }}>$12,750</Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                  <Circle sx={{ mr: 1.5, fontSize: '0.75rem', color: theme.palette.customColors.bodyBg }} />
                  <Typography variant='body2'>Other Sales</Typography>
                </Box>
                <Typography sx={{ fontWeight: 600 }}>$50,200</Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default CardWidgetsSalesOverview
