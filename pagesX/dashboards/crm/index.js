// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Icons Imports
import BriefcaseVariantOutline from 'mdi-material-ui/BriefcaseVariantOutline'

// ** Custom Components Imports
import CardStatisticsCharacter from '#/ui/components/card-statistics/card-stats-with-image'
import CardStatisticsVerticalComponent from '#/ui/components/card-statistics/card-stats-vertical'

// ** Styled Component Import
import ApexChartWrapper from '#/ui/styles/react-apexcharts'

// ** Demo Components Imports
import CrmTotalSales from '#/ui/dashboards/crm/CrmTotalSales'
import CrmWeeklySales from '#/ui/dashboards/crm/CrmWeeklySales'
import CrmTotalGrowth from '#/ui/dashboards/crm/CrmTotalGrowth'
import CrmUpgradePlan from '#/ui/dashboards/crm/CrmUpgradePlan'
import CrmRevenueReport from '#/ui/dashboards/crm/CrmRevenueReport'
import CrmSalesOverview from '#/ui/dashboards/crm/CrmSalesOverview'
import CrmStatisticsCard from '#/ui/dashboards/crm/CrmStatisticsCard'
import CrmMeetingSchedule from '#/ui/dashboards/crm/CrmMeetingSchedule'
import CrmDeveloperMeetup from '#/ui/dashboards/crm/CrmDeveloperMeetup'
import CrmActivityTimeline from '#/ui/dashboards/crm/CrmActivityTimeline'

const data = [
  {
    stats: '13.7k',
    title: 'Ratings',
    trendNumber: '+38%',
    chipColor: 'primary',
    chipText: 'Year of 2022',
    src: '/images/cards/pose_f9.png',
  },
  {
    stats: '24.5k',
    trend: 'negative',
    title: 'Sessions',
    trendNumber: '-22%',
    chipText: 'Last Week',
    chipColor: 'secondary',
    src: '/images/cards/pose_m18.png',
  },
]

const CRMDashboard = () => {
  return (
    <ApexChartWrapper>
      <Grid container spacing={6}>
        <Grid item xs={12} sm={6} md={3} sx={{ pt: (theme) => `${theme.spacing(12.25)} !important` }}>
          <CardStatisticsCharacter data={data[0]} />
        </Grid>
        <Grid item xs={12} sm={6} md={3} sx={{ pt: (theme) => `${theme.spacing(12.25)} !important` }}>
          <CardStatisticsCharacter data={data[1]} />
        </Grid>
        <Grid item xs={12} md={6}>
          <CrmStatisticsCard />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CrmTotalSales />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <CrmRevenueReport />
        </Grid>
        <Grid item xs={12} md={6}>
          <CrmSalesOverview />
        </Grid>
        <Grid item xs={12} md={6}>
          <CrmActivityTimeline />
        </Grid>
        <Grid item xs={12} md={6}>
          <Grid container spacing={6}>
            <Grid item xs={12} sm={8}>
              <CrmWeeklySales />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Grid container spacing={6}>
                <Grid item xs={6} sm={12}>
                  <CrmTotalGrowth />
                </Grid>
                <Grid item xs={6} sm={12}>
                  <CardStatisticsVerticalComponent
                    stats='862'
                    trend='negative'
                    trendNumber='-18%'
                    title='New Project'
                    subtitle='Yearly Project'
                    icon={<BriefcaseVariantOutline />}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <CrmUpgradePlan />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <CrmMeetingSchedule />
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <CrmDeveloperMeetup />
        </Grid>
      </Grid>
    </ApexChartWrapper>
  )
}

export default CRMDashboard
