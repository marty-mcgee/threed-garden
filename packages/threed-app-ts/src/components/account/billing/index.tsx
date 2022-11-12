// @mui material components
import Grid from '@mui/material/Grid'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'

// ThreeD Garden components
import MasterCard from '~/components/elements/Cards/MasterCard'
import DefaultInfoCard from '~/components/elements/Cards/InfoCards/DefaultInfoCard'

// Billing page components
// import BaseLayout from "~/pages/account/components/BaseLayout"
import DashboardLayout from '~/components/elements/LayoutContainers/DashboardLayout'
import DashboardNavbar from '~/components/elements/Navbars/DashboardNavbar'
import PaymentMethod from '~/components/account/billing/components/PaymentMethod'
import Invoices from '~/components/account/billing/components/Invoices'
import BillingInformation from '~/components/account/billing/components/BillingInformation'
import Transactions from '~/components/account/billing/components/Transactions'

function Billing(): JSX.Element {
  return (
    <DashboardLayout stickyNavbar>
      <DashboardNavbar />
      <MDBox mx={1}>
        <MDBox mb={3}>
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              lg={8}
            >
              <Grid
                container
                spacing={2}
              >
                <Grid
                  item
                  xs={12}
                  xl={6}
                >
                  <MasterCard
                    number={4562112245947852}
                    holder='jack peterson'
                    expires='11/22'
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={6}
                  xl={3}
                >
                  <DefaultInfoCard
                    icon='account_balance'
                    title='salary'
                    description='Belong Interactive'
                    value='+$2000'
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                  md={6}
                  xl={3}
                >
                  <DefaultInfoCard
                    icon='paypal'
                    title='paypal'
                    description='Freelance Payment'
                    value='$455.00'
                  />
                </Grid>
                <Grid
                  item
                  xs={12}
                >
                  <PaymentMethod />
                </Grid>
              </Grid>
            </Grid>
            <Grid
              item
              xs={12}
              lg={4}
            >
              <Invoices />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox mb={3}>
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              md={7}
            >
              <BillingInformation />
            </Grid>
            <Grid
              item
              xs={12}
              md={5}
            >
              <Transactions />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </DashboardLayout>
  )
}

export default Billing
