import { useMemo, ReactNode } from "react"

// @mui material components
import Card from "@mui/material/Card"
import Icon from "@mui/material/Icon"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"

// RadarChart configurations
import configs from "~/components/elements/Charts/RadarChart/configs"

// ThreeD Garden Base Styles
import colors from "~/themes/theme-light/base/colors"

// ThreeD Garden Helper Functions
import rgba from "~/themes/theme-light/functions/rgba"

// react-chartjs-2 components
import { Radar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
} from "chart.js"

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
)

// Declaring props types for RadarChart
interface Props {
  icon?: {
    color?:
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "light"
    | "dark"
    component: ReactNode
  }
  title?: string
  description?: string | ReactNode
  chart: {
    labels: string[]
    datasets: {
      label: string
      color:
      | "primary"
      | "secondary"
      | "info"
      | "success"
      | "warning"
      | "error"
      | "light"
      | "dark"
      data: number[]
      borderDash?: number[]
    }[]
  }
  [key: string]: any
}

function RadarChart({ icon, title, description, chart }: Props): JSX.Element {
  const chartDatasets = chart.datasets
    ? chart.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: colors[dataset.color]
        ? rgba(colors[dataset.color || "dark"].main, 0.2)
        : rgba(colors.dark.main, 0.2),
    }))
    : []

  const { data, options } = configs(chart.labels || [], chartDatasets)

  const renderChart = (
    <MDBox py={2} pr={2} pl={icon.component ? 1 : 2}>
      {title || description ? (
        <MDBox display="flex" px={description ? 1 : 0} pt={description ? 1 : 0}>
          {icon.component && (
            <MDBox
              width="4rem"
              height="4rem"
              bgColor={icon.color || "info"}
              variant="gradient"
              coloredShadow={icon.color || "info"}
              borderRadius="xl"
              display="flex"
              justifyContent="center"
              alignItems="center"
              color="white"
              mt={-5}
              mr={2}>
              <Icon fontSize="medium">{icon.component}</Icon>
            </MDBox>
          )}
          <MDBox mt={icon.component ? -2 : 0}>
            {title && <MDTypography variant="h6">{title}</MDTypography>}
            <MDBox mb={2}>
              <MDTypography component="div" variant="button" color="text">
                {description}
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      ) : null}
      {useMemo(
        () => (
          <MDBox p={6}>
            <Radar data={data} options={options} />
          </MDBox>
        ),
        [chart]
      )}
    </MDBox>
  )

  return title || description ? <Card>{renderChart}</Card> : renderChart
}

// Declaring default props for RadarChart
RadarChart.defaultProps = {
  icon: { color: "info", component: "" },
  title: "",
  description: "",
}

export default RadarChart
