// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Demo Components Imports
import CardAward from '#/layout/ui/components/cards/gamification/CardAward'
import CardWelcomeBack from '#/layout/ui/components/cards/gamification/CardWelcomeBack'
import CardUpgradeAccount from '#/layout/ui/components/cards/gamification/CardUpgradeAccount'
import CardCongratulations from '#/layout/ui/components/cards/gamification/CardCongratulations'

const CardGamification = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={4}>
        <CardAward />
      </Grid>
      <Grid item xs={12} md={8} sx={{ alignSelf: 'flex-end' }}>
        <CardCongratulations />
      </Grid>
      <Grid item xs={12} md={8} sx={{ alignSelf: 'flex-end' }}>
        <CardWelcomeBack />
      </Grid>
      <Grid item xs={12} md={4}>
        <CardUpgradeAccount />
      </Grid>
    </Grid>
  )
}

export default CardGamification
