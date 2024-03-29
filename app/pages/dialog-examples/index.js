// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Third Party Components
import axios from 'axios'

// ** Demo Components Imports
import DialogAddCard from '#/ui/pages/dialog-examples/DialogAddCard'
import DialogPricing from '#/ui/pages/dialog-examples/DialogPricing'
import DialogReferEarn from '#/ui/pages/dialog-examples/DialogReferEarn'
import DialogCreateApp from '#/ui/pages/dialog-examples/DialogCreateApp'
import DialogAddAddress from '#/ui/pages/dialog-examples/DialogAddAddress'
import DialogShareProject from '#/ui/pages/dialog-examples/DialogShareProject'
import DialogEditUserInfo from '#/ui/pages/dialog-examples/DialogEditUserInfo'
import DialogAuthentication from '#/ui/pages/dialog-examples/DialogAuthentication'

const DialogExamples = ({ apiPricingData }) => (
  <Grid container spacing={6} className='match-height'>
    <Grid item md={4} sm={6} xs={12}>
      <DialogShareProject />
    </Grid>
    <Grid item md={4} sm={6} xs={12}>
      <DialogAddCard />
    </Grid>
    <Grid item md={4} sm={6} xs={12}>
      <DialogPricing data={apiPricingData} />
    </Grid>
    <Grid item md={4} sm={6} xs={12}>
      <DialogReferEarn />
    </Grid>
    <Grid item md={4} sm={6} xs={12}>
      <DialogAddAddress />
    </Grid>
    <Grid item md={4} sm={6} xs={12}>
      <DialogCreateApp />
    </Grid>
    <Grid item md={4} sm={6} xs={12}>
      <DialogAuthentication />
    </Grid>
    <Grid item md={4} sm={6} xs={12}>
      <DialogEditUserInfo />
    </Grid>
  </Grid>
)

export const getStaticProps = async () => {
  const res = await axios.get('/pages/pricing')
  const apiPricingData = res.data

  return {
    props: {
      apiPricingData,
    },
  }
}

export default DialogExamples
