// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Styled Component Import
import ApexChartWrapper from '#/ui/~core/styles/libs/react-apexcharts'

// ** Demo Components Imports
import CardWidgetsAnalytics from '#/ui/views/ui/cards/widgets/CardWidgetsAnalytics'
import CardWidgetsSalesState from '#/ui/views/ui/cards/widgets/CardWidgetsSalesState'
import CardWidgetsTotalSales from '#/ui/views/ui/cards/widgets/CardWidgetsTotalSales'
import CardWidgetsWeeklySales from '#/ui/views/ui/cards/widgets/CardWidgetsWeeklySales'
import CardWidgetsPerformance from '#/ui/views/ui/cards/widgets/CardWidgetsPerformance'
import CardWidgetsTotalVisits from '#/ui/views/ui/cards/widgets/CardWidgetsTotalVisits'
import CardWidgetsTotalRevenue from '#/ui/views/ui/cards/widgets/CardWidgetsTotalRevenue'
import CardWidgetsTotalVisitors from '#/ui/views/ui/cards/widgets/CardWidgetsTotalVisitors'
import CardWidgetsRevenueReport from '#/ui/views/ui/cards/widgets/CardWidgetsRevenueReport'
import CardWidgetsSalesOverview from '#/ui/views/ui/cards/widgets/CardWidgetsSalesOverview'
import CardWidgetsWeeklyOverview from '#/ui/views/ui/cards/widgets/CardWidgetsWeeklyOverview'
import CardWidgetsActivityTimeline from '#/ui/views/ui/cards/widgets/CardWidgetsActivityTimeline'
import CardWidgetsTotalProfitRadialBar from '#/ui/views/ui/cards/widgets/CardWidgetsTotalProfitRadialBar'
import CardWidgetsTotalProfitStackedBar from '#/ui/views/ui/cards/widgets/CardWidgetsTotalProfitStackedBar'

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
