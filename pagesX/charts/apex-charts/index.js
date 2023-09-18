// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import PageHeader from '#/ui/components/page-header'

// ** Styled Component Import
import ApexChartWrapper from '#/ui/styles/react-apexcharts'
import DatePickerWrapper from '#/ui/styles/react-datepicker'

// ** Demo Components Imports
import ApexBarChart from '#/ui/charts/apex-charts/ApexBarChart'
import ApexAreaChart from '#/ui/charts/apex-charts/ApexAreaChart'
import ApexLineChart from '#/ui/charts/apex-charts/ApexLineChart'
import ApexRadarChart from '#/ui/charts/apex-charts/ApexRadarChart'
import ApexDonutChart from '#/ui/charts/apex-charts/ApexDonutChart'
import ApexColumnChart from '#/ui/charts/apex-charts/ApexColumnChart'
import ApexScatterChart from '#/ui/charts/apex-charts/ApexScatterChart'
import ApexHeatmapChart from '#/ui/charts/apex-charts/ApexHeatmapChart'
import ApexRadialBarChart from '#/ui/charts/apex-charts/ApexRadialBarChart'
import ApexCandlestickChart from '#/ui/charts/apex-charts/ApexCandlestickChart'

// ** Third Party Styles Imports
// import 'react-datepicker/dist/react-datepicker.css'

const ApexCharts = () => {
  return (
    <ApexChartWrapper>
      <DatePickerWrapper>
        <Grid container spacing={6} className='match-height'>
          <PageHeader
            title={
              <Typography variant='h5'>
                <Link href='https://github.com/apexcharts/react-apexcharts' target='_blank'>
                  React ApexCharts
                </Link>
              </Typography>
            }
            subtitle={<Typography variant='body2'>React Component for ApexCharts</Typography>}
          />
          <Grid item xs={12}>
            <ApexAreaChart />
          </Grid>
          <Grid item xs={12}>
            <ApexColumnChart />
          </Grid>
          <Grid item xs={12}>
            <ApexScatterChart />
          </Grid>
          <Grid item xs={12}>
            <ApexLineChart />
          </Grid>
          <Grid item xs={12} md={6}>
            <ApexBarChart />
          </Grid>
          <Grid item xs={12} md={6}>
            <ApexCandlestickChart />
          </Grid>
          <Grid item xs={12} md={6}>
            <ApexHeatmapChart />
          </Grid>
          <Grid item xs={12} md={6}>
            <ApexRadialBarChart />
          </Grid>
          <Grid item xs={12} md={6}>
            <ApexRadarChart />
          </Grid>
          <Grid item xs={12} md={6}>
            <ApexDonutChart />
          </Grid>
        </Grid>
      </DatePickerWrapper>
    </ApexChartWrapper>
  )
}

export default ApexCharts
