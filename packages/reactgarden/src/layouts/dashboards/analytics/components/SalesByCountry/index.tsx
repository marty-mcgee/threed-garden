// @react-jvectormap components
import { VectorMap } from "@react-jvectormap/core"
import { worldMerc } from "@react-jvectormap/world"

// @mui material components
import Card from "@mui/material/Card"
import Grid from "@mui/material/Grid"
import Icon from "@mui/material/Icon"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"

// Company Juice Dashboard examples components
import SalesTable from "examples/Tables/SalesTable"

// Data
import salesTableData from "layouts/dashboards/analytics/components/SalesByCountry/data/salesTableData"

function SalesByCountry(): JSX.Element {
  return (
    <Card sx={{ width: "100%" }}>
      <MDBox display="flex">
        <MDBox
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="4rem"
          height="4rem"
          variant="gradient"
          bgColor="success"
          color="white"
          shadow="md"
          borderRadius="xl"
          ml={3}
          mt={-2}
        >
          <Icon fontSize="medium" color="inherit">
            language
          </Icon>
        </MDBox>
        <MDTypography variant="h6" sx={{ mt: 2, mb: 1, ml: 2 }}>
          Sales by Country
        </MDTypography>
      </MDBox>
      <MDBox p={2}>
        <Grid container>
          <Grid item xs={12} md={7} lg={6}>
            <SalesTable rows={salesTableData} shadow={false} />
          </Grid>
          <Grid item xs={12} md={5} lg={6} sx={{ mt: { xs: 5, lg: 0 } }}>
            <VectorMap
              map={worldMerc}
              zoomOnScroll={false}
              zoomButtons={false}
              markersSelectable
              backgroundColor="transparent"
              selectedMarkers={["1", "3"]}
              markers={[
                {
                  name: "USA",
                  latLng: [40.71296415909766, -74.00437720027804],
                },
                {
                  name: "Germany",
                  latLng: [51.17661451970939, 10.97947735117339],
                },
                {
                  name: "Brazil",
                  latLng: [-7.596735421549542, -54.781694323779185],
                },
                {
                  name: "Russia",
                  latLng: [62.318222797104276, 89.81564777631716],
                },
                {
                  name: "China",
                  latLng: [22.320178999475512, 114.17161225541399],
                },
              ]}
              regionStyle={{
                initial: {
                  fill: "#dee2e7",
                  "fill-opacity": 1,
                  stroke: "none",
                  "stroke-width": 0,
                  "stroke-opacity": 0,
                },
              }}
              markerStyle={{
                initial: {
                  fill: "#e91e63",
                  stroke: "#ffffff",
                  "stroke-width": 5,
                  "stroke-opacity": 0.5,
                  r: 7,
                },
                hover: {
                  fill: "E91E63",
                  stroke: "#ffffff",
                  "stroke-width": 5,
                  "stroke-opacity": 0.5,
                },
                selected: {
                  fill: "E91E63",
                  stroke: "#ffffff",
                  "stroke-width": 5,
                  "stroke-opacity": 0.5,
                },
              }}
              style={{
                marginTop: "-1.5rem",
              }}
              onRegionTipShow={() => false}
              onMarkerTipShow={() => false}
            />
          </Grid>
        </Grid>
      </MDBox>
    </Card>
  )
}

export default SalesByCountry
