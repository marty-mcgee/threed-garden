import { useMemo, ReactNode } from "react"

// react-chartjs-2 components
import { PolarArea } from "react-chartjs-2"

// @mui material components
import Card from "@mui/material/Card"
import Icon from "@mui/material/Icon"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"

// PolarChart configurations
import configs from "examples/Charts/PolarChart/configs"

// Declaring props types for PolarChart
interface Props {
  icon?: {
    color?: "primary" | "secondary" | "info" | "success" | "warning" | "error" | "light" | "dark"
    component: ReactNode
  }
  title?: string
  description?: string | ReactNode
  chart: {
    labels: string[]
    datasets: {
      label: string
      backgroundColors: string[]
      data: number[]
    }
  }
  [key: string]: any
}

function PolarChart({ icon, title, description, chart }: Props): JSX.Element {
  const { data, options } = configs(chart.labels || [], chart.datasets || {})

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
              mr={2}
            >
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
          <MDBox p={4}>
            <PolarArea data={data} options={options} />
          </MDBox>
        ),
        [chart]
      )}
    </MDBox>
  )

  return title || description ? <Card>{renderChart}</Card> : renderChart
}

// Declaring default props for PolarChart
PolarChart.defaultProps = {
  icon: { color: "info", component: "" },
  title: "",
  description: "",
}

export default PolarChart
