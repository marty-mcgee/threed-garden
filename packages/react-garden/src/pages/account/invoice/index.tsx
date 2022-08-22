// @mui material components
import Grid from "@mui/material/Grid"
import Card from "@mui/material/Card"
import Table from "@mui/material/Table"
import TableRow from "@mui/material/TableRow"
import TableBody from "@mui/material/TableBody"
import { Theme } from "@mui/material/styles"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"
import MDButton from "~/components/mui/MDButton"

// Invoice page components
import BaseLayout from "~/pages/account/components/BaseLayout"

// Images
import logo from "~/assets/images/logos/logo-threedgarden.png"
import logoDark from "~/assets/images/logos/logo-threedgarden-text.png"

// ThreeD Garden context
import { useMaterialUIController } from "~/context"

function Invoice(): JSX.Element {
  const [controller] = useMaterialUIController()
  const { darkMode } = controller

  const borderBottom = {
    borderBottom: ({ borders: { borderWidth }, palette: { light } }: Theme) =>
      `${borderWidth[1]} solid ${light.main}`,
  }

  return (
    <BaseLayout stickyNavbar>
      <MDBox mt={{ xs: 4, md: 10 }} mb={{ xs: 4, md: 8 }}>
        <Grid container justifyContent="center">
          <Grid item xs={12} sm={10} md={8}>
            <Card>
              {/* Invoice header */}
              <MDBox p={3}>
                <Grid container justifyContent="space-between">
                  <Grid item xs={12} md={4}>
                    <MDBox
                      component="img"
                      src={darkMode ? logo : logoDark}
                      width="25%"
                      p={1}
                      mb={1}
                    />
                    <MDTypography variant="h6" fontWeight="medium">
                      St. Independence Embankment, 050105 Bucharest, Romania
                    </MDTypography>
                    <MDBox mt={1} mb={2}>
                      <MDTypography
                        display="block"
                        variant="body2"
                        color={darkMode ? "text" : "secondary"}>
                        tel: +4 (074) 1090873
                      </MDTypography>
                    </MDBox>
                  </Grid>
                  <Grid item xs={12} md={7} lg={3}>
                    <MDBox
                      width="100%"
                      textAlign={{ xs: "left", md: "right" }}
                      mt={6}>
                      <MDBox mt={1}>
                        <MDTypography variant="h6" fontWeight="medium">
                          Billed to: John Doe
                        </MDTypography>
                      </MDBox>
                      <MDBox mb={1}>
                        <MDTypography
                          variant="body2"
                          color={darkMode ? "text" : "secondary"}>
                          4006 Locust View Drive
                          <br />
                          San Francisco CA
                          <br />
                          California
                        </MDTypography>
                      </MDBox>
                    </MDBox>
                  </Grid>
                </Grid>
                <MDBox mt={{ xs: 5, md: 10 }}>
                  <Grid container justifyContent="space-between">
                    <Grid item xs={12} md={4}>
                      <MDTypography
                        variant="h6"
                        color={darkMode ? "text" : "secondary"}
                        fontWeight="regular">
                        Invoice no
                      </MDTypography>
                      <MDTypography variant="h5" fontWeight="medium">
                        #0453119
                      </MDTypography>
                    </Grid>
                    <Grid item xs={12} md={7} lg={5}>
                      <MDBox
                        width="100%"
                        display="flex"
                        flexDirection={{ xs: "column", md: "row" }}
                        alignItems={{ xs: "flex-start", md: "center" }}
                        textAlign={{ xs: "left", md: "right" }}
                        mt={{ xs: 3, md: 0 }}>
                        <MDBox width="50%">
                          <MDTypography
                            variant="h6"
                            color={darkMode ? "text" : "secondary"}
                            fontWeight="regular">
                            Invoice date:
                          </MDTypography>
                        </MDBox>
                        <MDBox width="50%">
                          <MDTypography variant="h6" fontWeight="medium">
                            06/03/2019
                          </MDTypography>
                        </MDBox>
                      </MDBox>
                      <MDBox
                        width="100%"
                        display="flex"
                        flexDirection={{ xs: "column", md: "row" }}
                        alignItems={{ xs: "flex-start", md: "center" }}
                        textAlign={{ xs: "left", md: "right" }}>
                        <MDBox width="50%">
                          <MDTypography
                            variant="h6"
                            color={darkMode ? "text" : "secondary"}
                            fontWeight="regular">
                            Due date:
                          </MDTypography>
                        </MDBox>
                        <MDBox width="50%">
                          <MDTypography variant="h6" fontWeight="medium">
                            11/03/2019
                          </MDTypography>
                        </MDBox>
                      </MDBox>
                    </Grid>
                  </Grid>
                </MDBox>
              </MDBox>

              {/* Invoice table */}
              <MDBox p={3}>
                <MDBox width="100%" overflow="auto">
                  <Table sx={{ minWidth: "32rem" }}>
                    <MDBox component="thead">
                      <TableRow>
                        <MDBox
                          component="th"
                          width={{ xs: "45%", md: "50%" }}
                          py={1.5}
                          px={1}
                          textAlign="left"
                          sx={borderBottom}>
                          <MDTypography
                            variant="h6"
                            color="text"
                            fontWeight="medium">
                            Item
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component="th"
                          py={1.5}
                          pl={3}
                          pr={1}
                          textAlign="left"
                          sx={borderBottom}>
                          <MDTypography
                            variant="h6"
                            color="text"
                            fontWeight="medium">
                            Qty
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component="th"
                          py={1.5}
                          pl={3}
                          pr={1}
                          textAlign="left"
                          sx={borderBottom}>
                          <MDTypography
                            variant="h6"
                            color="text"
                            fontWeight="medium">
                            Rate
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component="th"
                          py={1.5}
                          pl={3}
                          pr={1}
                          textAlign="left"
                          sx={borderBottom}>
                          <MDTypography
                            variant="h6"
                            color="text"
                            fontWeight="medium">
                            Amount
                          </MDTypography>
                        </MDBox>
                      </TableRow>
                    </MDBox>
                    <TableBody>
                      <TableRow>
                        <MDBox
                          component="td"
                          textAlign="left"
                          p={1}
                          sx={borderBottom}>
                          <MDTypography
                            variant="body2"
                            color="text"
                            fontWeight="regular">
                            Premium Support
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component="td"
                          textAlign="left"
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}>
                          <MDTypography
                            variant="body2"
                            color="text"
                            fontWeight="regular">
                            1
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component="td"
                          textAlign="left"
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}>
                          <MDTypography
                            variant="body2"
                            color="text"
                            fontWeight="regular">
                            $ 9.00
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component="td"
                          textAlign="left"
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}>
                          <MDTypography
                            variant="body2"
                            color="text"
                            fontWeight="regular">
                            $ 9.00
                          </MDTypography>
                        </MDBox>
                      </TableRow>
                      <TableRow>
                        <MDBox
                          component="td"
                          textAlign="left"
                          p={1}
                          sx={borderBottom}>
                          <MDTypography
                            variant="body2"
                            color="text"
                            fontWeight="regular">
                            Company Juice Material UI 2 PRO
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component="td"
                          textAlign="left"
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}>
                          <MDTypography
                            variant="body2"
                            color="text"
                            fontWeight="regular">
                            3
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component="td"
                          textAlign="left"
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}>
                          <MDTypography
                            variant="body2"
                            color="text"
                            fontWeight="regular">
                            $ 100.00
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component="td"
                          textAlign="left"
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}>
                          <MDTypography
                            variant="body2"
                            color="text"
                            fontWeight="regular">
                            $ 300.00
                          </MDTypography>
                        </MDBox>
                      </TableRow>
                      <TableRow>
                        <MDBox component="td" textAlign="left" p={1}>
                          <MDTypography
                            variant="body2"
                            color="text"
                            fontWeight="regular">
                            Parts for service
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component="td"
                          textAlign="left"
                          py={1}
                          pr={1}
                          pl={3}>
                          <MDTypography
                            variant="body2"
                            color="text"
                            fontWeight="regular">
                            1
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component="td"
                          textAlign="left"
                          py={1}
                          pr={1}
                          pl={3}>
                          <MDTypography
                            variant="body2"
                            color="text"
                            fontWeight="regular">
                            $ 89.00
                          </MDTypography>
                        </MDBox>
                        <MDBox
                          component="td"
                          textAlign="left"
                          py={1}
                          pr={1}
                          pl={3}>
                          <MDTypography
                            variant="body2"
                            color="text"
                            fontWeight="regular">
                            $ 89.00
                          </MDTypography>
                        </MDBox>
                      </TableRow>
                      <TableRow>
                        <MDBox
                          component="td"
                          textAlign="left"
                          p={1}
                          sx={borderBottom}
                        />
                        <MDBox
                          component="td"
                          textAlign="left"
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}
                        />
                        <MDBox
                          component="td"
                          textAlign="left"
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}>
                          <MDTypography variant="h5">Total</MDTypography>
                        </MDBox>
                        <MDBox
                          component="td"
                          textAlign="left"
                          py={1}
                          pr={1}
                          pl={3}
                          sx={borderBottom}>
                          <MDTypography variant="h5">$ 698</MDTypography>
                        </MDBox>
                      </TableRow>
                    </TableBody>
                  </Table>
                </MDBox>
              </MDBox>

              {/* Invoice footer */}
              <MDBox p={3} mt={7}>
                <Grid container>
                  <Grid item xs={12} lg={5}>
                    <MDTypography variant="h5" fontWeight="medium">
                      Thank you!
                    </MDTypography>
                    <MDBox mt={1} mb={2} lineHeight={0}>
                      <MDTypography
                        variant="button"
                        color={darkMode ? "text" : "secondary"}>
                        If you encounter any issues related to the invoice you
                        can contact us at:
                      </MDTypography>
                    </MDBox>
                    <MDTypography
                      component="span"
                      variant="h6"
                      fontWeight="regular"
                      color={darkMode ? "text" : "secondary"}>
                      email:{" "}
                      <MDTypography
                        component="span"
                        variant="h6"
                        fontWeight="regular">
                        support@companyjuice.com
                      </MDTypography>
                    </MDTypography>
                  </Grid>
                  <Grid item xs={12} lg={7}>
                    <MDBox
                      width="100%"
                      height={{ xs: "auto", md: "100%" }}
                      display="flex"
                      justifyContent={{ xs: "flex-start", md: "flex-end" }}
                      alignItems="flex-end"
                      mt={{ xs: 2, md: 0 }}>
                      <MDButton
                        variant="gradient"
                        color="info"
                        onClick={() => window.print()}>
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
    </BaseLayout>
  )
}

export default Invoice
