// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Demo Components Imports
import CardUser from '#/layout/ui/components/cards/basic/CardUser'
import CardImgTop from '#/layout/ui/components/cards/basic/CardImgTop'
import CardMobile from '#/layout/ui/components/cards/basic/CardMobile'
import CardSupport from '#/layout/ui/components/cards/basic/CardSupport'
import CardTwitter from '#/layout/ui/components/cards/basic/CardTwitter'
import CardFacebook from '#/layout/ui/components/cards/basic/CardFacebook'
import CardLinkedIn from '#/layout/ui/components/cards/basic/CardLinkedIn'
import CardAppleWatch from '#/layout/ui/components/cards/basic/CardAppleWatch'
import CardMembership from '#/layout/ui/components/cards/basic/CardMembership'
import CardInfluencer from '#/layout/ui/components/cards/basic/CardInfluencer'
import CardNavigation from '#/layout/ui/components/cards/basic/CardNavigation'
import CardWithCollapse from '#/layout/ui/components/cards/basic/CardWithCollapse'
import CardVerticalRatings from '#/layout/ui/components/cards/basic/CardVerticalRatings'
import CardNavigationCenter from '#/layout/ui/components/cards/basic/CardNavigationCenter'
import CardHorizontalRatings from '#/layout/ui/components/cards/basic/CardHorizontalRatings'

const CardBasic = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sx={{ pb: 4 }}>
        <Typography variant='h5'>Basic Cards</Typography>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardImgTop />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardUser />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardWithCollapse />
      </Grid>
      <Grid item xs={12} sm={6}>
        <CardMobile />
      </Grid>
      <Grid item xs={12} sm={6}>
        <CardHorizontalRatings />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardAppleWatch />
      </Grid>
      <Grid item xs={12} md={8}>
        <CardMembership />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardInfluencer />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardVerticalRatings />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardSupport />
      </Grid>
      <Grid item xs={12} sx={{ pb: 4, pt: (theme) => `${theme.spacing(17.5)} !important` }}>
        <Typography variant='h5'>Navigation Cards</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardNavigation />
      </Grid>
      <Grid item xs={12} md={6}>
        <CardNavigationCenter />
      </Grid>
      <Grid item xs={12} sx={{ pb: 4, pt: (theme) => `${theme.spacing(17.5)} !important` }}>
        <Typography variant='h5'>Solid Cards</Typography>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardTwitter />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardFacebook />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardLinkedIn />
      </Grid>
    </Grid>
  )
}

export default CardBasic
