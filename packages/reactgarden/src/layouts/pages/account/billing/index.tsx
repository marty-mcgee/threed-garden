// @mui material components
import Grid from "@mui/material/Grid"

// Company Juice Dashboard components
import MDBox from "components/MDBox"

// Company Juice Dashboard components
import MasterCard from "examples/Cards/MasterCard"
import DefaultInfoCard from "examples/Cards/InfoCards/DefaultInfoCard"

// Billing page components
import BaseLayout from "layouts/pages/account/components/BaseLayout"
import PaymentMethod from "layouts/pages/account/billing/components/PaymentMethod"
import Invoices from "layouts/pages/account/billing/components/Invoices"
import BillingInformation from "layouts/pages/account/billing/components/BillingInformation"
import Transactions from "layouts/pages/account/billing/components/Transactions"

function Billing(): JSX.Element {
  return (
    <BaseLayout stickyNavbar>
      <MDBox mt={4}>
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Grid container spacing={3}>
                <Grid item xs={12} xl={6}>
                  <MasterCard number={4562112245947852} holder="jack peterson" expires="11/22" />
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <DefaultInfoCard
                    icon="account_balance"
                    title="salary"
                    description="Belong Interactive"
                    value="+$2000"
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <DefaultInfoCard
                    icon="paypal"
                    title="paypal"
                    description="Freelance Payment"
                    value="$455.00"
                  />
                </Grid>
                <Grid item xs={12}>
                  <PaymentMethod />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Invoices />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <BillingInformation />
            </Grid>
            <Grid item xs={12} md={5}>
              <Transactions />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </BaseLayout>
  )
}

export default Billing
