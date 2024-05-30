// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Demo Components Imports
import CardTeamMembers from '#/layout/ui/components/cards/advanced/CardTeamMembers'
import CardPlanUpgrade from '#/layout/ui/components/cards/advanced/CardPlanUpgrade'
import CardCafeBadilico from '#/layout/ui/components/cards/advanced/CardCafeBadilico'
import CardTransactions from '#/layout/ui/components/cards/advanced/CardTransactions'
import CardTotalEarnings from '#/layout/ui/components/cards/advanced/CardTotalEarings'
import CardFinanceSummary from '#/layout/ui/components/cards/advanced/CardFinanceSummary'
import CardDepositWithdraw from '#/layout/ui/components/cards/advanced/CardDepositWithdraw'
import CardSocialAnalytics from '#/layout/ui/components/cards/advanced/CardSocialAnalytics'
import CardMeetingSchedule from '#/layout/ui/components/cards/advanced/CardMeetingSchedule'
import CardDeveloperMeetup from '#/layout/ui/components/cards/advanced/CardDeveloperMeetup'
import CardSalesByCountries from '#/layout/ui/components/cards/advanced/CardSalesByCountries'
import CardActivityTimeline from '#/layout/ui/components/cards/advanced/CardActivityTimeline'
import CardWebsiteStatistics from '#/layout/ui/components/cards/advanced/CardWebsiteStatistics'

const CardsAdvanced = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={6} lg={4}>
        <CardTransactions />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <CardPlanUpgrade />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <CardMeetingSchedule />
      </Grid>
      <Grid item xs={12} md={6} lg={5}>
        <CardTeamMembers />
      </Grid>
      <Grid item xs={12} lg={7}>
        <CardDepositWithdraw />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <CardTotalEarnings />
      </Grid>
      <Grid item xs={12} md={6} lg={5}>
        <CardFinanceSummary />
      </Grid>
      <Grid item xs={12} md={6} lg={3}>
        <CardSocialAnalytics />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <CardWebsiteStatistics />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <CardDeveloperMeetup />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <CardSalesByCountries />
      </Grid>
      <Grid item xs={12} md={6} lg={8}>
        <CardActivityTimeline />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <CardCafeBadilico />
      </Grid>
    </Grid>
  )
}

export default CardsAdvanced
