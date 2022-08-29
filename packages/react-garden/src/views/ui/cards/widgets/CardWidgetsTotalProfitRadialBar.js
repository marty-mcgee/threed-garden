// ** MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import DotsVertical from 'mdi-material-ui/DotsVertical'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const CardWidgetsTotalProfitRadialBar = () => {
  // ** Hook
  const theme = useTheme()

  const options = {
    chart: {
      sparkline: { enabled: true }
    },
    stroke: { dashArray: 5 },
    colors: [theme.palette.primary.main],
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
        endAngle: 90,
        startAngle: -90,
        hollow: { size: '55%' },
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: -5,
            formatter: val => {
              const num = (val * 35250) / 100

              return num > 999 ? `${(num / 1000).toFixed(1)}k` : `${num}`
            }
          }
        }
      }
    }
  }

  return (
    <Card>
      <CardHeader
        title='Total Profit'
        action={
          <IconButton size='small' aria-label='settings' className='card-more-options' sx={{ color: 'text.secondary' }}>
            <DotsVertical />
          </IconButton>
        }
        titleTypographyProps={{
          sx: {
            fontSize: '1rem !important',
            fontWeight: '600 !important',
            letterSpacing: '0.15px !important'
          }
        }}
      />
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          pt: `${theme.spacing(7)} !important`,
          '& .apexcharts-datalabel-value': {
            lineHeight: '2rem',
            fontWeight: '500 !important',
            fontSize: '1.25rem !important'
          }
        }}
      >
        <ReactApexcharts type='radialBar' height={243} series={[80]} options={options} />
        <Typography sx={{ mt: 10, mb: 2.5 }} variant='caption'>
          18k New Sales
        </Typography>
        <CustomChip
          skin='light'
          color='primary'
          label='This Year'
          sx={{
            height: 20,
            fontSize: '0.75rem',
            fontWeight: 500,
            borderRadius: '10px',
            '& .MuiChip-label': { px: 2, lineHeight: '20px' }
          }}
        />
      </CardContent>
    </Card>
  )
}

export default CardWidgetsTotalProfitRadialBar
