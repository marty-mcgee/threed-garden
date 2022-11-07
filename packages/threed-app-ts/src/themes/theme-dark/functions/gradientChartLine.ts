/**
  The gradientChartLine() function helps you to create a gradient color for the chart line
 */

// ThreeD Garden Helper Functions
import rgba from "~/themes/theme-light/functions/rgba"

function gradientChartLine(
  chart: any,
  color: string,
  opacity: number = 0.2
): any {
  const ctx = chart.getContext("2d")
  const gradientStroke = ctx.createLinearGradient(0, 230, 0, 50)
  const primaryColor = rgba(color, opacity).toString()

  gradientStroke.addColorStop(1, primaryColor)
  gradientStroke.addColorStop(0.2, "rgba(72, 72, 176, 0.0)")
  gradientStroke.addColorStop(0, "rgba(203, 12, 159, 0)")

  return gradientStroke
}

export default gradientChartLine
