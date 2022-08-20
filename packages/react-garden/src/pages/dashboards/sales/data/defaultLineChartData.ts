// types
interface Types {
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
  }[]
}

const defaultLineChartData: Types = {
  labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  datasets: [
    {
      label: "Facebook Ads",
      color: "info",
      data: [50, 100, 200, 190, 400, 350, 500, 450, 700],
    },
    {
      label: "Google Ads",
      color: "dark",
      data: [10, 30, 40, 120, 150, 220, 280, 250, 280],
    },
  ],
}

export default defaultLineChartData
