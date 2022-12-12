// @mui material components
import Card from '@mui/material/Card'
// import Divider from "@mui/material/Divider";
import Icon from '@mui/material/Icon'

// Custom components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// Billing page components
import Transaction from '#/app/account/billing/components/Transaction'

function Transactions(): JSX.Element {
  return (
    <Card sx={{ height: '100%' }}>
      <MDBox
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        pt={3}
        px={2}
      >
        <MDTypography
          variant='h6'
          fontWeight='medium'
          textTransform='capitalize'
        >
          Your Transaction&apos;s
        </MDTypography>
        <MDBox
          display='flex'
          alignItems='flex-start'
        >
          <MDBox
            color='text'
            mr={0.5}
            lineHeight={0}
          >
            <Icon
              color='inherit'
              fontSize='small'
            >
              date_range
            </Icon>
          </MDBox>
          <MDTypography
            variant='button'
            color='text'
            fontWeight='regular'
          >
            23 - 30 March 2022
          </MDTypography>
        </MDBox>
      </MDBox>
      <MDBox
        pt={3}
        pb={2}
        px={2}
      >
        <MDBox mb={2}>
          <MDTypography
            variant='caption'
            color='text'
            fontWeight='bold'
            textTransform='uppercase'
          >
            newest
          </MDTypography>
        </MDBox>
        <MDBox
          component='ul'
          display='flex'
          flexDirection='column'
          p={0}
          m={0}
          sx={{ listStyle: 'none' }}
        >
          <Transaction
            color='error'
            icon='expand_more'
            name='Netflix'
            description='27 March 2022, at 12:30 PM'
            value='- $ 2,500'
          />
          <Transaction
            color='success'
            icon='expand_less'
            name='Apple'
            description='27 March 2022, at 04:30 AM'
            value='+ $ 2,000'
          />
        </MDBox>
        <MDBox
          mt={1}
          mb={2}
        >
          <MDTypography
            variant='caption'
            color='text'
            fontWeight='bold'
            textTransform='uppercase'
          >
            yesterday
          </MDTypography>
        </MDBox>
        <MDBox
          component='ul'
          display='flex'
          flexDirection='column'
          p={0}
          m={0}
          sx={{ listStyle: 'none' }}
        >
          <Transaction
            color='success'
            icon='expand_less'
            name='Stripe'
            description='27 March 2022, at 13:45 PM'
            value='+ $ 750'
          />
          <Transaction
            color='success'
            icon='expand_less'
            name='HubSpot'
            description='27 March 2022, at 12:30 PM'
            value='+ $ 1,000'
          />
          <Transaction
            color='success'
            icon='expand_less'
            name='Company Juice'
            description='27 March 2022, at 08:30 AM'
            value='+ $ 2,500'
          />
          <Transaction
            color='dark'
            icon='priority_high'
            name='Webflow'
            description='27 March 2022, at 05:00 AM'
            value='Pending'
          />
        </MDBox>
      </MDBox>
    </Card>
  )
}

export default Transactions
