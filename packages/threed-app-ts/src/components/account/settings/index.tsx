// @mui material components
import Grid from '@mui/material/Grid'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'

// Settings page components
// import BaseLayout from "~/pages/account/components/BaseLayout"
import DashboardLayout from '~/components/elements/LayoutContainers/DashboardLayout'
import DashboardNavbar from '~/components/elements/Navbars/DashboardNavbar'
import Sidenav from '~/components/account/settings/components/Sidenav'
import Header from '~/components/account/settings/components/Header'
import BasicInfo from '~/components/account/settings/components/BasicInfo'
import ChangePassword from '~/components/account/settings/components/ChangePassword'
import Authentication from '~/components/account/settings/components/Authentication'
import Accounts from '~/components/account/settings/components/Accounts'
import Notifications from '~/components/account/settings/components/Notifications'
import Sessions from '~/components/account/settings/components/Sessions'
import DeleteAccount from '~/components/account/settings/components/DeleteAccount'

function Settings(): JSX.Element {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox mx={1}>
        <Grid
          container
          spacing={2}
        >
          <Grid
            item
            xs={12}
            lg={3}
          >
            <Sidenav />
          </Grid>
          <Grid
            item
            xs={12}
            lg={9}
          >
            <MDBox mb={3}>
              <Grid
                container
                spacing={2}
              >
                <Grid
                  item
                  xs={12}
                >
                  <Header />
                </Grid>
                <Grid
                  item
                  xs={12}
                >
                  <BasicInfo />
                </Grid>
                <Grid
                  item
                  xs={12}
                >
                  <ChangePassword />
                </Grid>
                <Grid
                  item
                  xs={12}
                >
                  <Authentication />
                </Grid>
                <Grid
                  item
                  xs={12}
                >
                  <Accounts />
                </Grid>
                <Grid
                  item
                  xs={12}
                >
                  <Notifications />
                </Grid>
                <Grid
                  item
                  xs={12}
                >
                  <Sessions />
                </Grid>
                <Grid
                  item
                  xs={12}
                >
                  <DeleteAccount />
                </Grid>
              </Grid>
            </MDBox>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  )
}

export default Settings
