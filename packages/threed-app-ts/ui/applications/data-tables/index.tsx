// @mui material components
import Card from '@mui/material/Card'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// ThreeD Garden examples components
import DashboardLayout from '#/lib/components/elements/LayoutContainers/DashboardLayout'
import DashboardNavbar from '#/lib/components/elements/Navbars/DashboardNavbar'
import Footer from '#/lib/components/elements/Footer'
import DataTable from '#/lib/components/elements/Tables/DataTable'

// Data
import dataTableData from '#/lib/components/applications/data-tables/data/dataTableData'

function DataTables(): JSX.Element {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox
        pt={6}
        pb={3}
      >
        <MDBox mb={3}>
          <Card>
            <MDBox
              p={3}
              lineHeight={1}
            >
              <MDTypography
                variant='h5'
                fontWeight='medium'
              >
                Datatable Simple
              </MDTypography>
              <MDTypography
                variant='button'
                color='text'
              >
                A lightweight, extendable, dependency-free javascript HTML table plugin.
              </MDTypography>
            </MDBox>
            <DataTable table={dataTableData} />
          </Card>
        </MDBox>
        <Card>
          <MDBox
            p={3}
            lineHeight={1}
          >
            <MDTypography
              variant='h5'
              fontWeight='medium'
            >
              Datatable Search
            </MDTypography>
            <MDTypography
              variant='button'
              color='text'
            >
              A lightweight, extendable, dependency-free javascript HTML table plugin.
            </MDTypography>
          </MDBox>
          <DataTable
            table={dataTableData}
            canSearch
          />
        </Card>
      </MDBox>
      <Footer />
    </DashboardLayout>
  )
}

export default DataTables
