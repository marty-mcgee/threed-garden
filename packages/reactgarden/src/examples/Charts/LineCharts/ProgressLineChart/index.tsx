import { useMemo, ReactNode } from "react"

// react-chartjs-2 components
import { Line } from "react-chartjs-2"

// @mui material components
import Card from "@mui/material/Card"
import Icon from "@mui/material/Icon"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"
import MDProgress from "components/MDProgress"

// ProgressLineChart configurations
import configs from "examples/Charts/LineCharts/ProgressLineChart/config"

// Declaring props types for GradientLineChart
interface Props {
  color?:
    | "primary"
    | "secondary"
    | "info"
    | "success"
    | "warning"
    | "error"
    | "dark"
  icon: ReactNode
  title: string
  count?: string | number
  progress: number
  height?: string | number
  chart: {
    labels: string[]
    data: number[]
  }
  [key: string]: any
}

function ProgressLineChart({
  color,
  icon,
  title,
  count,
  progress,
  height,
  chart,
}: Props): JSX.Element {
  const { data, options } = configs(
    color,
    chart.labels || [],
    title,
    chart.data || []
  )

  return (
    <Card>
      <MDBox display="flex" alignItems="center" pt={2} px={2}>
        <MDBox
          width="3rem"
          height="3rem"
          display="grid"
          justifyContent="center"
          alignItems="center"
          borderRadius="md"
          shadow="md"
          color="white"
          bgColor={color}
          variant="gradient">
          <Icon>{icon}</Icon>
        </MDBox>
        <MDBox ml={2} lineHeight={1}>
          <MDTypography
            variant="button"
            fontWeight="regular"
            textTransform="capitalize"
            color="text">
            {title}
          </MDTypography>
          {count ? (
            <MDTypography variant="h5" fontWeight="bold">
              {count}
            </MDTypography>
          ) : null}
        </MDBox>
        <MDBox width="25%" ml="auto">
          <MDTypography
            display="block"
            variant="caption"
            fontWeight="medium"
            color="text">
            {progress}%
          </MDTypography>
          <MDBox mt={0.25}>
            <MDProgress variant="gradient" color={color} value={progress} />
          </MDBox>
        </MDBox>
      </MDBox>
      {useMemo(
        () => (
          <MDBox mt={2}>
            <Line data={data} options={options} style={{ height }} />
          </MDBox>
        ),
        [chart, height, color]
      )}
    </Card>
  )
}

// Declaring default props for ProgressLineChart
ProgressLineChart.defaultProps = {
  color: "info",
  count: 0,
  height: "6.25rem",
}

export default ProgressLineChart
