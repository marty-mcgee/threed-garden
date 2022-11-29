// @mui material components
import Grid from '@mui/material/Grid'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'

// ThreeD Garden examples components
import DashboardLayout from '#/ui/elements/LayoutContainers/DashboardLayout'
import DashboardNavbar from '#/ui/elements/Navbars/DashboardNavbar'
import Footer from '#/ui/elements/Footer'
import DefaultLineChart from '#/ui/elements/Charts/LineCharts/DefaultLineChart'
import GradientLineChart from '#/ui/elements/Charts/LineCharts/GradientLineChart'
import VerticalBarChart from '#/ui/elements/Charts/BarCharts/VerticalBarChart'
import HorizontalBarChart from '#/ui/elements/Charts/BarCharts/HorizontalBarChart'
import MixedChart from '#/ui/elements/Charts/MixedChart'
import BubbleChart from '#/ui/elements/Charts/BubbleChart'
import DefaultDoughnutChart from '#/ui/elements/Charts/DoughnutCharts/DefaultDoughnutChart'
import PieChart from '#/ui/elements/Charts/PieChart'
import RadarChart from '#/ui/elements/Charts/RadarChart'
import PolarChart from '#/ui/elements/Charts/PolarChart'

// Data
import defaultLineChartData from 'api/@fake-db/pages/charts/data/defaultLineChartData'
import gradientLineChartData from 'api/@fake-db/pages/charts/data/gradientLineChartData'
import verticalBarChartData from 'api/@fake-db/pages/charts/data/verticalBarChartData'
import horizontalBarChartData from 'api/@fake-db/pages/charts/data/horizontalBarChartData'
import mixedChartData from 'api/@fake-db/pages/charts/data/mixedChartData'
import bubbleChartData from 'api/@fake-db/pages/charts/data/bubbleChartData'
import defaultDoughnutChartData from 'api/@fake-db/pages/charts/data/defaultDoughnutChartData'
import pieChartData from 'api/@fake-db/pages/charts/data/pieChartData'
import radarChartData from 'api/@fake-db/pages/charts/data/radarChartData'
import polarChartData from 'api/@fake-db/pages/charts/data/polarChartData'

function Charts(): JSX.Element {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox
        my={2}
        mx={1}
      >
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
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <RadarChart
                icon={{ color: 'warning', component: 'data_saver_on' }}
                title='Radar Science Scores'
                description='Radar Chart'
                chart={radarChartData}
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
            >
              <PolarChart
                icon={{ color: 'warning', component: 'scatter_plot' }}
                title='Polar Bear Sightings'
                description='Polar Chart'
                chart={polarChartData}
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox my={3}>
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <DefaultLineChart
                icon={{ component: 'insights' }}
                title='Project Insights'
                description='Line Chart'
                chart={defaultLineChartData}
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
            >
              <GradientLineChart
                icon={{ component: 'show_chart' }}
                title='Visits per Device'
                description='Line Chart with Gradients'
                chart={gradientLineChartData}
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox my={3}>
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <VerticalBarChart
                icon={{ color: 'dark', component: 'leaderboard' }}
                title='Sales Related to Average Age'
                description='Bar Chart Vertical'
                chart={verticalBarChartData}
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
            >
              <HorizontalBarChart
                icon={{ color: 'dark', component: 'splitscreen' }}
                title='Sales Related to Average Age'
                description='Bar Chart Horizontal'
                chart={horizontalBarChartData}
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox my={3}>
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <MixedChart
                icon={{ color: 'primary', component: 'auto_graph' }}
                title='Analytics Insights'
                description='Mixed Chart'
                height='19.75rem'
                chart={mixedChartData}
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
            >
              <BubbleChart
                icon={{ color: 'primary', component: 'multiline_chart' }}
                title='Users by Region'
                description='Bubble Chart'
                height='19.75rem'
                chart={bubbleChartData}
              />
            </Grid>
          </Grid>
        </MDBox>
        <MDBox my={3}>
          <Grid
            container
            spacing={2}
          >
            <Grid
              item
              xs={12}
              md={6}
            >
              <DefaultDoughnutChart
                icon={{ color: 'success', component: 'donut_small' }}
                title='Affiliate Program'
                description='Doughnut Chart'
                chart={defaultDoughnutChartData}
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
            >
              <PieChart
                icon={{ color: 'success', component: 'donut_small' }}
                title='Membership Program'
                description='Pie Chart'
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
