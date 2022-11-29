// @mui material components
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import { Theme } from '@mui/material/styles'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'
import MDButton from '#/lib/mui/MDButton'

// Invoice page components
// import BaseLayout from "~/pages/account/components/BaseLayout"
import DashboardLayout from '#/ui/elements/LayoutContainers/DashboardLayout'
import DashboardNavbar from '#/ui/elements/Navbars/DashboardNavbar'

// ThreeD Garden context
import { useMaterialUIController } from '~/app/context'

// Images
import logo from '#/lib/assets/images/logos/logo-threedgarden-text.png'
import logoDark from '#/lib/assets/images/logos/logo-threedgarden.png'

function Invoice(): JSX.Element {
  const [controller] = useMaterialUIController()
  const { darkMode } = controller

  const borderBottom = {
    borderBottom: ({ borders: { borderWidth }, palette: { light } }: Theme) => `${borderWidth[1]} solid ${light.main}`,
  }

  return (
    <DashboardLayout stickyNavbar>
      <DashboardNavbar />
      <MDBox
        mt={{ xs: 0, md: 0 }}
        mb={{ xs: 4, md: 8 }}
      >
        <Grid
          container
          justifyContent='center'
        >
          <Grid
            item
            xs={12}
            sm={11}
            md={10}
          >
            <Card>
              {/* Invoice Header */}
              <MDBox p={3}>
                <Grid
                  container
                  justifyContent='space-between'
                >
                  <Grid
                    item
                    xs={12}
                    md={4}
                  >
                    <MDBox
                      component='img'
                      src={darkMode ? logo.src : logoDark.src}
                      width='25%'
                      p={1}
                      mb={0}
                    />
                    <MDTypography
                      variant='h6'
                      fontWeight='medium'
                    >
                      ThreeD Garden
                      <br />
                      Fort Bragg, California 95437
                      <br />
                      United States
                    </MDTypography>
                    <MDBox
                      mt={1}
                      mb={2}
                    >
                      <MDTypography
                        display='block'
                        variant='body2'
                        color={darkMode ? 'text' : 'secondary'}
                      >
                        tel: +1 707-980-1136
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    md={7}
                    lg={4}
                  >
                    <MDBox
                      width='100%'
                      textAlign={{ xs: 'left', md: 'right' }}
                      mt={6}
                    >
                      <MDBox mt={1}>
                        <MDTypography
                          variant='h6'
                          fontWeight='medium'
                        >
                          Billed to: Marty McGee
                        </MDTypography>
                      </MDBox>
                      <MDBox mb={1}>
                        <MDTypography
                          variant='body2'
                          color={darkMode ? 'text' : 'secondary'}
                        >
                          4006 Locust View Drive
                          <br />
                          San Francisco, CA 94105
                          <br />
                          United States
                        </MDTypography>
                      </MDBox>
                    </MDBox>
                  </Grid>
                </Grid>
                <MDBox mt={{ xs: 5, md: 6 }}>
                  <Grid
                    container
                    justifyContent='space-between'
                  >
                    <Grid
                      item
                      xs={12}
                      md={4}
                    >
                      <MDTypography
                        variant='h6'
                        color={darkMode ? 'text' : 'secondary'}
                        fontWeight='regular'
                      >
                        Invoice #
                      </MDTypography>
                      <MDTypography
                        variant='h5'
                        fontWeight='medium'
                      >
                        #10453119
                      </MDTypography>
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      md={7}
                      lg={5}
                    >
                      <MDBox
                        width='100%'
                        display='flex'
                        flexDirection={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        textAlign={{ xs: 'left', md: 'right' }}
                        mt={{ xs: 3, md: 0 }}
                      >
                        <MDBox width='50%'>
                          <MDTypography
                            variant='h6'
                            color={darkMode ? 'text' : 'secondary'}
                            fontWeight='regular'
                          >
                            Invoice Date:
                          </MDTypography>
                        </MDBox>
                        <MDBox width='50%'>
                          <MDTypography
                            variant='h6'
                            fontWeight='medium'
                          >
                            2022-03-07
                          </MDTypography>
                        </MDBox>
                      </MDBox>
                      <MDBox
                        width='100%'
                        display='flex'
                        flexDirection={{ xs: 'column', md: 'row' }}
                        alignItems={{ xs: 'flex-start', md: 'center' }}
                        textAlign={{ xs: 'left', md: 'right' }}
                      >
                        <MDBox width='50%'>
                          <MDTypography
                            variant='h6'
                            color={darkMode ? 'text' : 'secondary'}
                            fontWeight='regular'
                          >
                            Due Date:
                          </MDTypography>
                        </MDBox>
                        <MDBox width='50%'>
                          <MDTypography
                            variant='h6'
                            fontWeight='medium'
                          >
                            2022-03-11
                          </MDTypography>
                        </MDBox>
                      </MDBox>
                    </Grid>
                  </Grid>
                </MDBox>
              </MDBox>

              {/* Invoice table */}
              <MDBox p={3}>
                <MDBox
                  width='100%'
                  overflow='auto'
                >
                  <Table sx={{ minWidth: '32rem' }}>
                    <MDBox component='thead'>
                      <TableRow>
                        <MDBox
                          component='th'
                          width={{ xs: '45%', md: '50%' }}
                          py={1.5}
                          px={1}
                          textAlign='left'
                          sx={borderBottom}
                        >
                          <MDTypography
                            variant='h6'
                            color='text'
                            fontWeight='medium'
                          >
                            Item
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component='th'
                          py={1.5}
                          pl={3}
                          pr={1}
                          textAlign='left'
                          sx={borderBottom}
                        >
                          <MDTypography
                            variant='h6'
                            color='text'
                            fontWeight='medium'
                          >
                            Qty
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component='th'
                          py={1.5}
                          pl={3}
                          pr={1}
                          textAlign='right'
                          sx={borderBottom}
                        >
                          <MDTypography
                            variant='h6'
                            color='text'
                            fontWeight='medium'
                          >
                            Rate
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component='th'
                          py={1.5}
                          pl={3}
                          pr={1}
                          textAlign='right'
                          sx={borderBottom}
                        >
                          <MDTypography
                            variant='h6'
                            color='text'
                            fontWeight='medium'
                          >
                            Amount
                          </MDTypography>
                        </MDBox>
                      </TableRow>
                    </MDBox>
                    <TableBody>
                      <TableRow>
                        <MDBox
                          component='td'
                          textAlign='left'
                          p={1}
                          sx={borderBottom}
                        >
                          <MDTypography
                            variant='body2'
                            color='text'
                            fontWeight='regular'
                          >
                            Premium Support
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component='td'
                          textAlign='left'
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}
                        >
                          <MDTypography
                            variant='body2'
                            color='text'
                            fontWeight='regular'
                          >
                            1
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component='td'
                          textAlign='right'
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}
                        >
                          <MDTypography
                            variant='body2'
                            color='text'
                            fontWeight='regular'
                          >
                            $ 9.00
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component='td'
                          textAlign='right'
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}
                        >
                          <MDTypography
                            variant='body2'
                            color='text'
                            fontWeight='regular'
                          >
                            $ 9.00
                          </MDTypography>
                        </MDBox>
                      </TableRow>
                      <TableRow>
                        <MDBox
                          component='td'
                          textAlign='left'
                          p={1}
                          sx={borderBottom}
                        >
                          <MDTypography
                            variant='body2'
                            color='text'
                            fontWeight='regular'
                          >
                            Company Juice Material UI 2 PRO
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component='td'
                          textAlign='left'
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}
                        >
                          <MDTypography
                            variant='body2'
                            color='text'
                            fontWeight='regular'
                          >
                            3
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component='td'
                          textAlign='right'
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}
                        >
                          <MDTypography
                            variant='body2'
                            color='text'
                            fontWeight='regular'
                          >
                            $ 100.00
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component='td'
                          textAlign='right'
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}
                        >
                          <MDTypography
                            variant='body2'
                            color='text'
                            fontWeight='regular'
                          >
                            $ 300.00
                          </MDTypography>
                        </MDBox>
                      </TableRow>
                      <TableRow>
                        <MDBox
                          component='td'
                          textAlign='left'
                          p={1}
                        >
                          <MDTypography
                            variant='body2'
                            color='text'
                            fontWeight='regular'
                          >
                            3rd Party Software
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component='td'
                          textAlign='left'
                          py={1}
                          pr={1}
                          pl={3}
                        >
                          <MDTypography
                            variant='body2'
                            color='text'
                            fontWeight='regular'
                          >
                            1
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component='td'
                          textAlign='right'
                          py={1}
                          pr={1}
                          pl={3}
                        >
                          <MDTypography
                            variant='body2'
                            color='text'
                            fontWeight='regular'
                          >
                            $ 89.00
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component='td'
                          textAlign='right'
                          py={1}
                          pr={1}
                          pl={3}
                        >
                          <MDTypography
                            variant='body2'
                            color='text'
                            fontWeight='regular'
                          >
                            $ 89.00
                          </MDTypography>
                        </MDBox>
                      </TableRow>
                      <TableRow>
                        <MDBox
                          component='td'
                          textAlign='left'
                          p={1}
                          sx={borderBottom}
                        />
                        <MDBox
                          component='td'
                          textAlign='left'
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}
                        />
                        <MDBox
                          component='td'
                          textAlign='right'
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}
                        >
                          <MDTypography variant='h5'>Total</MDTypography>
                        </MDBox>
                        <MDBox
                          component='td'
                          textAlign='right'
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}
                        >
                          <MDTypography variant='h5'>$ 398</MDTypography>
                        </MDBox>
                      </TableRow>
                    </TableBody>
                  </Table>
                </MDBox>
              </MDBox>

              {/* Invoice footer */}
              <MDBox
                p={3}
                mt={2}
              >
                <Grid container>
                  <Grid
                    item
                    xs={12}
                    lg={5}
                  >
                    <MDTypography
                      variant='h5'
                      fontWeight='medium'
                    >
                      Thank you!
                    </MDTypography>
                    <MDBox
                      mt={1}
                      mb={2}
                      lineHeight={0}
                    >
                      <MDTypography
                        variant='button'
                        color={darkMode ? 'text' : 'secondary'}
                      >
                        If you encounter any issues related to the invoice, you can contact us at:
                      </MDTypography>
                    </MDBox>
                    <MDTypography
                      component='span'
                      variant='h6'
                      fontWeight='regular'
                      color={darkMode ? 'text' : 'secondary'}
                    >
                      email:{' '}
                      <MDTypography
                        component='span'
                        variant='h6'
                        fontWeight='regular'
                      >
                        support@companyjuice.com
                      </MDTypography>
                    </MDTypography>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    lg={7}
                  >
                    <MDBox
                      width='100%'
                      height={{ xs: 'auto', md: '100%' }}
                      display='flex'
                      justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
                      alignItems='flex-end'
                      mt={{ xs: 2, md: 0 }}
                    >
                      <MDButton
                        variant='gradient'
                        color='info'
                        onClick={() => window.print()}
                      >
                        print
                      </MDButton>
                    </MDBox>
                  </Grid>
                </Grid>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  )
}

export default Invoice
