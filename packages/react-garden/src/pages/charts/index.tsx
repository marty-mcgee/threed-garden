// @mui material components
import Grid from "@mui/material/Grid"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"

// ThreeD Garden examples components
import DashboardLayout from "~/components/elements/LayoutContainers/DashboardLayout"
import DashboardNavbar from "~/components/elements/Navbars/DashboardNavbar"
import Footer from "~/components/elements/Footer"
import DefaultLineChart from "~/components/elements/Charts/LineCharts/DefaultLineChart"
import GradientLineChart from "~/components/elements/Charts/LineCharts/GradientLineChart"
import VerticalBarChart from "~/components/elements/Charts/BarCharts/VerticalBarChart"
import HorizontalBarChart from "~/components/elements/Charts/BarCharts/HorizontalBarChart"
import MixedChart from "~/components/elements/Charts/MixedChart"
import BubbleChart from "~/components/elements/Charts/BubbleChart"
import DefaultDoughnutChart from "~/components/elements/Charts/DoughnutCharts/DefaultDoughnutChart"
import PieChart from "~/components/elements/Charts/PieChart"
import RadarChart from "~/components/elements/Charts/RadarChart"
import PolarChart from "~/components/elements/Charts/PolarChart"

// Data
import defaultLineChartData from "~/pages/charts/data/defaultLineChartData"
import gradientLineChartData from "~/pages/charts/data/gradientLineChartData"
import verticalBarChartData from "~/pages/charts/data/verticalBarChartData"
import horizontalBarChartData from "~/pages/charts/data/horizontalBarChartData"
import mixedChartData from "~/pages/charts/data/mixedChartData"
import bubbleChartData from "~/pages/charts/data/bubbleChartData"
import defaultDoughnutChartData from "~/pages/charts/data/defaultDoughnutChartData"
import pieChartData from "~/pages/charts/data/pieChartData"
import radarChartData from "~/pages/charts/data/radarChartData"
import polarChartData from "~/pages/charts/data/polarChartData"

function Charts(): JSX.Element {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox my={2} mr={1}>
        {/* <MDBox my={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} sx={{ lineHeight: 0 }}>
              <MDTypography variant="h5">Charts</MDTypography>
              <MDTypography variant="button" color="text">
                Charts on this page use Chart.js - Simple yet flexible
                JavaScript charting for designers + developers.
              </MDTypography>
            </Grid>
          </Grid>
        </MDBox> */}
        <MDBox mb={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <RadarChart
                icon={{ color: "warning", component: "data_saver_on" }}
                title="Radar Science Scores"
                description="Radar Chart"
                chart={radarChartData}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <PolarChart
                icon={{ color: "warning", component: "scatter_plot" }}
                title="Polar Bear Sightings"
                description="Polar Chart"
                chart={polarChartData}
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox my={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <DefaultLineChart
                icon={{ component: "insights" }}
                title="Project Insights"
                description="Line Chart"
                chart={defaultLineChartData}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <GradientLineChart
                icon={{ component: "show_chart" }}
                title="Visits per Device"
                description="Line Chart with Gradients"
                chart={gradientLineChartData}
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox my={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <VerticalBarChart
                icon={{ color: "dark", component: "leaderboard" }}
                title="Sales Related to Average Age"
                description="Bar Chart Vertical"
                chart={verticalBarChartData}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <HorizontalBarChart
                icon={{ color: "dark", component: "splitscreen" }}
                title="Sales Related to Average Age"
                description="Bar Chart Horizontal"
                chart={horizontalBarChartData}
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox my={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <MixedChart
                icon={{ color: "primary", component: "auto_graph" }}
                title="Analytics Insights"
                description="Mixed Chart"
                height="19.75rem"
                chart={mixedChartData}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <BubbleChart
                icon={{ color: "primary", component: "multiline_chart" }}
                title="Users by Region"
                description="Bubble Chart"
                height="19.75rem"
                chart={bubbleChartData}
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox my={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <DefaultDoughnutChart
                icon={{ color: "success", component: "donut_small" }}
                title="Affiliate Program"
                description="Doughnut Chart"
                chart={defaultDoughnutChartData}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <PieChart
                icon={{ color: "success", component: "donut_small" }}
                title="Membership Program"
                description="Pie Chart"
                chart={pieChartData}
              />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  )
}

export default Charts
