import { useState } from 'react'

// @mui material components
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'
import MDAlert from '#/lib/mui/MDAlert'
import MDButton from '#/lib/mui/MDButton'
import MDSnackbar from '#/lib/mui/MDSnackbar'

// ThreeD Garden examples components
import DashboardLayout from '#/lib/components/elements/LayoutContainers/DashboardLayout'
import DashboardNavbar from '#/lib/components/elements/Navbars/DashboardNavbar'
import Footer from '#/lib/components/elements/Footer'

function Notifications(): JSX.Element {
  const [successSB, setSuccessSB] = useState<boolean>(false)
  const [infoSB, setInfoSB] = useState<boolean>(false)
  const [warningSB, setWarningSB] = useState<boolean>(false)
  const [errorSB, setErrorSB] = useState<boolean>(false)

  const openSuccessSB = () => setSuccessSB(true)
  const closeSuccessSB = () => setSuccessSB(false)
  const openInfoSB = () => setInfoSB(true)
  const closeInfoSB = () => setInfoSB(false)
  const openWarningSB = () => setWarningSB(true)
  const closeWarningSB = () => setWarningSB(false)
  const openErrorSB = () => setErrorSB(true)
  const closeErrorSB = () => setErrorSB(false)

  const alertContent = (name: string) => (
    <MDTypography
      variant='body2'
      color='white'
    >
      A simple {name} alert with{' '}
      <MDTypography
        component='a'
        href='#'
        variant='body2'
        fontWeight='medium'
        color='white'
      >
        an example link
      </MDTypography>
      . Give it a click if you like.
    </MDTypography>
  )

  const renderSuccessSB = (
    <MDSnackbar
      color='success'
      icon='check'
      title='Company Juice Material UI'
      content='Hello, world! This is a notification message'
      dateTime='11 mins ago'
      open={successSB}
      onClose={closeSuccessSB}
      close={closeSuccessSB}
      bgWhite
    />
  )

  const renderInfoSB = (
    <MDSnackbar
      icon='notifications'
      title='Company Juice Material UI'
      content='Hello, world! This is a notification message'
      dateTime='11 mins ago'
      open={infoSB}
      onClose={closeInfoSB}
      close={closeInfoSB}
    />
  )

  const renderWarningSB = (
    <MDSnackbar
      color='warning'
      icon='star'
      title='Company Juice Material UI'
      content='Hello, world! This is a notification message'
      dateTime='11 mins ago'
      open={warningSB}
      onClose={closeWarningSB}
      close={closeWarningSB}
      bgWhite
    />
  )

  const renderErrorSB = (
    <MDSnackbar
      color='error'
      icon='warning'
      title='Company Juice Material UI'
      content='Hello, world! This is a notification message'
      dateTime='11 mins ago'
      open={errorSB}
      onClose={closeErrorSB}
      close={closeErrorSB}
      bgWhite
    />
  )

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox
        mt={6}
        mb={3}
      >
        <Grid
          container
          spacing={2}
          justifyContent='center'
        >
          <Grid
            item
            xs={12}
            lg={8}
          >
            <Card>
              <MDBox p={2}>
                <MDTypography variant='h5'>Alerts</MDTypography>
              </MDBox>
              <MDBox
                pt={2}
                px={2}
              >
                <MDAlert
                  color='primary'
                  dismissible
                >
                  {alertContent('primary')}
                </MDAlert>
                <MDAlert
                  color='secondary'
                  dismissible
                >
                  {alertContent('secondary')}
                </MDAlert>
                <MDAlert
                  color='success'
                  dismissible
                >
                  {alertContent('success')}
                </MDAlert>
                <MDAlert
                  color='error'
                  dismissible
                >
                  {alertContent('error')}
                </MDAlert>
                <MDAlert
                  color='warning'
                  dismissible
                >
                  {alertContent('warning')}
                </MDAlert>
                <MDAlert
                  color='info'
                  dismissible
                >
                  {alertContent('info')}
                </MDAlert>
                <MDAlert
                  color='light'
                  dismissible
                >
                  {alertContent('light')}
                </MDAlert>
                <MDAlert
                  color='dark'
                  dismissible
                >
                  {alertContent('dark')}
                </MDAlert>
              </MDBox>
            </Card>
          </Grid>

          <Grid
            item
            xs={12}
            lg={8}
          >
            <Card>
              <MDBox
                p={2}
                lineHeight={0}
              >
                <MDTypography variant='h5'>Notifications</MDTypography>
                <MDTypography
                  variant='button'
                  color='text'
                  fontWeight='regular'
                >
                  Notifications on this page use Toasts from Bootstrap. Read more details here.
                </MDTypography>
              </MDBox>
              <MDBox p={2}>
                <Grid
                  container
                  spacing={2}
                >
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    lg={3}
                  >
                    <MDButton
                      variant='gradient'
                      color='success'
                      onClick={openSuccessSB}
                      fullWidth
                    >
                      success notification
                    </MDButton>
                    {renderSuccessSB}
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    lg={3}
                  >
                    <MDButton
                      variant='gradient'
                      color='info'
                      onClick={openInfoSB}
                      fullWidth
                    >
                      info notification
                    </MDButton>
                    {renderInfoSB}
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    lg={3}
                  >
                    <MDButton
                      variant='gradient'
                      color='warning'
                      onClick={openWarningSB}
                      fullWidth
                    >
                      warning notification
                    </MDButton>
                    {renderWarningSB}
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    lg={3}
                  >
                    <MDButton
                      variant='gradient'
                      color='error'
                      onClick={openErrorSB}
                      fullWidth
                    >
                      error notification
                    </MDButton>
                    {renderErrorSB}
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  )
}

export default Notifications
