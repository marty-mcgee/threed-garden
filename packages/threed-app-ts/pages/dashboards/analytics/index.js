// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Icons Imports
import Poll from 'mdi-material-ui/Poll'
import BriefcaseVariantOutline from 'mdi-material-ui/BriefcaseVariantOutline'

// ** Custom Components Imports
import CardStatisticsVerticalComponent from '#/ui/~core/components/card-statistics/card-stats-vertical'

// ** Styled Component Import
import ApexChartWrapper from '#/ui/~core/styles/libs/react-apexcharts'

// ** Demo Components Imports
import AnalyticsTable from '#/ui/views/dashboards/analytics/AnalyticsTable'
import AnalyticsTrophy from '#/ui/views/dashboards/analytics/AnalyticsTrophy'
import AnalyticsSessions from '#/ui/views/dashboards/analytics/AnalyticsSessions'
import AnalyticsTotalProfit from '#/ui/views/dashboards/analytics/AnalyticsTotalProfit'
import AnalyticsPerformance from '#/ui/views/dashboards/analytics/AnalyticsPerformance'
import AnalyticsTotalEarning from '#/ui/views/dashboards/analytics/AnalyticsTotalEarning'
import AnalyticsStatisticsCard from '#/ui/views/dashboards/analytics/AnalyticsStatisticsCard'
import AnalyticsWeeklyOverview from '#/ui/views/dashboards/analytics/AnalyticsWeeklyOverview'
import AnalyticsDepositWithdraw from '#/ui/views/dashboards/analytics/AnalyticsDepositWithdraw'
import AnalyticsSalesByCountries from '#/ui/views/dashboards/analytics/AnalyticsSalesByCountries'

const AnalyticsDashboard = () => {
  return (
    <ApexChartWrapper>
      <Grid container spacing={6}>
        <Grid item xs={12} md={4}>
          <AnalyticsTrophy />
        </Grid>
        <Grid item xs={12} md={8}>
          <AnalyticsStatisticsCard />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <AnalyticsWeeklyOverview />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <AnalyticsTotalEarning />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Grid container spacing={6}>
            <Grid item xs={6}>
              <AnalyticsTotalProfit />
            </Grid>
            <Grid item xs={6}>
              <CardStatisticsVerticalComponent
                stats='$25.6k'
                icon={<Poll />}
                color='secondary'
                trendNumber='+42%'
                title='Total Profit'
                subtitle='Weekly Profit'
              />
            </Grid>
            <Grid item xs={6}>
              <CardStatisticsVerticalComponent
                stats='862'
                trend='negative'
                trendNumber='-18%'
                title='New Project'
                subtitle='Yearly Project'
                icon={<BriefcaseVariantOutline />}
              />
            </Grid>
            <Grid item xs={6}>
              <AnalyticsSessions />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <AnalyticsPerformance />
        </Grid>
        <Grid item xs={12} md={8}>
          <AnalyticsDepositWithdraw />
        </Grid>
        <Grid item xs={12} md={4}>
          <AnalyticsSalesByCountries />
        </Grid>
        <Grid item xs={12} md={12} lg={8}>
          <AnalyticsTable />
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}

export default AnalyticsDashboard