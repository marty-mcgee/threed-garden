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

const CardWidgetsTotalVisits = () => {
  // ** Hook
  const theme = useTheme()

  const options = {
    chart: {
      sparkline: { enabled: true }
    },
    labels: ['Cricket'],
    stroke: { lineCap: 'round' },
    grid: {
      padding: {
        top: -10
      }
    },
    colors: [theme.palette.info.main],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'horizontal',
        shadeIntensity: 0.2,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.1,
        stops: [0, 90]
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
      radialBar: {
        endAngle: 180,
        startAngle: -180,
        inverseOrder: true,
        hollow: { size: '62%' },
        dataLabels: {
          name: { offsetY: 26 },
          value: {
            offsetY: -14,
            formatter: value => `${value}k`
          },
          total: {
            show: true,
            label: 'Growth',
            fontSize: '14px'
          }
        }
      }
    }
  }

  return (
    <Card>
      <CardHeader
        title='Total Visits'
        action={
          <IconButton size='small' aria-label='settings' className='card-more-options' sx={{ color: 'text.secondary' }}>
            <DotsVertical />
          </IconButton>
        }
        titleTypographyProps={{
          sx: {
            fontSize: '1rem !important',
            fontWeight: '600 !important',
            lineHeight: '1.5rem !important',
            letterSpacing: '0.15px !important'
          }
        }}
      />
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          '& .apexcharts-datalabel-label': {
            fontSize: '0.875rem !important'
          },
          '& .apexcharts-datalabel-value': {
            fontWeight: '500 !important',
            fontSize: '1.5rem !important'
          }
        }}
      >
        <ReactApexcharts type='radialBar' height={199} series={[78]} options={options} />
        <Typography sx={{ mb: 2.5 }} variant='caption'>
          42.2k New Visits
        </Typography>
        <CustomChip
          skin='light'
          color='info'
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

export default CardWidgetsTotalVisits
