// @mui material components
import Grid from '@mui/material/Grid'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'

// Settings page components
// import BaseLayout from "~/pages/account/components/BaseLayout"
import DashboardLayout from '#/ui/elements/LayoutContainers/DashboardLayout'
import DashboardNavbar from '#/ui/elements/Navbars/DashboardNavbar'
import Sidenav from '#/ui/account/settings/components/Sidenav'
import Header from '#/ui/account/settings/components/Header'
import BasicInfo from '#/ui/account/settings/components/BasicInfo'
import ChangePassword from '#/ui/account/settings/components/ChangePassword'
import Authentication from '#/ui/account/settings/components/Authentication'
import Accounts from '#/ui/account/settings/components/Accounts'
import Notifications from '#/ui/account/settings/components/Notifications'
import Sessions from '#/ui/account/settings/components/Sessions'
import DeleteAccount from '#/ui/account/settings/components/DeleteAccount'

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
