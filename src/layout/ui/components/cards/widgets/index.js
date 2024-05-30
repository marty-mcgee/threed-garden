// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Styled Component Import
import ApexChartWrapper from '#/ui/styles/react-apexcharts'

// ** Demo Components Imports
import CardWidgetsAnalytics from '#/ui/components/cards/widgets/CardWidgetsAnalytics'
import CardWidgetsSalesState from '#/ui/components/cards/widgets/CardWidgetsSalesState'
import CardWidgetsTotalSales from '#/ui/components/cards/widgets/CardWidgetsTotalSales'
import CardWidgetsWeeklySales from '#/ui/components/cards/widgets/CardWidgetsWeeklySales'
import CardWidgetsPerformance from '#/ui/components/cards/widgets/CardWidgetsPerformance'
import CardWidgetsTotalVisits from '#/ui/components/cards/widgets/CardWidgetsTotalVisits'
import CardWidgetsTotalRevenue from '#/ui/components/cards/widgets/CardWidgetsTotalRevenue'
import CardWidgetsTotalVisitors from '#/ui/components/cards/widgets/CardWidgetsTotalVisitors'
import CardWidgetsRevenueReport from '#/ui/components/cards/widgets/CardWidgetsRevenueReport'
import CardWidgetsSalesOverview from '#/ui/components/cards/widgets/CardWidgetsSalesOverview'
import CardWidgetsWeeklyOverview from '#/ui/components/cards/widgets/CardWidgetsWeeklyOverview'
import CardWidgetsActivityTimeline from '#/ui/components/cards/widgets/CardWidgetsActivityTimeline'
import CardWidgetsTotalProfitRadialBar from '#/ui/components/cards/widgets/CardWidgetsTotalProfitRadialBar'
import CardWidgetsTotalProfitStackedBar from '#/ui/components/cards/widgets/CardWidgetsTotalProfitStackedBar'

const CardWidgets = () => {
  return (
    <ApexChartWrapper>
      <Grid container spacing={6}>
        <Grid item xs={12} md={8}>
          <CardWidgetsTotalProfitStackedBar />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardWidgetsTotalVisitors />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardWidgetsWeeklySales />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardWidgetsTotalRevenue />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardWidgetsWeeklyOverview />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardWidgetsPerformance />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardWidgetsAnalytics />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <CardWidgetsSalesState />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CardWidgetsTotalProfitRadialBar />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <CardWidgetsTotalSales />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <CardWidgetsTotalVisits />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <CardWidgetsRevenueReport />
        </Grid>
        <Grid item xs={12} md={6}>
          <CardWidgetsActivityTimeline />
        </Grid>
        <Grid item xs={12} md={6}>
          <CardWidgetsSalesOverview />
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}

export default CardWidgets
