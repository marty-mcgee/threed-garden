// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Styled Component Import
import ApexChartWrapper from '#/layout/ui/styles/react-apexcharts'

// ** Demo Components Imports
import CardWidgetsAnalytics from '#/layout/ui/components/cards/widgets/CardWidgetsAnalytics'
import CardWidgetsSalesState from '#/layout/ui/components/cards/widgets/CardWidgetsSalesState'
import CardWidgetsTotalSales from '#/layout/ui/components/cards/widgets/CardWidgetsTotalSales'
import CardWidgetsWeeklySales from '#/layout/ui/components/cards/widgets/CardWidgetsWeeklySales'
import CardWidgetsPerformance from '#/layout/ui/components/cards/widgets/CardWidgetsPerformance'
import CardWidgetsTotalVisits from '#/layout/ui/components/cards/widgets/CardWidgetsTotalVisits'
import CardWidgetsTotalRevenue from '#/layout/ui/components/cards/widgets/CardWidgetsTotalRevenue'
import CardWidgetsTotalVisitors from '#/layout/ui/components/cards/widgets/CardWidgetsTotalVisitors'
import CardWidgetsRevenueReport from '#/layout/ui/components/cards/widgets/CardWidgetsRevenueReport'
import CardWidgetsSalesOverview from '#/layout/ui/components/cards/widgets/CardWidgetsSalesOverview'
import CardWidgetsWeeklyOverview from '#/layout/ui/components/cards/widgets/CardWidgetsWeeklyOverview'
import CardWidgetsActivityTimeline from '#/layout/ui/components/cards/widgets/CardWidgetsActivityTimeline'
import CardWidgetsTotalProfitRadialBar from '#/layout/ui/components/cards/widgets/CardWidgetsTotalProfitRadialBar'
import CardWidgetsTotalProfitStackedBar from '#/layout/ui/components/cards/widgets/CardWidgetsTotalProfitStackedBar'

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
