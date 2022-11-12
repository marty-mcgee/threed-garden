// types
interface Types {
  labels: any
  datasets: any
}

const defaultLineChartData: Types = {
  labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Mobile apps',
      color: 'info',
      data: [50, 40, 300, 220, 500, 250, 400, 230, 500],
    },
    {
      label: 'Websites',
      color: 'dark',
      data: [30, 90, 40, 140, 290, 290, 340, 230, 400],
    },
  ],
}

export default defaultLineChartData
