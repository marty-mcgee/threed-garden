// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Third Party Components
import axios from 'axios'

// ** Styled Components
import ApexChartWrapper from '#/layout/ui/styles/react-apexcharts'

// ** Demo Components Imports
import CardStatsLineChart from '#/layout/ui/components/cards/statistics/CardStatsLineChart'
import CardStatisticsVertical from '#/layout/ui/components/cards/statistics/CardStatisticsVertical'
import CardStatsLineAreaChart from '#/layout/ui/components/cards/statistics/CardStatsLineAreaChart'
import CardStatsRadialBarChart from '#/layout/ui/components/cards/statistics/CardStatsRadialBarChart'
import CardStatisticsHorizontal from '#/layout/ui/components/cards/statistics/CardStatisticsHorizontal'
import CardStatisticsTotalSales from '#/layout/ui/components/cards/statistics/CardStatisticsTotalSales'
import CardStatisticsCharacters from '#/layout/ui/components/cards/statistics/CardStatisticsCharacters'
import CardStatisticsTransactions from '#/layout/ui/components/cards/statistics/CardStatisticsTransactions'
import CardStatsLineChartWithShadow from '#/layout/ui/components/cards/statistics/CardStatsLineChartWithShadow'
import CardStatsDistributedColumnChart from '#/layout/ui/components/cards/statistics/CardStatsDistributedColumnChart'
import CardStatsBarChartWithNegativeValues from '#/layout/ui/components/cards/statistics/CardStatsBarChartWithNegativeValues'

const CardStatistics = ({ apiData }) => {
  return (
    <ApexChartWrapper>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <CardStatisticsHorizontal data={apiData.statsHorizontal} />
        </Grid>
        <Grid item xs={12} md={8}>
          <CardStatisticsTransactions />
        </Grid>
        <Grid item xs={12} md={4}>
          <CardStatisticsTotalSales />
        </Grid>
        <Grid item xs={12}>
          <CardStatisticsVertical data={apiData.statsVertical} />
        </Grid>
        <Grid item xs={12}>
          <CardStatisticsCharacters data={apiData.statsCharacter} />
        </Grid>
        <Grid item xs={12} sm={4} lg={2}>
          <CardStatsLineChartWithShadow />
        </Grid>
        <Grid item xs={12} sm={4} lg={2}>
          <CardStatsBarChartWithNegativeValues />
        </Grid>
        <Grid item xs={12} sm={4} lg={2}>
          <CardStatsLineAreaChart />
        </Grid>
        <Grid item xs={12} sm={4} lg={2}>
          <CardStatsRadialBarChart />
        </Grid>
        <Grid item xs={12} sm={4} lg={2}>
          <CardStatsDistributedColumnChart />
        </Grid>
        <Grid item xs={12} sm={4} lg={2}>
          <CardStatsLineChart />
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}

export const getStaticProps = async () => {
  const res = await axios.get('/cards/statistics')
  const apiData = res.data

  return {
    props: {
      apiData,
    },
  }
}

export default CardStatistics
