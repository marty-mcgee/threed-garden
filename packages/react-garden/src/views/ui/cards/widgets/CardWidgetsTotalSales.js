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

const CardWidgetsTotalSales = () => {
  // ** Hook
  const theme = useTheme()

  const options = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityTo: 0.2,
        opacityFrom: 1,
        shadeIntensity: 0,
        type: 'horizontal',
        stops: [0, 100, 100]
      }
    },
    stroke: {
      width: 5,
      curve: 'smooth',
      lineCap: 'round'
    },
    legend: { show: false },
    colors: [theme.palette.success.main],
    grid: {
      show: false,
      padding: {
        left: 0,
        right: 0,
        bottom: -10
      }
    },
    xaxis: {
      axisTicks: { show: false },
      axisBorder: { show: false },
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    },
    yaxis: {
      labels: { show: false }
    }
  }

  return (
    <Card>
      <CardHeader
        title='Total Sales'
        subheader='$21,845'
        subheaderTypographyProps={{
          sx: { mt: 1, fontWeight: 500, lineHeight: '2rem', color: 'text.primary', fontSize: '1.25rem !important' }
        }}
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
          '& .apexcharts-xaxis-label': { fontSize: '0.875rem' }
        }}
      >
        <ReactApexcharts
          type='line'
          height={206}
          options={options}
          series={[{ name: 'Total Sales', data: [0, 258, 30, 240, 150, 400] }]}
        />
      </CardContent>
    </Card>
  )
}

export default CardWidgetsTotalSales
