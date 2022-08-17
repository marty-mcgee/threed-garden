// @mui material components
import Card from "@mui/material/Card"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"

// ThreeD Garden examples components
import DashboardLayout from "~/components/examples/LayoutContainers/DashboardLayout"
import DashboardNavbar from "~/components/examples/Navbars/DashboardNavbar"
import Footer from "~/components/examples/Footer"
import DataTable from "~/components/examples/Tables/DataTable"

// Data
import dataTableData from "~/pages/layouts/applications/data-tables/data/dataTableData"

function DataTables(): JSX.Element {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <MDBox mb={3}>
          <Card>
            <MDBox p={3} lineHeight={1}>
              <MDTypography variant="h5" fontWeight="medium">
                Datatable Simple
              </MDTypography>
              <MDTypography variant="button" color="text">
                A lightweight, extendable, dependency-free javascript HTML table
                plugin.
              </MDTypography>
            </MDBox>
            <DataTable table={dataTableData} />
          </Card>
        </MDBox>
        <Card>
          <MDBox p={3} lineHeight={1}>
            <MDTypography variant="h5" fontWeight="medium">
              Datatable Search
            </MDTypography>
            <MDTypography variant="button" color="text">
              A lightweight, extendable, dependency-free javascript HTML table
              plugin.
            </MDTypography>
          </MDBox>
          <DataTable table={dataTableData} canSearch />
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  )
}

export default DataTables
