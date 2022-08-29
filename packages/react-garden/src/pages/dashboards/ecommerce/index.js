// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Icons Imports
import Check from 'mdi-material-ui/Check'
import TrendingUp from 'mdi-material-ui/TrendingUp'
import CurrencyUsd from 'mdi-material-ui/CurrencyUsd'
import TruckOutline from 'mdi-material-ui/TruckOutline'

// ** Custom Components Imports
import CardStatisticsVerticalComponent from 'src/@core/components/card-statistics/card-stats-vertical'

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts'

// ** Demo Components Imports
import EcommerceTable from 'src/views/dashboards/ecommerce/EcommerceTable'
import EcommerceTotalProfit from 'src/views/dashboards/ecommerce/EcommerceTotalProfit'
import EcommerceNewVisitors from 'src/views/dashboards/ecommerce/EcommerceNewVisitors'
import EcommerceTotalRevenue from 'src/views/dashboards/ecommerce/EcommerceTotalRevenue'
import EcommerceTransactions from 'src/views/dashboards/ecommerce/EcommerceTransactions'
import EcommerceCongratulations from 'src/views/dashboards/ecommerce/EcommerceCongratulations'
import EcommerceTotalSalesDonut from 'src/views/dashboards/ecommerce/EcommerceTotalSalesDonut'
import EcommerceMeetingSchedule from 'src/views/dashboards/ecommerce/EcommerceMeetingSchedule'
import EcommerceTotalSalesRadial from 'src/views/dashboards/ecommerce/EcommerceTotalSalesRadial'
import EcommerceWebsiteStatistics from 'src/views/dashboards/ecommerce/EcommerceWebsiteStatistics'

const EcommerceDashboard = () => {
  return (
    <ApexChartWrapper>
      <Grid container spacing={6}>
        <Grid item xs={12} md={8} sx={{ order: 0, alignSelf: 'flex-end' }}>
          <EcommerceCongratulations />
        </Grid>
        <Grid item xs={12} sm={6} md={2} sx={{ order: 0 }}>
          <CardStatisticsVerticalComponent
            stats='1.2k'
            color='info'
            trendNumber='+38%'
            title='Transactions'
            icon={<TrendingUp />}
            subtitle='Daily Transactions'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2} sx={{ order: 0 }}>
          <CardStatisticsVerticalComponent
            stats='$95.2k'
            color='success'
            title='Revenue'
            trendNumber='+16%'
            icon={<CurrencyUsd />}
            subtitle='Revenue Increase'
          />
        </Grid>
        <Grid item xs={12} md={8} sx={{ order: 0 }}>
          <EcommerceTotalProfit />
        </Grid>
        <Grid item xs={12} md={4} sx={{ order: 0 }}>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <EcommerceTotalSalesDonut />
            </Grid>
            <Grid item xs={12} sm={6}>
              <EcommerceTotalRevenue />
            </Grid>
            <Grid item xs={12} sm={6}>
              <EcommerceTotalSalesRadial />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={6} lg={4} sx={{ order: 0 }}>
          <EcommerceTransactions />
        </Grid>
        <Grid item xs={12} md={6} lg={4} sx={{ order: 0 }}>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={6}>
              <CardStatisticsVerticalComponent
                stats='4.1k'
                color='error'
                title='Logistics'
                trendNumber='+25%'
                icon={<TruckOutline />}
                subtitle='Regional Logistics'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <CardStatisticsVerticalComponent
                stats='268'
                color='warning'
                title='Reports'
                icon={<Check />}
                trend='negative'
                trendNumber='-8%'
                subtitle='System Bugs'
              />
            </Grid>
            <Grid item xs={12}>
              <EcommerceNewVisitors />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={6} lg={4} sx={{ order: 0 }}>
          <EcommerceWebsiteStatistics />
        </Grid>
        <Grid item xs={12} lg={8} sx={{ order: [1, 1, 1, 0] }}>
          <EcommerceTable />
        </Grid>
        <Grid item xs={12} md={6} lg={4} sx={{ order: 0 }}>
          <EcommerceMeetingSchedule />
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}

export default EcommerceDashboard
