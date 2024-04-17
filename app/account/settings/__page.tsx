'use client'

// @mui material components
import Grid from '@mui/material/Grid'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'

// Settings page components
// import BaseLayout from "~/pagesX/account/components/BaseLayout"
import DashboardLayout from '#/ui/layouts/_old/LayoutContainers/DashboardLayout'
import DashboardNavbar from '#/ui/layouts/_old/Navbars/DashboardNavbar'
import Sidenav from '#/app/account/settings/components/Sidenav'
import Header from '#/app/account/settings/components/Header'
import BasicInfo from '#/app/account/settings/components/BasicInfo'
import ChangePassword from '#/app/account/settings/components/ChangePassword'
import Authentication from '#/app/account/settings/components/Authentication'
import Accounts from '#/app/account/settings/components/Accounts'
import Notifications from '#/app/account/settings/components/Notifications'
import Sessions from '#/app/account/settings/components/Sessions'
import DeleteAccount from '#/app/account/settings/components/DeleteAccount'

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
