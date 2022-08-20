// types
interface Types {
  labels: any
  datasets: any
}

const radarChartData: Types = {
  labels: ["English", "Maths", "Physics", "Chemistry", "Biology", "History"],
  datasets: [
    {
      label: "Student A",
      color: "dark",
      data: [65, 75, 70, 80, 60, 80],
      borderDash: [5, 5],
    },
    {
      label: "Student B",
      color: "info",
      data: [54, 65, 60, 70, 70, 75],
    },
  ],
}

export default radarChartData
