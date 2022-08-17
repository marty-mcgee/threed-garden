import { useState } from "react"

// @mui material components
import Grid from "@mui/material/Grid"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Tooltip from "@mui/material/Tooltip"
import Icon from "@mui/material/Icon"
import Card from "@mui/material/Card"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDBadgeDot from "~/components/mui/MDBadgeDot"
import MDButton from "~/components/mui/MDButton"
import MDTypography from "~/components/mui/MDTypography"

// ThreeD Garden examples components
import DashboardLayout from "~/components/elements/LayoutContainers/DashboardLayout"
import DashboardNavbar from "~/components/elements/Navbars/DashboardNavbar"
import Footer from "~/components/elements/Footer"
import DefaultStatisticsCard from "~/components/elements/Cards/StatisticsCards/DefaultStatisticsCard"
import DefaultLineChart from "~/components/elements/Charts/LineCharts/DefaultLineChart"
import HorizontalBarChart from "~/components/elements/Charts/BarCharts/HorizontalBarChart"
import SalesTable from "~/components/elements/Tables/SalesTable"
import DataTable from "~/components/elements/Tables/DataTable"

// Sales dashboard components
import ChannelsChart from "~/pages/dashboards/sales/components/ChannelsChart"

// Data
import defaultLineChartData from "~/pages/dashboards/sales/data/defaultLineChartData"
import horizontalBarChartData from "~/pages/dashboards/sales/data/horizontalBarChartData"
import salesTableData from "~/pages/dashboards/sales/data/salesTableData"
import dataTableData from "~/pages/dashboards/sales/data/dataTableData"

function Sales(): JSX.Element {
  // DefaultStatisticsCard state for the dropdown value
  const [salesDropdownValue, setSalesDropdownValue] =
    useState<string>("6 May - 7 May")
  const [customersDropdownValue, setCustomersDropdownValue] =
    useState<string>("6 May - 7 May")
  const [revenueDropdownValue, setRevenueDropdownValue] =
    useState<string>("6 May - 7 May")

  // DefaultStatisticsCard state for the dropdown action
  const [salesDropdown, setSalesDropdown] = useState<string | null>(null)
  const [customersDropdown, setCustomersDropdown] = useState<string | null>(
    null
  )
  const [revenueDropdown, setRevenueDropdown] = useState<string | null>(null)

  // DefaultStatisticsCard handler for the dropdown action
  const openSalesDropdown = ({ currentTarget }: any) =>
    setSalesDropdown(currentTarget)
  const closeSalesDropdown = ({ currentTarget }: any) => {
    setSalesDropdown(null)
    setSalesDropdownValue(currentTarget.innerText || salesDropdownValue)
  }
  const openCustomersDropdown = ({ currentTarget }: any) =>
    setCustomersDropdown(currentTarget)
  const closeCustomersDropdown = ({ currentTarget }: any) => {
    setCustomersDropdown(null)
    setCustomersDropdownValue(currentTarget.innerText || salesDropdownValue)
  }
  const openRevenueDropdown = ({ currentTarget }: any) =>
    setRevenueDropdown(currentTarget)
  const closeRevenueDropdown = ({ currentTarget }: any) => {
    setRevenueDropdown(null)
    setRevenueDropdownValue(currentTarget.innerText || salesDropdownValue)
  }

  // Dropdown menu template for the DefaultStatisticsCard
  const renderMenu = (state: any, close: any) => (
    <Menu
      anchorEl={state}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      open={Boolean(state)}
      onClose={close}
      keepMounted
      disableAutoFocusItem>
      <MenuItem onClick={close}>Last 7 days</MenuItem>
      <MenuItem onClick={close}>Last week</MenuItem>
      <MenuItem onClick={close}>Last 30 days</MenuItem>
    </Menu>
  )

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <DefaultStatisticsCard
                title="sales"
                count="$230,220"
                percentage={{
                  color: "success",
                  value: "+55%",
                  label: "since last month",
                }}
                dropdown={{
                  action: openSalesDropdown,
                  menu: renderMenu(salesDropdown, closeSalesDropdown),
                  value: salesDropdownValue,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DefaultStatisticsCard
                title="customers"
                count="3.200"
                percentage={{
                  color: "success",
                  value: "+12%",
                  label: "since last month",
                }}
                dropdown={{
                  action: openCustomersDropdown,
                  menu: renderMenu(customersDropdown, closeCustomersDropdown),
                  value: customersDropdownValue,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DefaultStatisticsCard
                title="avg. revenue"
                count="$1.200"
                percentage={{
                  color: "secondary",
                  value: "+$213",
                  label: "since last month",
                }}
                dropdown={{
                  action: openRevenueDropdown,
                  menu: renderMenu(revenueDropdown, closeRevenueDropdown),
                  value: revenueDropdownValue,
                }}
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} lg={4}>
              <ChannelsChart />
            </Grid>
            <Grid item xs={12} sm={6} lg={8}>
              <DefaultLineChart
                title="Revenue"
                description={
                  <MDBox display="flex" justifyContent="space-between">
                    <MDBox display="flex" ml={-1}>
                      <MDBadgeDot
                        color="info"
                        size="sm"
                        badgeContent="Facebook Ads"
                      />
                      <MDBadgeDot
                        color="dark"
                        size="sm"
                        badgeContent="Google Ads"
                      />
                    </MDBox>
                    <MDBox mt={-4} mr={-1} position="absolute" right="1.5rem">
                      <Tooltip
                        title="See which ads perform better"
                        placement="left"
                        arrow>
                        <MDButton
                          variant="outlined"
                          color="secondary"
                          size="small"
                          circular
                          iconOnly>
                          <Icon>priority_high</Icon>
                        </MDButton>
                      </Tooltip>
                    </MDBox>
                  </MDBox>
                }
                chart={defaultLineChartData}
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <HorizontalBarChart
                title="Sales by age"
                chart={horizontalBarChartData}
              />
            </Grid>
            <Grid item xs={12} lg={4}>
              <SalesTable title="Sales by Country" rows={salesTableData} />
            </Grid>
          </Grid>
        </MDBox>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox pt={3} px={3}>
                <MDTypography variant="h6" fontWeight="medium">
                  Top Selling Products
                </MDTypography>
              </MDBox>
              <MDBox py={1}>
                <DataTable
                  table={dataTableData}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  )
}

export default Sales
