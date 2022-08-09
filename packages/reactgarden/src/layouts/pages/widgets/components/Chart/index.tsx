import { useRef, useEffect, useState, useMemo, ReactNode } from "react"

// react-chartjs-2 components
import { Line } from "react-chartjs-2"

// @mui material components
import Card from "@mui/material/Card"

// Company Juice Dashboard components
import MDBox from "components/MDBox"
import MDTypography from "components/MDTypography"

// Company Juice Dashboard Helper Functions
import gradientChartLine from "assets/theme/functions/gradientChartLine"

// Chart configurations
import configs from "layouts/pages/widgets/components/Chart/configs"

// Company Juice Dashboard Base Styles
import colors from "assets/theme/base/colors"

// Declaring props types for Chart
interface Props {
  title: string
  count: number | ReactNode
  percentage: {
    color: "primary" | "secondary" | "info" | "success" | "warning" | "error" | "dark"
    label: string | ReactNode
  }
  chart: {
    labels: string[]
    datasets: {
      label: string
      color: "primary" | "secondary" | "info" | "success" | "warning" | "error" | "light" | "dark"
      data: number[]
    }[]
  }
}

function Chart({ title, count, percentage, chart }: Props): JSX.Element {
  const chartRef = useRef(null)
  const [chartData, setChartData] = useState({})
  const { data, options }: any = chartData

  useEffect(() => {
    const chartDatasets = chart.datasets.map((dataset) => ({
      ...dataset,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
      borderColor: colors[dataset.color].main,
      fill: true,
      maxBarThickness: 6,
      backgroundColor: gradientChartLine(
        chartRef.current.children[0],
        colors[dataset.color].main,
        0.02
      ),
    }))

    setChartData(configs(chart.labels, chartDatasets))
  }, [chart])

  return (
    <Card>
      <MDBox p={2} lineHeight={1}>
        <MDTypography variant="button" textTransform="capitalize" fontWeight="medium" color="text">
          {title}
        </MDTypography>
        <MDTypography variant="h5" fontWeight="bold" color="dark">
          {count}&nbsp;
          <MDTypography variant="button" fontWeight="bold" color={percentage.color}>
            {percentage.label}
          </MDTypography>
        </MDTypography>
      </MDBox>
      {useMemo(
        () => (
          <MDBox ref={chartRef} sx={{ height: "5.375rem" }}>
            <Line data={data} options={options} />
          </MDBox>
        ),
        [chartData]
      )}
    </Card>
  )
}

export default Chart
