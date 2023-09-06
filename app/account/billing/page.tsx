'use client'

// @mui material components
import Grid from '@mui/material/Grid'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'

// ThreeD Garden components
import MasterCard from '#/ui/elements/Cards/MasterCard'
import DefaultInfoCard from '#/ui/elements/Cards/InfoCards/DefaultInfoCard'

// Billing page components
// import BaseLayout from "~/pagesX/account/components/BaseLayout"
import DashboardLayout from '#/ui/layouts/LayoutContainers/DashboardLayout'
import DashboardNavbar from '#/ui/layouts/Navbars/DashboardNavbar'
import PaymentMethod from '#/app/account/billing/components/PaymentMethod'
import Invoices from '#/app/account/billing/components/Invoices'
import BillingInformation from '#/app/account/billing/components/BillingInformation'
import Transactions from '#/app/account/billing/components/Transactions'

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
