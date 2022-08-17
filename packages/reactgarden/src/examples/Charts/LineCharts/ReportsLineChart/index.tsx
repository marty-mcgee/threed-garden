import { useMemo, ReactNode } from "react"

// react-chartjs-2 components
import { Line } from "react-chartjs-2"

// @mui material components
import Card from "@mui/material/Card"
import Divider from "@mui/material/Divider"
import Icon from "@mui/material/Icon"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"

// ReportsLineChart configurations
import configs from "~/examples/Charts/LineCharts/ReportsLineChart/configs"

// Declaring props types for ReportsLineChart
interface Props {
  color?:
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "dark"
  title: string
  description?: string | ReactNode
  date: string
  chart: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
    }
  }
  [key: string]: any
}

function ReportsLineChart({
  color,
  title,
  description,
  date,
  chart,
}: Props): JSX.Element {
  const { data, options } = configs(chart.labels || [], chart.datasets || {})

  return (
    <Card sx={{ height: "100%" }}>
      <MDBox padding="1rem">
        {useMemo(
          () => (
            <MDBox
              variant="gradient"
              bgColor={color}
              borderRadius="lg"
              coloredShadow={color}
              py={2}
              pr={0.5}
              mt={-5}
              height="12.5rem">
              <Line data={data} options={options} />
            </MDBox>
          ),
          [chart, color]
        )}
        <MDBox pt={3} pb={1} px={1}>
          <MDTypography variant="h6" textTransform="capitalize">
            {title}
          </MDTypography>
          <MDTypography
            component="div"
            variant="button"
            color="text"
            fontWeight="light">
            {description}
          </MDTypography>
          <Divider />
          <MDBox display="flex" alignItems="center">
            <MDTypography
              variant="button"
              color="text"
              lineHeight={1}
              sx={{ mt: 0.15, mr: 0.5 }}>
              <Icon>schedule</Icon>
            </MDTypography>
            <MDTypography variant="button" color="text" fontWeight="light">
              {date}
            </MDTypography>
          </MDBox>
        </MDBox>
      </MDBox>
    </Card>
  )
}

// Declaring default props for ReportsLineChart
ReportsLineChart.defaultProps = {
  color: "dark",
  description: "",
}

export default ReportsLineChart
