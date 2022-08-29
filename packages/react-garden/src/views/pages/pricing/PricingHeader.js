// ** MUI Imports
import Box from '@mui/material/Box'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import InputLabel from '@mui/material/InputLabel'

const PricingHeader = props => {
  // ** Props
  const { plan, handleChange } = props

  return (
    <Box sx={{ mb: 11, textAlign: 'center' }}>
      <Typography variant='h4'>Pricing Plans</Typography>
      <Box sx={{ my: 5.5 }}>
        <Typography variant='body2'>
          All plans include 40+ advanced tools and features to boost your product.
        </Typography>
        <Typography variant='body2'>Choose the best plan to fit your needs.</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <InputLabel
          htmlFor='pricing-switch'
          sx={{ fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', color: 'text.secondary' }}
        >
          Monthly
        </InputLabel>
        <Switch id='pricing-switch' onChange={handleChange} checked={plan === 'annually'} />
        <InputLabel
          htmlFor='pricing-switch'
          sx={{ fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', color: 'text.secondary' }}
        >
          Annually
        </InputLabel>
      </Box>
    </Box>
  )
}

export default PricingHeader
