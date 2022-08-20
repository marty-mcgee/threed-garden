// types
interface Types {
  labels: any
  datasets: any
}

const defaultLineChartData: Types = {
  labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  datasets: [
    {
      label: "Organic Search",
      color: "info",
      data: [50, 40, 300, 220, 500, 250, 400, 230, 500],
    },
    {
      label: "Referral",
      color: "dark",
      data: [30, 90, 40, 140, 290, 290, 340, 230, 400],
    },
    {
      label: "Direct",
      color: "primary",
      data: [40, 80, 70, 90, 30, 90, 140, 130, 200],
    },
  ],
}

export default defaultLineChartData
