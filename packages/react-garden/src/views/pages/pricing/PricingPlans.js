// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Custom Components Imports
import PlanDetails from 'src/@core/components/plan-details'

const PricingPlans = props => {
  // ** Props
  const { plan, data } = props

  const renderPlan = () => {
    return data?.pricingPlans.map(item => {
      return (
        <Grid item xs={12} md={4} key={item.title.toLowerCase()}>
          <PlanDetails plan={plan} data={item} />
        </Grid>
      )
    })
  }

  return (
    <Grid container spacing={6}>
      {renderPlan()}
    </Grid>
  )
}

export default PricingPlans
