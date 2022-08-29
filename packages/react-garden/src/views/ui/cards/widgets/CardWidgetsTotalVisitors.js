// ** MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import DotsVertical from 'mdi-material-ui/DotsVertical'

// ** Custom Components Imports
import ReactApexcharts from 'src/@core/components/react-apexcharts'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

const CardWidgetsTotalVisitors = () => {
  // ** Hook
  const theme = useTheme()

  const options = {
    colors: [
      theme.palette.primary.main,
      hexToRGBA(theme.palette.primary.main, 0.7),
      hexToRGBA(theme.palette.primary.main, 0.5),
      theme.palette.customColors.bodyBg
    ],
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: 'bottom'
    },
    labels: ['FR', 'UK', 'ESP', 'USA'],
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
              label: 'Weekly Visits',
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
        title='Total Visitors'
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
        <ReactApexcharts type='donut' height={292} series={[12, 25, 13, 50]} options={options} />
      </CardContent>
    </Card>
  )
}

export default CardWidgetsTotalVisitors
